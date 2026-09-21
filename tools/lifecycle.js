// tools/lifecycle.js
// Nineteen deterministic bookkeeping tools for exec-plans, specs, and briefs.
// All functions are pure: they receive projectRoot + paths, do their work, and return data.
// No LLM involvement, no delegation — these run directly in the plugin process.

import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { join, dirname, isAbsolute, resolve, sep, basename } from "node:path";

// ── YAML frontmatter helpers ─────────────────────────────────────────────────

/**
 * Parse the YAML frontmatter block from a markdown string.
 * Returns a plain object with string values, or {} if absent / unparseable.
 * Supports only the simple "key: value" format used by these tools.
 *
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    if (key) result[key] = value;
  }
  return result;
}

// ── Path helpers ─────────────────────────────────────────────────────────────

/**
 * Resolve a relative artifact path against projectRoot.
 * If path is already absolute, return as-is.
 *
 * @param {string} projectRoot
 * @param {string} relPath
 * @returns {string}
 */
function resolveArtifact(projectRoot, relPath) {
  const resolved = isAbsolute(relPath) ? relPath : join(projectRoot, relPath);
  const normalizedRoot = resolve(projectRoot) + sep;
  const normalizedPath = resolve(resolved);
  if (!normalizedPath.startsWith(normalizedRoot)) {
    throw new Error(`Path escapes project root: ${relPath}`);
  }
  return normalizedPath;
}

/**
 * Count `- [x]` (checked) and `- [ ]` (unchecked) task items in content.
 *
 * @param {string} content
 * @returns {{ total: number, checked: number, unchecked: string[] }}
 */
function countBlocks(content) {
  const checkedMatches = content.match(/- \[x\] .+/g) ?? [];
  const uncheckedMatches = content.match(/- \[ \] .+/g) ?? [];
  const total = checkedMatches.length + uncheckedMatches.length;
  const unchecked = uncheckedMatches.map((l) => l.replace(/^- \[ \] /, "").trim());
  return { total, checked: checkedMatches.length, unchecked };
}

// ── Glob helper (no external deps) ──────────────────────────────────────────

/**
 * List all *.md files in a directory (non-recursive).
 * Returns relative-to-projectRoot paths.
 *
 * @param {string} projectRoot
 * @param {string} dirRelPath
 * @returns {Promise<string[]>}
 */
async function listMdFiles(projectRoot, dirRelPath) {
  const absDir = join(projectRoot, dirRelPath);
  try {
    const entries = await readdir(absDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => join(dirRelPath, e.name));
  } catch {
    return [];
  }
}

/**
 * Today's date as ISO string (YYYY-MM-DD).
 * @returns {string}
 */
function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── ID / slug helpers ────────────────────────────────────────────────────────

/**
 * Generate a filesystem-safe id from a human title.
 * Lowercases, replaces spaces with dashes, strips non-alphanumeric/dash chars.
 *
 * @param {string} title
 * @returns {string}
 */
