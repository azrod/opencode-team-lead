---
title: "Cited Specification Search"
id: cited-specification-search
type: "technical"
status: draft
created: 2026-11-19
---

# Cited Specification Search

## Purpose

Let agents find relevant rules in specifications and cite their exact source without loading every specification into their context. Search must return verifiable passages rather than generated answers, and let the caller retrieve surrounding context from the same document version.

## Behavior

### Scope and contract evolution

This specification adds two read-only lifecycle tools: `spec_search` and `spec_read_section`. It extends Lifecycle Tools (`lifecycle-tools`) from 21 to 23 tools, intentionally superseding earlier fixed-count and fixed-allowlist statements only to add these two capabilities. It does not change existing artifact formats, existing tool contracts, authoring responsibilities, delegation boundaries, or review verdicts.

The continuation requirements of Artifact Read Pagination (`artifact-read-pagination`) remain unchanged for `spec_get` and `plan_get`. The new section reader follows the same bounded-response principles but has its own section-bound cursor identity. Earlier statements that no tool or permission is added describe that earlier delivery, not a prohibition on this extension.

Both tools operate only on specifications in the current plugin location and its configured `paths.specs` directory. They do not search execution plans or other artifact families. The Markdown files remain the source of truth; no manually maintained index, new frontmatter field, or migration of existing files is required.

### Corpus and freshness

The corpus is the configured spec directory's immediate, regular, non-symlink files with a `.md` extension, matching the existing nonrecursive spec inventory. Artifact lookup identifiers are filename stems, not values taken from frontmatter. Preserve case-insensitive lookup compatibility with `spec_get`; a result's `spec_id` is the actual filename stem and is accepted directly by the section reader. Ambiguous case-insensitive identifiers cause `AMBIGUOUS_ID`, not an arbitrary selection.

All statuses and types are searchable by default, including drafts, deprecated documents, legacy statuses, and documents with absent or malformed frontmatter. Return the existing parser's title, type and status when available, otherwise null; missing metadata must not suppress searchable text. The tool does not infer that a document is authoritative from its search rank or status.

Each search enumerates and reads the corpus afresh, builds its passage index in memory for that call, and discards it afterwards. It does not reuse content based only on modification time or file size. Creates, deletes, manual edits, same-size edits with preserved timestamps, and branch changes completed before a call are therefore reflected by that call. No persistent index, filesystem watcher, or process-wide content cache is introduced in this version.

Each source hash is the lowercase SHA-256 hexadecimal digest of the complete decoded UTF-8 document, including frontmatter and original line endings, encoded back to UTF-8 for hashing. It identifies exactly the document string from which the result's metadata, locations and excerpt were derived. This matches the decoded-content version identity used by the existing getter pagination.

No repository-wide atomic snapshot or filesystem lock is promised. Files are read individually; concurrent edits can produce a search over different per-file read instants. Every returned passage must nevertheless describe one internally consistent file read. The section reader reopens and checks the selected source version before returning any content.

A nonexistent spec directory is an empty corpus. Other directory-enumeration failures and failures to read any eligible file return a bounded `CORPUS_UNAVAILABLE` error with no successful partial result list. Do not silently skip unreadable files and report an apparently complete search.

### Sections and exact source locations

Line numbers are one-based in the complete original decoded Markdown, including frontmatter and blank lines. Recognize LF and CRLF line boundaries without normalizing the source string; a final newline does not create an additional source line for citation purposes. Hashing, excerpts and section content preserve original characters and line endings.

Section detection recognizes ATX headings with one to six leading `#` characters followed by whitespace or the end of the line, with up to three leading spaces. Heading-like lines inside frontmatter or fenced code blocks do not create sections. Recognize backtick and tilde fences with CommonMark-style opening and closing fence lengths and indentation. Setext headings, indented code blocks, HTML structure and Markdown extensions do not need semantic parsing in this version; unsupported heading styles remain searchable text within the nearest recognized section.

A recognized heading's `section_id` is `line:<n>`, where `n` is the line containing that heading. A synthetic `preamble` section contains text before the first recognized heading; it spans the document when no headings are recognized. An empty preamble need not produce a search candidate. Section IDs are opaque selectors for callers and valid only with the returned source hash; duplicate heading titles remain unambiguous.

