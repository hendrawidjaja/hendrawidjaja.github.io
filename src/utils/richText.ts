/**
 * Rich-text helpers for CV content.
 *
 * Content is authored in a contentEditable editor and persisted as HTML inside the existing string fields (`summary`,
 * `description`, `highlights[]`, ...). Because those strings are rendered with `dangerouslySetInnerHTML`, every
 * value MUST pass through `sanitizeRichText` on write (server) and is rendered through an allowlist on read. Plain-text
 * values saved before this feature existed keep rendering correctly without migration.
 */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "mark",
  "code",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
};

const VOID_TAGS = new Set(["br"]);

/** Escape text so it can be embedded in HTML safely. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s), mailto and tel links survive. Everything else is dropped. */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return true;
  // Relative and anchor links are fine; protocol-relative is not.
  return /^(#|\/(?!\/))/i.test(trimmed);
}

/**
 * True when the string contains no HTML markup at all. Such values are legacy plain text and only need escaping + newline conversion.
 */
export function isPlainText(value: string): boolean {
  return !/<\/?[a-z][\s\S]*?>/i.test(value);
}

/** Turn legacy plain text into markup without interpreting it as HTML. */
export function plainTextToHtml(value: string): string {
  if (!value) return "";
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Strip an HTML string down to the allowlist.
 *
 * Runs on the server before persisting. Tolerant of malformed markup: unknown tags are unwrapped (their text is kept),
 * unknown attributes are dropped, and script/style content is removed outright rather than unwrapped.
 */
export function sanitizeRichText(input: unknown): string {
  if (typeof input !== "string") return "";
  let html = input;
  if (!html.trim()) return "";
  if (isPlainText(html)) return plainTextToHtml(html);

  // Remove dangerous elements together with their content before unwrapping.
  html = html.replace(
    /<(script|style|iframe|object|embed|svg|math|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    "",
  );

  // Self-closing / unclosed dangerous elements.
  html = html.replace(
    /<\/?(script|style|iframe|object|embed|svg|math|template|noscript|link|meta|base)\b[^>]*>/gi,
    "",
  );

  // Event handlers and inline styles, quoted or not.
  html = html.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  const stack: string[] = [];
  const output: string[] = [];
  const tagRe = /<\/?([a-z][a-z0-9]*)((?:\s[^>]*)?)\/?\s*>/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Biome Problem
  while ((match = tagRe.exec(html)) !== null) {
    output.push(html.slice(cursor, match.index));
    cursor = tagRe.lastIndex;

    const raw = match[0];
    const tag = match[1].toLowerCase();
    const isClosing = /^<\//.test(raw);
    const selfClosing = /\/>$/.test(raw) || VOID_TAGS.has(tag);

    if (!ALLOWED_TAGS.has(tag)) continue; // unwrap: drop the tag, keep the text

    if (isClosing) {
      const open = stack.lastIndexOf(tag);
      if (open !== -1) {
        for (let i = stack.length - 1; i >= open; i -= 1) {
          output.push(`</${stack[i]}>`);
        }
        stack.length = open;
      }
      continue;
    }

    const allowed = ALLOWED_ATTRS[tag];
    let attrs = "";
    if (allowed && match[2]) {
      const attrRe = /([a-z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/gi;
      let attrMatch: RegExpExecArray | null;

      // biome-ignore lint/suspicious/noAssignInExpressions: Biome Problem
      while ((attrMatch = attrRe.exec(match[2])) !== null) {
        const name = attrMatch[1].toLowerCase();
        if (!allowed.has(name)) continue;
        const value = attrMatch[2].replace(/^["']|["']$/g, "");
        if (name === "href") {
          if (!isSafeUrl(value)) continue;
          attrs += ` href="${escapeHtml(value)}"`;
        } else if (name === "rel") {
          attrs += ` rel="${escapeHtml(value)}"`;
        } else if (name === "target" && /^_(blank|self|parent|top)$/i.test(value)) {
          attrs += ` target="${escapeHtml(value)}"`;
        }
      }

      if (attrs.includes('target="_blank"') && !attrs.includes("rel=")) {
        attrs += ' rel="noopener noreferrer"';
      }
    }

    output.push(`<${tag}${attrs}>`);
    if (!selfClosing) stack.push(tag);
  }

  output.push(html.slice(cursor));
  for (let i = stack.length - 1; i >= 0; i -= 1) output.push(`</${stack[i]}>`);

  return output
    .join("")
    .replace(/<(p|li|ul|ol)>\s*<\/\1>/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Convert a stored value into safe HTML for rendering. Legacy plain text is
 * escaped and turned into paragraphs; rich values pass through the sanitizer.
 */
export function toRenderableHtml(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  return isPlainText(value) ? plainTextToHtml(value) : sanitizeRichText(value);
}

/** True when the stored value contains actual formatting worth rendering. */
export function hasRichText(value: unknown): boolean {
  return typeof value === "string" && !isPlainText(value) && value.trim().length > 0;
}