function titleToId(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Find the absolute path of a .md file in `dir` whose name (without extension)
 * matches `id` (case-insensitive). Throws if not found.
 *
 * @param {string} projectRoot
 * @param {string} dir  Relative directory path
 * @param {string} id   Filename without extension
 * @returns {Promise<string>}
 */
async function resolveById(projectRoot, dir, id) {
  const absDir = join(projectRoot, dir);
  let entries;
  try {
    entries = await readdir(absDir, { withFileTypes: true });
  } catch {
    throw new Error(`Directory not found: ${dir} (looking for id "${id}")`);
  }
  const target = id.toLowerCase();
  const match = entries.find(
    (e) => e.isFile() && e.name.endsWith(".md") && e.name.slice(0, -3).toLowerCase() === target
  );
  if (!match) {
    throw new Error(`Artifact with id "${id}" not found in ${dir}`);
  }
  const finalPath = join(absDir, match.name);
  return resolveArtifact(projectRoot, finalPath);
}

// ── SPECS ────────────────────────────────────────────────────────────────────

/**
 * Get a spec by id (filename without extension).
 *
 * @param {string} projectRoot
 * @param {{ specs: string }} paths
 * @param {string} id
 * @returns {Promise<{ file: string, content: string, frontmatter: Record<string, string> }>}
 */
export async function specGet(projectRoot, paths, id) {
  const absPath = await resolveById(projectRoot, paths.specs, id);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Spec file not found: ${absPath}`);
  }
  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  return { file: relPath, content, frontmatter: parseFrontmatter(content) };
}

/**
 * Create a new spec file.
 *
 * @param {string} projectRoot
 * @param {{ specs: string }} paths
 * @param {string} title
 * @param {"technical"|"functional"|"architectural"} [type]
 * @param {string|null} [content]
 * @returns {Promise<{ created: true, file: string, id: string }>}
 */
export async function specCreate(projectRoot, paths, title, type = "technical", content = null) {
  const id = titleToId(title);
  if (!id) throw new Error(`Cannot derive id from title: "${title}"`);
  const relPath = join(paths.specs, `${id}.md`);
  const absPath = resolveArtifact(projectRoot, relPath);

  await mkdir(dirname(absPath), { recursive: true });

  const headingTitle = title.replace(/[\r\n]/g, " ");
  const safeTitle = headingTitle.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const safeType = `"${(type ?? "technical").replace(/[\r\n]/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  const frontmatter = `---\ntitle: "${safeTitle}"\nid: ${id}\ntype: ${safeType}\nstatus: draft\ncreated: ${today()}\n---\n`;
  const body = content != null ? `\n${content}` : `\n# ${headingTitle}\n`;
  try {
    await writeFile(absPath, frontmatter + body, { encoding: "utf-8", flag: "wx" });
  } catch (err) {
    if (err.code === "EEXIST") throw new Error(`Spec "${id}" already exists at ${relPath}`);
    throw err;
  }

  return { created: true, file: relPath, id };
}

/**
 * Update a spec by replacing oldString with newString.
 *
 * @param {string} projectRoot
 * @param {{ specs: string }} paths
 * @param {string} id
 * @param {string} oldString
 * @param {string} newString
 * @returns {Promise<{ file: string, updated: true }>}
 */
export async function specUpdate(projectRoot, paths, id, oldString, newString) {
  const absPath = await resolveById(projectRoot, paths.specs, id);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Spec file not found: ${absPath}`);
  }

  const occurrences = content.split(oldString).length - 1;
  if (occurrences === 0) {
    throw new Error(`oldString not found in spec "${id}"`);
  }
  if (occurrences > 1) {
    throw new Error(
      `Found ${occurrences} matches for oldString in spec "${id}". Provide more surrounding context to make it unique.`
    );
  }

  const updated = content.replace(oldString, () => newString);
  await writeFile(absPath, updated, "utf-8");

  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  return { file: relPath, updated: true };
}

/**
 * Validate a spec structurally (no LLM).
 *
 * @param {string} projectRoot
 * @param {{ specs: string }} paths
 * @param {string} id
 * @returns {Promise<{ file: string, valid: boolean, issues: string[] }>}
 */
export async function specValidate(projectRoot, paths, id) {
  const absPath = await resolveById(projectRoot, paths.specs, id);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Spec file not found: ${absPath}`);
  }

  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  const issues = [];
  const fm = parseFrontmatter(content);
  const hasFrontmatter = /^---\r?\n/.test(content);

  if (!hasFrontmatter) {
    issues.push("Frontmatter block is missing");
  } else {
    if (!fm.title) issues.push("Frontmatter field 'title' is missing or empty");
    if (!fm.id) issues.push("Frontmatter field 'id' is missing or empty");
  }

  // Body check: strip frontmatter and see if non-whitespace content remains
  const bodyWithoutFm = hasFrontmatter
    ? content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
    : content;
  if (!bodyWithoutFm.trim()) {
    issues.push("Spec body is empty (no content beyond frontmatter)");
  }

  return { file: relPath, valid: issues.length === 0, issues };
}

/**
 * List all specs.
 *
 * @param {string} projectRoot
 * @param {{ specs: string }} paths
 * @returns {Promise<{ specs: Array<{ file: string, title: string|null, id: string|null, type: string|null, status: string|null, created: string|null }> }>}
 */