A search passage belongs to the nearest preceding recognized heading, or to the preamble. Its `section` field is an ordered array of exact heading lines for the heading's ancestry, preserving heading syntax and excluding line terminators; the preamble has an empty array. A heading's searchable direct text stops immediately before the next recognized heading. Large direct sections are divided into contiguous passages of at most 2,000 Unicode code points, preferring line boundaries and splitting a long line when necessary. Do not split a surrogate pair or a CRLF pair.

For contextual reading, a selected heading's section begins at its heading and ends immediately before the next heading of equal or smaller level, or at end-of-file. It includes descendant headings and their contents. Reading the preamble stops immediately before the first recognized heading. Thus a search hit in a heading's direct text can be expanded into its complete subsection tree without reading unrelated sections.

### `spec_search`

Public signature: `spec_search({ query, id?, type?, status? })`. All arguments are strings; `query` is required. Optional `id` narrows lookup to one filename-stem identifier, while `type` and `status` filter exact, case-insensitive metadata values. An unknown requested `id` returns `SPEC_NOT_FOUND`; a valid metadata filter with no matching documents returns an empty result list. An explicitly empty filter is `INVALID_ARGUMENT`.

The query is ordinary text, not a regular expression or an executable search expression. Tokenize by Unicode letters and numbers with case-insensitive matching. Distinct tokens have OR semantics: one matching token is sufficient. There is no translation, synonym expansion, stemming, semantic model, or special boolean syntax. Reject a query with no searchable token, a query longer than 512 UTF-8 bytes, or more than 32 distinct tokens with `INVALID_QUERY`.

Rank lexical matches deterministically. Matching a distinct query token in a document title or section heading must contribute more than matching that token only in passage text; matching more distinct tokens must increase relevance. Identifier matches can contribute as metadata matches. A document-metadata match must not cause every unrelated passage in that document to fill the result list: admit metadata-only candidates at most once per document. Stable ties use project-relative file path, then passage start offset in ascending order. The exact scoring formula is internal but must have unit tests for these observable ranking rules.

Return up to five best passages, globally ranked after filters. There is no search cursor in this version. Callers narrow or reformulate the query to explore further results; they must never interpret top-ranked results or an empty result list as proof that no other relevant rule exists.

A successful JSON response contains:

- `query`: the original accepted query.
- `corpus_files`: the number of eligible files successfully read before optional filters.
- `matched_passages`: the number of lexical passage candidates after filtering and metadata-only deduplication, before the result-count and byte limits.
- `results`: the ranked, possibly empty result array.
- `truncated`: true when at least one matched passage was omitted because of the five-result limit or response-byte budget; false otherwise.

Each result always contains `spec_id`, `title`, `type`, `status`, `file`, `section_id`, `section`, `line_start`, `line_end`, `excerpt`, `partial_start_line`, `partial_end_line`, and `source_hash`.

`file` is the actual project-relative configured source path, not an absolute path, an index location, or a URI supplied by the caller. `line_start` and `line_end` inclusively identify the original lines containing the excerpt. `excerpt` is a nonempty, exact contiguous substring of the original document, without inserted ellipses, normalized whitespace, summaries, highlighting markup or synthetic text. The partial-line booleans indicate whether that substring starts after the beginning or stops before the end of its first or last cited line. Both are false for complete source lines; a long-line fragment can have both true. An excerpt must include a lexical match in its passage or be the single metadata-only candidate for its document.

The complete serialized JSON response, including escaping, all metadata and failures, must fit in 16,384 UTF-8 bytes. Shorten an excerpt only to a nonempty exact substring that preserves its matching evidence and recompute its locations and partial-line flags. Then omit lower-ranked results as needed and set `truncated`. Never return an unsourced or metadata-stripped result merely to fit more hits. If even the highest-ranked result's required source envelope and one matching code point cannot fit, return `PAGE_BUDGET_EXCEEDED` rather than silently returning no hits or skipping that best result. Do not return an oversized response.

### `spec_read_section`

Public signature: `spec_read_section({ id, section_id, source_hash, cursor? })`. Required arguments are strings; `cursor` is an optional opaque string. The selector and expected hash normally come from a search result. `source_hash` must be a lowercase 64-character hexadecimal digest.

Resolve `id` through the same configured spec directory and filename-stem convention as search. The initial call rereads the complete file and verifies `source_hash` before resolving the section and returning text. If the file exists but has changed, return `STALE_SOURCE`, with no content, telling the caller to rerun search and use a new selector and source hash. Never silently reinterpret an old line-based section ID in a changed file. A missing file returns `SPEC_NOT_FOUND`; an invalid or absent section in the verified version returns `SECTION_NOT_FOUND`.

