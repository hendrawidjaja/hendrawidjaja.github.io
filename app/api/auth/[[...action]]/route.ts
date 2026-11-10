import { NextResponse } from "next/server";
import { changePasswordAction, loginAction, logoutAction, verifyAuthAction } from "@/app/actions";
import { checkRateLimit, clearFailures, recordFailure } from "@/src/server/rate-limit";

/**
 * All four auth endpoints in one route file, dispatched by the trailing
 * segment: /api/auth/{login,verify,change-password,logout}.
 * (Catch-all optional segment keeps the same URLs the client already calls.)
 */
type RouteContext = { params: Promise<{ action?: string[] }> };

/** Failed attempts allowed inside the window before 429s start. */
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const PASSWORD_LIMIT = 5;
const PASSWORD_WINDOW_MS = 15 * 60 * 1000;

/** Single parse for the Authorization bearer token across all endpoints. */
function bearerToken(request: Request): string {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
}

/**
 * Best-effort client identity for rate limiting. Behind a reverse proxy the
 * first X-Forwarded-For hop is the client; direct connections fall back to a
 * single shared bucket, which is fine for a single-admin deployment.
 */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "local";
}

/** Auth responses must never be cached (tokens, retry hints). */
function json(
  body: unknown,
  init?: { status?: number; retryAfterSec?: number },
): NextResponse {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (init?.retryAfterSec) headers["Retry-After"] = String(init.retryAfterSec);
  return NextResponse.json(body, { status: init?.status ?? 200, headers });
}

/** Parse a JSON object body; returns null for malformed or non-object payloads. */
async function parseBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const [action] = (await params).action ?? [];
  if (action !== "verify") {
    return json({ error: "Not found" }, { status: 404 });
  }
  const authenticated = await verifyAuthAction(bearerToken(request));
  return json({ authenticated });
}

export async function POST(request: Request, { params }: RouteContext) {
  const [action] = (await params).action ?? [];

  switch (action) {
    case "login": {
      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid request body" }, { status: 400 });

      const username = typeof body.username === "string" ? body.username : "";
      const password = typeof body.password === "string" ? body.password : "";
      const key = `login:${clientIp(request)}:${username.toLowerCase()}`;

      const limit = checkRateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS);
      if (limit.limited) {
        return json(
          { error: "Too many failed attempts. Try again later." },
          { status: 429, retryAfterSec: limit.retryAfterSec },
        );
      }

      try {
        const { token, user, mustChangePassword } = await loginAction(username, password);
        clearFailures(key);
        return json({ token, user, mustChangePassword });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Authentication failed";
        // Only real credential failures are 401s; misconfiguration must not
        // masquerade as a bad password.
        if (message === "Invalid credentials") {
          recordFailure(key, LOGIN_WINDOW_MS);
          return json({ error: message }, { status: 401 });
        }
        console.error("[auth] login failed:", message);
        return json({ error: "Authentication unavailable" }, { status: 500 });
      }
    }

    case "change-password": {
      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid request body" }, { status: 400 });

      const key = `change-password:${clientIp(request)}`;
      const limit = checkRateLimit(key, PASSWORD_LIMIT, PASSWORD_WINDOW_MS);
      if (limit.limited) {
        return json(
          { error: "Too many failed attempts. Try again later." },
          { status: 429, retryAfterSec: limit.retryAfterSec },
        );
      }

      try {
        const result = await changePasswordAction(
          bearerToken(request),
          typeof body.currentPassword === "string" ? body.currentPassword : "",
          typeof body.newPassword === "string" ? body.newPassword : "",
        );
        clearFailures(key);
        return json(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Authentication failed";
        // Only real auth failures consume the budget; policy violations are 400s.
        if (message === "Unauthorized" || message === "Current password incorrect") {
          recordFailure(key, PASSWORD_WINDOW_MS);
          return json({ error: message }, { status: 401 });
        }
        if (message.startsWith("New password")) {
          return json({ error: message }, { status: 400 });
        }
        console.error("[auth] password change failed:", message);
        return json({ error: "Authentication unavailable" }, { status: 500 });
      }
    }

    case "logout": {
      await logoutAction(bearerToken(request));
      return json({ ok: true });
    }

    default:
      return json({ error: "Not found" }, { status: 404 });
  }
}