export async function specList(projectRoot, paths) {
  const files = await listMdFiles(projectRoot, paths.specs);
  const specs = await Promise.all(
    files.map(async (file) => {
      let content;
      try {
        content = await readFile(join(projectRoot, file), "utf-8");
      } catch (err) {
        return { file, error: `unreadable: ${err.message}` };
      }
      const fm = parseFrontmatter(content);
      return {
        file,
        title: fm.title ?? null,
        id: fm.id ?? null,
        type: fm.type ?? null,
        status: fm.status ?? null,
        created: fm.created ?? null,
      };
    })
  );
  return { specs };
}

/**
 * Delete a spec by id.
 *
 * @param {string} projectRoot
 * @param {{ specs: string }} paths
 * @param {string} id
 * @returns {Promise<{ deleted: true, file: string }>}
 */
export async function specDelete(projectRoot, paths, id) {
  const absPath = await resolveById(projectRoot, paths.specs, id);
  try {
    await unlink(absPath);
  } catch {
    throw new Error(`Failed to delete spec "${id}" at ${absPath}`);
  }
  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  return { deleted: true, file: relPath };
}

// ── PLANS ────────────────────────────────────────────────────────────────────

/**
 * Get a plan by id.
 *
 * @param {string} projectRoot
 * @param {{ execPlans: string }} paths
 * @param {string} id
 * @returns {Promise<{ file: string, content: string, frontmatter: Record<string, string>, blocks: { total: number, checked: number } }>}
 */
export async function planGet(projectRoot, paths, id) {
  const absPath = await resolveById(projectRoot, paths.execPlans, id);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Plan file not found: ${absPath}`);
  }
  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  const { total, checked } = countBlocks(content);
  return {
    file: relPath,
    content,
    frontmatter: parseFrontmatter(content),
    blocks: { total, checked },
  };
}

/**
 * Create a new exec-plan.
 *
 * @param {string} projectRoot
 * @param {{ execPlans: string }} paths
 * @param {{ title: string, functional_objective: string, content?: string|null, brief?: string|null }} options
 * @returns {Promise<{ created: true, file: string, id: string }>}
 */
export async function planCreate(projectRoot, paths, { title, functional_objective, content = null, brief = null }) {
  if (!functional_objective || !functional_objective.trim()) {
    throw new Error(
      `planCreate requires a non-empty 'functional_objective'. Provide 2-4 sentences describing what success looks like.`
    );
  }
  if (!title || !title.trim()) {
    throw new Error(`planCreate requires a non-empty 'title'.`);
  }

  const id = titleToId(title);
  if (!id) throw new Error(`Cannot derive id from title: "${title}"`);
  const relPath = join(paths.execPlans, `${id}.md`);
  const absPath = resolveArtifact(projectRoot, relPath);

  await mkdir(dirname(absPath), { recursive: true });

  const safeBrief = brief ? `"${brief.replace(/[\r\n]/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : null;
  const lines = ["---", `created: ${today()}`];
  if (safeBrief) lines.push(`brief: ${safeBrief}`);
  lines.push("---", "");
  lines.push("## Goal", "");
  lines.push(title, "");
  lines.push("## Functional objective", "");
  lines.push(functional_objective.trim(), "");
  lines.push("## Scope", "");
  if (content) lines.push(content.trim(), "");
  lines.push("## Building blocks", "");
  lines.push("## Decision log", "");

  try {
    await writeFile(absPath, lines.join("\n"), { encoding: "utf-8", flag: "wx" });
  } catch (err) {
    if (err.code === "EEXIST") throw new Error(`Plan "${id}" already exists at ${relPath}`);
    throw err;
  }

  return { created: true, file: relPath, id };
}

/**
 * Update a plan by replacing oldString with newString.
 *
 * @param {string} projectRoot
 * @param {{ execPlans: string }} paths
 * @param {string} id
 * @param {string} oldString
 * @param {string} newString
 * @returns {Promise<{ file: string, updated: true }>}
 */
