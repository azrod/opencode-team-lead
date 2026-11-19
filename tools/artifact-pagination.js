import { createHash } from "node:crypto";
import { resolve } from "node:path";

// Plugin policy, not the host's transport limit. Include the entire JSON payload.
export const PAGE_BYTES = 16_384;
export const MAX_CURSOR_BYTES = 1_024;

const messages = {
  INVALID_CURSOR: "Invalid pagination cursor. Restart without a cursor.",
  STALE_CURSOR: "Artifact changed during pagination. Discard previous pages and restart without a cursor.",
  PAGE_BUDGET_EXCEEDED: "Artifact metadata and page envelope leave insufficient room within the page budget.",
};

class PaginationError extends Error {
  constructor(code) {
    super(messages[code]);
    this.code = code;
  }
}

const digest = (text) => createHash("sha256").update(text).digest("hex");
const bytes = (value) => Buffer.byteLength(JSON.stringify(value), "utf8");

function splitsPair(text, position) {
  const before = text.charCodeAt(position - 1);
  const after = text.charCodeAt(position);
  return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff;
}

function decodeCursor(cursor, identity, content) {
  let value;
  try {
    if (typeof cursor !== "string" || !cursor || Buffer.byteLength(cursor, "utf8") > MAX_CURSOR_BYTES || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
      throw new Error();
    }
    const decoded = Buffer.from(cursor, "base64url");
    if (decoded.toString("base64url") !== cursor) throw new Error();
    value = JSON.parse(decoded.toString("utf8"));
    if (!value || Array.isArray(value) || Object.keys(value).sort().join(",") !== "a,h,p,t,v" ||
        value.v !== 1 || value.t !== identity.t || value.a !== identity.a ||
        typeof value.h !== "string" || !/^[a-f0-9]{64}$/.test(value.h) ||
        !Number.isSafeInteger(value.p) || value.p <= 0) throw new Error();
  } catch {
    throw new PaginationError("INVALID_CURSOR");
  }
  // Check the version before the range: a shorter edited file is stale, too.
  if (value.h !== identity.h) throw new PaginationError("STALE_CURSOR");
  if (value.p >= content.length || splitsPair(content, value.p)) throw new PaginationError("INVALID_CURSOR");
  return value.p;
}

/**
 * Return one lossless, bounded page. All state needed for continuation lives in
 * the cursor; identity is computed from caller-resolved paths, never cursor paths.
 * Metadata must come from the same complete read as content.
 */
export function paginateArtifact({ tool, projectRoot, artifactPath, content, metadata, cursor }) {
  const identity = {
    v: 1,
    t: tool,
    a: digest(JSON.stringify([resolve(projectRoot), resolve(artifactPath)])),
    h: digest(content),
  };
  const start = cursor === undefined ? 0 : decodeCursor(cursor, identity, content);
  const page = (end) => ({
    ...metadata,
    content: content.slice(start, end),
    pagination: {
      has_more: end < content.length,
      next_cursor: end < content.length
        ? Buffer.from(JSON.stringify({ ...identity, p: end })).toString("base64url")
        : null,
    },
  });

  // A final envelope is smaller than a continuing one. Try it independently;
  // do not assume envelope size is monotonic across the final-page transition.
  if (content.length - start <= PAGE_BYTES) {
    const final = page(content.length);
    if (bytes(final) <= PAGE_BYTES) return final;
  }

  let low = start + 1;
  let high = Math.min(content.length - 1, start + PAGE_BYTES);
  let best = start;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const end = splitsPair(content, middle) ? middle - 1 : middle;
    if (bytes(page(end)) <= PAGE_BYTES) {
      best = end;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  if (best <= start) throw new PaginationError("PAGE_BUDGET_EXCEEDED");

  const newline = content.lastIndexOf("\n", best - 1) + 1;
  if (newline > start) best = newline;
  else if (content[best - 1] === "\r" && content[best] === "\n" && best - 1 > start) best--;
  return page(best);
}

/** Preserve existing failure meaning without echoing unbounded input/paths. */
export function serializeGetterError(error) {
  const message = error instanceof Error ? error.message : String(error);
  let short = "";
  let count = 0;
  for (const point of message) {
    if (count++ === 256) break;
    short += point;
  }
  return JSON.stringify({
    error: short.length < message.length
      ? short + "… (diagnostic shortened) …" + Array.from(message.slice(-512)).slice(-256).join("")
      : short,
    ...(error instanceof PaginationError ? { code: error.code } : {}),
  });
}

/** Defense at the registered-tool boundary, including unexpected future fields. */
export function serializeGetterPage(page) {
  const serialized = JSON.stringify(page);
  return Buffer.byteLength(serialized, "utf8") <= PAGE_BYTES
    ? serialized
    : serializeGetterError(new PaginationError("PAGE_BUDGET_EXCEEDED"));
}