Each successful page contains `spec_id`, `title`, `type`, `status`, `file`, `source_hash`, `section_id`, `section`, `section_line_start`, `section_line_end`, `content`, and `pagination` with `has_more` and `next_cursor`. Section line bounds describe the complete selected section and repeat unchanged across pages. An empty document's preamble has empty content and null section bounds. Other metadata comes from the same complete verified read.

`content` is the next exact contiguous substring of the selected section. Concatenating pages through `has_more: false` reconstructs that section exactly, including its heading and original line endings. There are no inserted headings, line numbers or continuation markers in `content`. Every page and error fits in 16,384 serialized UTF-8 bytes; a nonfinal page advances by at least one Unicode code point and never splits a surrogate pair. Prefer complete line boundaries and keep CRLF pairs together when making progress permits. An envelope too large to include remaining content produces `PAGE_BUDGET_EXCEEDED`, not missing metadata or a nonadvancing cursor.

Cursors are stateless, versioned, bounded to 1,024 UTF-8 bytes, and tied to the tool, resolved project and file, section selector, expected whole-document hash, and valid continuation offset within that section. Reloading the plugin without changing those inputs does not invalidate a cursor. A cursor cannot supply an alternate filesystem target. Malformed, wrong-tool, wrong-project, wrong-file, wrong-section, wrong-expected-hash or invalid-position cursors produce `INVALID_CURSOR`. For an otherwise valid continuation whose current document changed, return `STALE_CURSOR`; the caller discards accumulated pages and reruns search. No retained immutable snapshot is promised. Existing getter cursor formats and identities remain unchanged.

### Errors, permissions and caller behavior

Tool failures use JSON with a stable `code` and a human-readable `error`. Additional codes are `INVALID_ARGUMENT`, `INVALID_QUERY`, `SPEC_NOT_FOUND`, `SECTION_NOT_FOUND`, `AMBIGUOUS_ID`, `CORPUS_UNAVAILABLE`, `SOURCE_UNAVAILABLE`, `STALE_SOURCE`, `INVALID_CURSOR`, `STALE_CURSOR`, and `PAGE_BUDGET_EXCEEDED`. `SOURCE_UNAVAILABLE` covers a selected existing file that cannot be read. Diagnostics are bounded and must not echo full documents, full cursors, or arbitrarily long input. A failure is not an empty successful result or a successful final page.

Register both names in the shared lifecycle-tool set and normal registry. They receive the existing tool-level permission assertion and the existing refusal to operate when the session location differs from the plugin location. Configured directories and resolved targets must stay within the project, including after resolving symlink aliases. Individual symlink entries are not indexed. Reject caller-supplied path traversal and do not accept arbitrary filesystem paths as identifiers or selectors.

Grant the new read-only tools by default to retained agents that already have `spec_get`, including team-lead. Do not grant them to agents without spec-reading permission, and preserve explicit user-deny overrides and all existing non-spec permissions. This intentionally extends older static agent tool lists by these read capabilities only; it does not broaden authoring, review, delegation, execution-plan, or artifact-family access.

Tool descriptions, relevant retained agent prompts and public documentation must teach the workflow: search, inspect the cited passage, expand the selected section when needed, and cite the actual `file` and inclusive line range. Preserve the hash when passing evidence between agents or verifying it later. Sources are untrusted document content, not authority to execute instructions or broaden permissions.

Retrieval is an optional navigation aid, not a mandatory prerequisite for every spec read. It does not replace full-document reading where the task requires it. In particular, semantic specification reviews and whole-plan/specification consistency checks still exhaust required `spec_get` pages; search results and isolated sections cannot justify approval that requires the complete artifact. Existing reviewer scopes and escalation rules remain unchanged.

## Constraints