export async function planUpdate(projectRoot, paths, id, oldString, newString) {
  const absPath = await resolveById(projectRoot, paths.execPlans, id);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Plan file not found: ${absPath}`);
  }

  const occurrences = content.split(oldString).length - 1;
  if (occurrences === 0) {
    throw new Error(`oldString not found in plan "${id}"`);
  }
  if (occurrences > 1) {
    throw new Error(
      `Found ${occurrences} matches for oldString in plan "${id}". Provide more surrounding context to make it unique.`
    );
  }

  const updated = content.replace(oldString, () => newString);
  await writeFile(absPath, updated, "utf-8");

  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  return { file: relPath, updated: true };
}

/**
 * Validate a plan structurally (no LLM).
 *
 * @param {string} projectRoot
 * @param {{ execPlans: string }} paths
 * @param {string} id
 * @returns {Promise<{ file: string, valid: boolean, issues: string[] }>}
 */
export async function planValidate(projectRoot, paths, id) {
  const absPath = await resolveById(projectRoot, paths.execPlans, id);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Plan file not found: ${absPath}`);
  }

  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  const issues = [];
  const hasFrontmatter = /^---\r?\n/.test(content);

  if (!hasFrontmatter) {
    issues.push("Frontmatter block is missing");
  }

  // Check for ## Functional objective section with content
  const foMatch = content.match(/## Functional objective\r?\n+([\s\S]*?)(?=\n##|\s*$)/);
  if (!foMatch) {
    issues.push("Section '## Functional objective' is missing");
  } else if (!foMatch[1].trim()) {
    issues.push("Section '## Functional objective' is present but empty");
  }

  // Check for ## Building blocks section
  if (!/## Building blocks/.test(content)) {
    issues.push("Section '## Building blocks' is missing");
  }

  // Check for at least one block
  const hasBlock = /- \[[ x]\] /i.test(content);
  if (!hasBlock) {
    issues.push("No task blocks found (expected at least one '- [ ]' or '- [x]')");
  }

  return { file: relPath, valid: issues.length === 0, issues };
}

/**
 * Mark a block as done in a plan ([ ] → [x]).
 *
 * @param {string} projectRoot
 * @param {{ execPlans: string }} paths
 * @param {string} planId
 * @param {string} blockName
 * @returns {Promise<object>}
 */
