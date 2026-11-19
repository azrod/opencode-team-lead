---
title: "Artifact Read Pagination"
id: artifact-read-pagination
type: "technical"
status: draft
created: 2026-11-19
---

# Artifact Read Pagination

## Purpose

Make large specifications and execution plans readable through their lifecycle tools without returning an unbounded response that OpenCode may truncate or reject. A caller must be able to retrieve the complete decoded text in successive bounded responses and distinguish an unfinished read from a completed one.

## Behavior

### Scope and intentional contract evolution

This specification governs only `spec_get` and `plan_get`. It intentionally evolves their existing whole-document response contract described by the Lifecycle Tools specification (`lifecycle-tools`). Earlier API-preservation statements in that specification describe the scope of earlier deliveries; this later change replaces only the two getter contracts. Artifact formats, configured path resolution, access protection, permissions, other lifecycle operations, and reviewer responsibilities remain unchanged.

The public calls accept an artifact identifier and an optional opaque string cursor:

- `spec_get({ id, cursor? })`
- `plan_get({ id, cursor? })`

Omitting `cursor` starts at the beginning of the current file. Pagination is always active, including for calls that pass only `id`. There is no unbounded read mode and no caller-supplied page-size parameter. A small document still returns in one call.

### Response and continuation

A successful response preserves the existing `file`, `content`, and `frontmatter` fields. `plan_get` also preserves `blocks` with its existing `total` and `checked` fields. The new `pagination` object always contains:

- `has_more`: a boolean indicating whether unread text remains in this document version.
- `next_cursor`: a nonempty string when `has_more` is true, otherwise `null`.

`content` contains the next contiguous portion of the decoded UTF-8 file, including its frontmatter text where that text falls in the requested portion. No headings, line numbers, continuation notices, or other synthetic text are inserted into `content`.

The caller continues with the same tool and artifact `id`, passing `next_cursor` unchanged. The final response has `has_more: false` and `next_cursor: null`. A successful nonfinal page always consumes at least one complete Unicode code point. An empty file yields a single successful page with empty `content` if its response envelope fits the budget.

For an unchanged document, concatenating the `content` values from the initial response through the final response exactly reconstructs the string produced by the existing UTF-8 file read. Line endings, whitespace, and any final newline are preserved. Page boundaries favor complete lines when possible, but a long line must be split rather than returned oversized. A boundary must not split a Unicode surrogate pair. Line-aware boundary selection preserves a CRLF pair together when it can do so while making progress within the budget.

`file`, parsed `frontmatter`, and plan `blocks` describe the complete current file, not just the page, and are repeated unchanged across a successful read of that version. A malformed or absent frontmatter retains the current parser behavior; pagination does not introduce a new artifact validator.

### Response-size policy

The plugin's initial page budget is **16,384 UTF-8 bytes (16 KiB)**. This is a conservative plugin policy, not a claim about a documented OpenCode limit. Compatibility with the supported host must be verified before release; if the host cannot carry that payload, the policy and tests must be revised before handoff.

The budget applies to the complete serialized JSON string returned as the lifecycle tool's content: file path, content, metadata, pagination fields, JSON escaping, and any other returned fields. Measuring only the source substring is insufficient. OpenCode's own transport or message envelope is outside the plugin's byte measurement, so the real-host check must verify that the chosen payload leaves sufficient headroom.

If complete metadata plus the required envelope leaves no room for one code point of remaining text, the tool returns a bounded `PAGE_BUDGET_EXCEEDED` error instead of returning oversized data, omitting metadata, dropping content, or repeating a nonadvancing cursor. An empty-file response whose metadata alone exceeds the budget returns the same error. Oversized frontmatter is therefore a diagnosed limit, not a promise that every possible artifact is readable.

### Cursor validity and file changes

A cursor is tied to the getter family, the resolved artifact within the current project, the exact decoded content version, and a valid continuation position. The version identity must be derived from the complete content, not only file modification time or file size. Cursor use must still resolve the requested `id` through the existing configured artifact paths; a cursor cannot supply an alternate filesystem target or grant access.

The cursor is self-contained and does not depend on a process-local page cache or retained server snapshot. Identical accepted inputs against unchanged content produce the same page and continuation. Reloading the plugin without changing artifact identity, content, or pagination contract does not invalidate a cursor.

A supplied cursor must be a nonempty string no longer than 1,024 UTF-8 bytes. Malformed, unsupported-version, oversized, wrong-tool, wrong-artifact, or invalid-position cursors produce a bounded `INVALID_CURSOR` error. A caller must treat cursor text as opaque rather than calculate positions itself. Cursors are continuation markers, not authentication tokens or secrets.

If the resolved artifact still exists but its decoded content differs from the cursor's version, return `STALE_CURSOR` and tell the caller to discard the partial read and restart without a cursor. Do not mix pages from different versions. If the artifact no longer resolves or cannot be read, preserve the existing failure meaning; do not disguise it as a valid empty final page. These checks operate on the content read for the current call; no lock is held against subsequent file edits.

Errors use the existing JSON error-response style: a human-readable string in `error`, with an additional stable `code` for the pagination-specific failures above. Those error responses must also fit the budget. Diagnostics must not echo full cursors, frontmatter, document content, or arbitrarily long input. A pagination-specific failure returns no partial document page.