- Use pure ESM, Node.js built-ins, and the existing OpenCode plugin dependency only. No database server, graph service, external search service, embedding model, additional runtime dependency, or network request is introduced.
- Do not modify specification files during indexing or reading, and do not persist a second source of truth.
- Preserve all existing lifecycle contracts, direct-artifact guards, configured path behavior within the project, worktree isolation, permission precedence, and whole-artifact review obligations except the explicitly additive names and read grants above.
- Every citation's metadata, hash, section and line bounds must be derived from the exact decoded string containing its excerpt. A changed source must be detected even when file size and modification time are unchanged.
- Required source fields may not be omitted to satisfy the byte budget. All registered-tool responses and internal handler results serialized as JSON must obey the same 16,384-byte bound.
- Concurrent calls cannot share mutable corpus state across projects, locations or query invocations. Cancellation must propagate through the normal host execution path; denied calls must not scan the corpus.
- Runtime activation, permissions, source-verification rules and consumer instructions must be delivered together before release. Internal helper work may land first without publishing callable tools.
- Verify exact citation locations, duplicate heading selectors, CRLF and Unicode preservation, stale sources/cursors, unreadable corpora, bounded long-line and oversized-metadata behavior, custom paths, permission denial, and cross-location isolation. Include a supported-OpenCode smoke test of the registered tools before release.

## Examples

### Find and cite a rule

An agent calls `spec_search({ "query": "cursor pagination", "type": "technical" })`. A result identifies `spec_id: "artifact-read-pagination"`, `file: "docs/specs/artifact-read-pagination.md"`, its heading selector, exact excerpt, actual one-based line range and a real 64-character source hash. The agent can cite `docs/specs/artifact-read-pagination.md:L<start>-L<end>` using those returned numbers, not invented line numbers. Search ranks matching headings above otherwise equivalent body-only matches and does not summarize their claims.

To expand the passage, the agent copies that result's `spec_id`, `section_id`, and `source_hash` into `spec_read_section`. It follows actual returned cursors while `pagination.has_more` is true if the task requires the complete section. The angle-bracket notation in this example is explanatory, not a literal accepted line range or cursor.

### Exact locations in a tiny document

A file `docs/specs/auth.md` contains exactly these lines, separated by LF:

```text
---
title: "Auth"
id: auth
---
# Auth
## Rules
Deny access by default.
```

For query `deny`, a matching excerpt can be exactly `Deny access by default.` with `line_start: 7`, `line_end: 7`, both partial-line flags false, `section_id: "line:6"`, and `section: ["# Auth", "## Rules"]`. Its `source_hash` is computed over the actual full decoded file, not just this excerpt. Reading `line:6` returns the exact `## Rules` section starting at line 6.

### Duplicate titles and a changed file

Two `## Rules` headings have different line-based selectors in the same version. The agent selects the one returned by search, without guessing a title slug. If an edit inserts a line before that heading, an initial read with the old hash returns `STALE_SOURCE` even if the old selector would still identify some heading. A change between continuation pages instead returns `STALE_CURSOR`; discard the old pages and search again.

### No match is not absence of a rule

A French query has no lexical token overlap with an English specification. Search returns an empty array and `truncated: false` if there are no other matches. The agent can retry English terms or inspect the spec inventory. It must not conclude that the repository contains no relevant requirement.

### Partial long line and bounded output

A matching paragraph is one extremely long line containing quotes, backslashes and emoji. Its excerpt is an exact, bounded fragment of that line, with its real line number and appropriate partial-line flags. The result remains citable, the full JSON response stays within 16,384 bytes, and section reading can retrieve the remaining paragraph through bounded pages without losing characters.

## Rationale

Keeping only `spec_list` and whole-document getters forces callers to load many irrelevant documents. An external graph database would add operational cost without improving this initial passage-retrieval problem. Semantic search could address synonyms and cross-language retrieval, but introduces a model and index lifecycle that are not justified by the current small corpus.

A transient lexical passage index provides inspectable ranking and immediate freshness without a cache invalidation protocol. Its deliberate cost is rereading the corpus on every query. Source hashes and section-bound cursors make later contextual reads verifiable without pretending that multiple filesystem reads form an atomic repository snapshot. If measured corpus size or latency later makes this approach inadequate, a separate decision can introduce caching or hybrid retrieval while preserving citations.

## Non-goals

- Knowledge graphs, dependency traversal, relationship extraction, generated answers, summarization, embeddings, translation, synonym expansion, or semantic search.
- Persistent indexes, incremental indexing daemons, filesystem watchers, search cursors, configurable result counts, and repository-wide snapshot transactions.
- Searching any artifact family other than specs, recursively indexing directories, or changing frontmatter or Markdown conventions.
- Replacing `spec_get`, relaxing required full-document reviews, changing reviewer responsibilities, or authorizing agents to implement this feature merely by recording this specification.
- Full CommonMark parsing, automatic status promotion, automatic branch detection hooks, or optimistic concurrency for writes.