export async function planBlockDone(projectRoot, paths, planId, blockName) {
  const absPath = await resolveById(projectRoot, paths.execPlans, planId);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Plan file not found: ${absPath}`);
  }

  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  const blockPattern = /^- \[[ x]\] /i;

  const matchingIndices = lines
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => blockPattern.test(line) && line.toLowerCase().includes(blockName.toLowerCase()))
    .map(({ i }) => i);

  if (matchingIndices.length === 0) {
    const availableBlocks = lines
      .filter((l) => blockPattern.test(l))
      .map((l) => l.replace(/^- \[[ x]\] /i, "").trim());
    throw new Error(
      `Block "${blockName}" not found in ${relPath}.\nAvailable blocks:\n${availableBlocks.map((b) => `  - ${b}`).join("\n")}`
    );
  }

  if (matchingIndices.length > 1) {
    const matches = matchingIndices.map((i) => lines[i].trim());
    throw new Error(
      `"${blockName}" matches multiple blocks in ${relPath} — be more specific:\n${matches.map((m) => `  - ${m}`).join("\n")}`
    );
  }

  const idx = matchingIndices[0];
  const wasChecked = /^- \[x\]/i.test(lines[idx]);
  lines[idx] = lines[idx].replace(/^(- \[)[ x](\] )/i, "$1x$2");
  const newContent = lines.join(eol);

  await writeFile(absPath, newContent, "utf-8");

  const { total, checked } = countBlocks(newContent);
  const all_done = total > 0 && checked === total;

  const result = {
    file: relPath,
    block: blockName,
    was: wasChecked ? "checked" : "unchecked",
    now: "checked",
    blocks: { total, checked },
    all_done,
  };

  if (all_done) {
    result.hint = `All blocks are done. Use plan_update('${basename(relPath, ".md")}') to update the plan status or add notes.`;
  }

  return result;
}

/**
 * List all plans.
 *
 * @param {string} projectRoot
 * @param {{ execPlans: string }} paths
 * @returns {Promise<{ plans: Array<{ file: string, title: string|null, brief: string|null, blocks: { total: number, checked: number } }> }>}
 */
export async function planList(projectRoot, paths) {
  const files = await listMdFiles(projectRoot, paths.execPlans);
  const plans = await Promise.all(
    files.map(async (file) => {
      let content;
      try {
        content = await readFile(join(projectRoot, file), "utf-8");
      } catch (err) {
        return { file, error: `unreadable: ${err.message}` };
      }
      const fm = parseFrontmatter(content);
      const { total, checked } = countBlocks(content);

      // Try to extract title from ## Goal section
      const goalMatch = content.match(/## Goal\r?\n+([^\n#]+)/);
      const title = goalMatch ? goalMatch[1].trim() : (fm.title ?? null);

      return {
        file,
        title,
        brief: fm.brief ?? null,
        blocks: { total, checked },
      };
    })
  );
  return { plans };
}

/**
 * Delete a plan by id.
 *
 * @param {string} projectRoot
 * @param {{ execPlans: string }} paths
 * @param {string} id
 * @returns {Promise<{ deleted: true, file: string }>}
 */
export async function planDelete(projectRoot, paths, id) {
  const absPath = await resolveById(projectRoot, paths.execPlans, id);
  try {
    await unlink(absPath);
  } catch {
    throw new Error(`Failed to delete plan "${id}" at ${absPath}`);
  }
  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  return { deleted: true, file: relPath };
}

// ── BRIEFS ───────────────────────────────────────────────────────────────────

/**
 * Get a brief by id.
 *
 * @param {string} projectRoot
 * @param {{ briefs: string }} paths
 * @param {string} id
 * @returns {Promise<{ file: string, content: string, frontmatter: Record<string, string> }>}
 */
export async function briefGet(projectRoot, paths, id) {
  const absPath = await resolveById(projectRoot, paths.briefs, id);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Brief file not found: ${absPath}`);
  }
  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  return { file: relPath, content, frontmatter: parseFrontmatter(content) };
}

/**
 * Create a new brief.
 *
 * @param {string} projectRoot
 * @param {{ briefs: string }} paths
 * @param {{ title: string, content?: string|null, exec_plan?: string|null }} options
 * @returns {Promise<{ created: true, file: string, id: string }>}
 */
export async function briefCreate(projectRoot, paths, { title, content = null, exec_plan = null }) {
  if (!title || !title.trim()) {
    throw new Error(`briefCreate requires a non-empty 'title'.`);
  }

  const id = titleToId(title);
  if (!id) throw new Error(`Cannot derive id from title: "${title}"`);
  const relPath = join(paths.briefs, `${id}.md`);
  const absPath = resolveArtifact(projectRoot, relPath);

  await mkdir(dirname(absPath), { recursive: true });

  const headingTitle = title.replace(/[\r\n]/g, " ");
  const safeTitle = headingTitle.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const safeExecPlan = exec_plan ? `"${exec_plan.replace(/[\r\n]/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : null;
  const lines = ["---", `title: "${safeTitle}"`, `id: ${id}`, `created: ${today()}`];
  if (safeExecPlan) lines.push(`exec_plan: ${safeExecPlan}`);
  lines.push("---", "", `# ${headingTitle}`, "");
  if (content) lines.push(content.trim(), "");

  try {
    await writeFile(absPath, lines.join("\n"), { encoding: "utf-8", flag: "wx" });
  } catch (err) {
    if (err.code === "EEXIST") throw new Error(`Brief "${id}" already exists at ${relPath}`);
    throw err;
  }

  return { created: true, file: relPath, id };
}

/**
 * Update a brief by replacing oldString with newString.
 *
 * @param {string} projectRoot
 * @param {{ briefs: string }} paths
 * @param {string} id
 * @param {string} oldString
 * @param {string} newString
 * @returns {Promise<{ file: string, updated: true }>}
 */