### Caller responsibilities

Tool descriptions, retained agent prompts that consume these getters, and public getter documentation must explain the continuation protocol. Instructions describing `spec_get(id)` or `plan_get(id)` as reading the entire document in one call must be corrected.

When a task requires a complete artifact read, including semantic review, the caller follows successive cursors until `has_more` is false before claiming the document has been read or the review is complete. A failed or truncated page is not end-of-file. A partial read cannot support an approval that requires the whole artifact. Existing reviewer scopes, verdicts, delegation rules, and error-escalation ownership are otherwise unchanged. A targeted lookup may stop early only when its task does not require the complete artifact.

After `STALE_CURSOR`, callers discard the accumulated pages before restarting. They must not update a document midway through a read and continue using its old cursor. `content` remains suitable for exact-string updates once the caller has collected the required text, including text that spans a page boundary. This contract does not add optimistic concurrency to update tools.

## Constraints

- Both public getters and their underlying lifecycle handlers must return bounded pages by default; direct internal calls must not silently retain an unbounded alternative.
- Every serialized response produced by the two registered tools must be at most 16,384 UTF-8 bytes, including failure diagnostics from missing or unreadable artifacts. Such diagnostics may be shortened to maintain the bound without returning a successful page.
- Content must be preserved exactly at the decoded-text level: no normalization, skipped characters, duplicate characters, or replacement of valid Unicode characters at page boundaries.
- Metadata must be computed from the same complete content read that supplies the page and its version identity. Plan block-counting semantics must not change.
- A successful nonfinal response must advance, return a valid next cursor, and remain within the byte budget even when its source contains JSON-escaped control characters, quotes, backslashes, or multibyte text.
- An unchanged file read through all pages must terminate and reconstruct the original decoded string. Pagination is stateless between calls and requires no new runtime dependency.
- Existing tool names, identifier lookup behavior, configured directories, project isolation, permission checks, and protected-artifact access rules must remain in force.
- No changes are made to other artifact families or unrelated lifecycle tools. No tool is added, removed, or granted a new permission.
- Runtime activation of pagination and corresponding consumer instructions must be delivered together; there must be no released state that silently treats the first page as the whole artifact.
- Verification must cover the serialized registered-tool response, not only a pagination helper's output, and include a supported-OpenCode smoke test before release.

## Examples

### One-page specification

A call to `spec_get({ "id": "small" })` returns the complete text in `content`, the existing file metadata, and:

```json
{ "pagination": { "has_more": false, "next_cursor": null } }
```

### Multi-page execution plan

The caller requests `plan_get({ "id": "large-plan" })`. The first response contains the beginning of the file, the whole plan's block counts, and `has_more: true`. It copies the actual `next_cursor` into `plan_get({ "id": "large-plan", "cursor": "<returned opaque cursor>" })` and repeats as needed. Only the response with `next_cursor: null` completes the read. The placeholder in this example is not an accepted literal cursor.

Concatenating all page contents reproduces the original text, even when a sentence, a fenced code block, or the exact string needed for a later update crosses a page boundary.

### Escaped and multibyte content

A file contains one very long line with quotes, backslashes, accented characters, and emoji. The getter returns multiple pages, each with a complete serialized response within 16,384 bytes. JSON decoding and concatenating `content` across those pages recovers the original string with every emoji intact.

### File changed between pages

The caller reads page one of a plan. The file is then edited, even if its length and modification time are unchanged. Reusing the old cursor returns:

```json
{ "error": "Artifact changed during pagination. Discard previous pages and restart without a cursor.", "code": "STALE_CURSOR" }
```

### Metadata exceeds the budget

A specification has a parsed frontmatter value too large to include in a bounded response. The getter returns a compact `PAGE_BUDGET_EXCEEDED` error. It does not silently omit the value or provide a misleading final page.

## Rationale

Keeping whole-document responses leaves the reported failure in place. Raising the host output limit merely moves the failure threshold and couples the plugin to host configuration. A line-count-only limit cannot bound a single long line. An opaque cursor with a total serialized-byte budget addresses the actual output boundary, preserves ordinary line breaks when practical, and detects mixed-version reads without requiring a persistent snapshot service.

The deliberate compatibility cost is behavioral: an existing `id`-only call returns a complete document only when it fits in one page. Existing response fields remain available, but all consumers requiring a full read must follow the new pagination fields. Repeating metadata keeps each page self-describing at the cost of a reduced content budget and an explicit oversized-metadata failure case.

## Non-goals

- Modifying application code as part of authoring this specification.
- Changing artifact storage formats or splitting stored documents into smaller files.
- Paginating list, state, validation, creation, or update responses.
- Adding full-text search, random-access line ranges, configurable page sizes, or an unbounded-read escape hatch.
- Guaranteeing bounded filesystem memory or streaming reads; the current full-file read may remain internal.
- Guaranteeing that an arbitrarily large document fits in a model's total context window. Pagination solves per-response size, not total context capacity.
- Adding locking, retained immutable snapshots, or concurrency control for artifact updates.
