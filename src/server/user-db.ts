import { Pool } from "pg";

/**
 * Postgres-backed user store.
 *
 * Only used when `DATABASE_URL` is set. Without it the app falls back to the
 * legacy single-admin JSON file (`data/auth-config.json`) and registration is
 * unavailable.
 */

export interface DbUser {
  hash: string;
  iterations: number;
  salt: string;
  tokenVersion: number;
  username: string;
}

export function hasUserDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

type GlobalWithPool = typeof globalThis & {
  __cvPgPool?: Pool;
  __cvPgSchema?: Promise<void>;
};

/** Reuse one pool across hot reloads and warm serverless invocations. */
const globalForPg = globalThis as GlobalWithPool;

/**
 * Memoized pool constructor. `pg` is imported lazily so a deployment without
 * `DATABASE_URL` never tries to load it — on serverless hosts the package is an
 * external dependency and an eager require would crash the whole route module.
 */
let poolPromise: Promise<Pool> | null = null;

function isLocalHost(connectionString: string): boolean {
  return /(^|@)(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(connectionString);
}

function pool(): Promise<Pool> {
  if (globalForPg.__cvPgPool) return Promise.resolve(globalForPg.__cvPgPool);
  if (!poolPromise) {
    poolPromise = (async () => {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
      }
      const created = new Pool({
        connectionString,
        max: 3,
        // Hosted Postgres (Neon/Supabase/Render) requires TLS; local dev usually not.
        ssl: isLocalHost(connectionString) ? undefined : { rejectUnauthorized: false },
      });
      globalForPg.__cvPgPool = created;
      return created;
    })().finally(() => {
      poolPromise = null;
    });
  }
  return poolPromise;
}

async function ensureSchema(): Promise<void> {
  if (!globalForPg.__cvPgSchema) {
    globalForPg.__cvPgSchema = (async () => {
      const client = await pool();
      await client.query(`
        CREATE TABLE IF NOT EXISTS app_users (
          id BIGSERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          iterations INTEGER NOT NULL,
          token_version INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS app_users_username_lower_idx
          ON app_users (lower(username));
      `);
    })().catch((error) => {
      // Allow a later request to retry after a transient failure.
      globalForPg.__cvPgSchema = undefined;
      throw error;
    });
  }
  return globalForPg.__cvPgSchema;
}

interface UserRow {
  iterations: number;
  password_hash: string;
  salt: string;
  token_version: number;
  username: string;
}

function toUser(row: UserRow): DbUser {
  return {
    username: row.username,
    hash: row.password_hash,
    salt: row.salt,
    iterations: row.iterations,
    tokenVersion: row.token_version,
  };
}

export async function countUsers(): Promise<number> {
  await ensureSchema();
  const client = await pool();
  const result = await client.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM app_users",
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function findUserByUsername(username: string): Promise<DbUser | null> {
  await ensureSchema();
  const client = await pool();
  const result = await client.query<UserRow>(
    `SELECT username, password_hash, salt, iterations, token_version
       FROM app_users
      WHERE lower(username) = lower($1)
      LIMIT 1`,
    [username],
  );
  const row = result.rows[0];
  return row ? toUser(row) : null;
}

/**
 * Insert the first user atomically. Returns `null` when the table is no longer
 * empty, so two concurrent registrations cannot both become the first account.
 */
export async function createFirstUser(user: DbUser): Promise<DbUser | null> {
  await ensureSchema();
  const db = await pool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    // Serialize "is this the first user?" checks across concurrent requests.
    await client.query("SELECT pg_advisory_xact_lock(763421)");
    const count = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM app_users",
    );
    if (Number(count.rows[0]?.count ?? 0) > 0) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query(
      `INSERT INTO app_users (username, password_hash, salt, iterations, token_version)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.username, user.hash, user.salt, user.iterations, user.tokenVersion],
    );
    await client.query("COMMIT");
    return user;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserPassword(
  username: string,
  password: {
    hash: string;
    iterations: number;
    salt: string;
    tokenVersion: number;
  },
): Promise<boolean> {
  await ensureSchema();
  const client = await pool();
  const result = await client.query(
    `UPDATE app_users
        SET password_hash = $2, salt = $3, iterations = $4, token_version = $5
      WHERE lower(username) = lower($1)`,
    [username, password.hash, password.salt, password.iterations, password.tokenVersion],
  );
  return (result.rowCount ?? 0) > 0;
}