export async function briefUpdate(projectRoot, paths, id, oldString, newString) {
  const absPath = await resolveById(projectRoot, paths.briefs, id);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Brief file not found: ${absPath}`);
  }

  const occurrences = content.split(oldString).length - 1;
  if (occurrences === 0) {
    throw new Error(`oldString not found in brief "${id}"`);
  }
  if (occurrences > 1) {
    throw new Error(
      `Found ${occurrences} matches for oldString in brief "${id}". Provide more surrounding context to make it unique.`
    );
  }

  const updated = content.replace(oldString, () => newString);
  await writeFile(absPath, updated, "utf-8");

  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  return { file: relPath, updated: true };
}

/**
 * Delete a brief by id.
 *
 * @param {string} projectRoot
 * @param {{ briefs: string }} paths
 * @param {string} id
 * @returns {Promise<{ deleted: true, file: string }>}
 */
export async function briefDelete(projectRoot, paths, id) {
  const absPath = await resolveById(projectRoot, paths.briefs, id);
  try {
    await unlink(absPath);
  } catch {
    throw new Error(`Failed to delete brief "${id}" at ${absPath}`);
  }
  const relPath = absPath.slice(resolve(projectRoot).length + 1);
  return { deleted: true, file: relPath };
}

/**
 * List all briefs.
 *
 * @param {string} projectRoot
 * @param {{ briefs: string }} paths
 * @returns {Promise<{ briefs: Array<{ file: string, title: string|null, id: string|null, exec_plan: string|null, created: string|null }> }>}
 */
export async function briefList(projectRoot, paths) {
  const files = await listMdFiles(projectRoot, paths.briefs);
  const briefs = await Promise.all(
    files.map(async (file) => {
      let content;
      try {
        content = await readFile(join(projectRoot, file), "utf-8");
      } catch (err) {
        return { file, error: `unreadable: ${err.message}` };
      }
      const fm = parseFrontmatter(content);
      return {
        file,
        title: fm.title ?? null,
        id: fm.id ?? null,
        exec_plan: fm.exec_plan ?? null,
        created: fm.created ?? null,
      };
    })
  );
  return { briefs };
}

// ── GLOBAL ───────────────────────────────────────────────────────────────────

/**
 * Produce a structured report of the current state of management artifacts.
 * Returns specs (all) and active_plans (only plans with unchecked blocks).
 * Briefs are excluded — consult them explicitly via briefList().
 *
 * @param {string} projectRoot  Absolute path to the project root
 * @param {{ specs: string, execPlans: string, briefs: string }} paths
 * @returns {Promise<{ specs: Array, active_plans: Array }>}
 */
export async function projectState(projectRoot, paths) {
  const [specFiles, planFiles] = await Promise.all([
    listMdFiles(projectRoot, paths.specs),
    listMdFiles(projectRoot, paths.execPlans),
  ]);

  // ── specs ────────────────────────────────────────────────────────────────
  const specs = await Promise.all(
    specFiles.map(async (file) => {
      let content;
      try {
        content = await readFile(join(projectRoot, file), "utf-8");
      } catch (err) {
        return { file, error: `unreadable: ${err.message}` };
      }
      const fm = parseFrontmatter(content);
      return {
        file,
        title: fm.title ?? null,
        id: fm.id ?? null,
        type: fm.type ?? null,
        status: fm.status ?? null,
        created: fm.created ?? null,
      };
    })
  );

  // ── active plans (at least one unchecked block) ──────────────────────────
  const allPlans = await Promise.all(
    planFiles.map(async (file) => {
      let content;
      try {
        content = await readFile(join(projectRoot, file), "utf-8");
      } catch (err) {
        return { file, blocks: { total: 0, checked: 0 }, error: `unreadable: ${err.message}` };
      }
      const { total, checked } = countBlocks(content);
      return { file, blocks: { total, checked } };
    })
  );
  const active_plans = allPlans.filter((p) => p.blocks.total === 0 || p.blocks.checked < p.blocks.total);

  return { specs, active_plans };
}
