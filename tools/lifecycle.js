// tools/lifecycle.js
// Five deterministic bookkeeping tools for exec-plans, specs, and briefs.
// All functions are pure: they receive projectRoot + paths, do their work, and return data.
// No LLM involvement, no delegation — these run directly in the plugin process.

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join, dirname, isAbsolute, resolve, sep } from "node:path";
import { existsSync } from "node:fs";

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
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Replace or insert a key:value pair in the frontmatter block of a markdown string.
 * Creates the frontmatter block if absent.
 *
 * @param {string} content
 * @param {string} key
 * @param {string} value
 * @returns {string}
 */
function setFrontmatterField(content, key, value) {
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  const fmMatch = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!fmMatch) {
    return `---${eol}${key}: ${value}${eol}---${eol}${eol}${content}`;
  }
  const [full, open, body, close] = fmMatch;
  const lines = body.split(/\r?\n/);
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyRegex = new RegExp(`^${escapedKey}\\s*:`, "m");
  const idx = lines.findIndex((l) => keyRegex.test(l));
  if (idx !== -1) {
    lines[idx] = `${key}: ${value}`;
  } else {
    lines.push(`${key}: ${value}`);
  }
  return content.replace(full, `${open}${lines.join(eol)}${close}`);
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

// ── project_state ────────────────────────────────────────────────────────────

/**
 * Produce a structured report of the current state of management artifacts.
 *
 * @param {string} projectRoot  Absolute path to the project root
 * @param {{ specs: string, execPlans: string, briefs: string }} paths
 * @returns {Promise<object>}
 */
export async function projectState(projectRoot, paths) {
  const [specFiles, planFiles, briefFiles] = await Promise.all([
    listMdFiles(projectRoot, paths.specs),
    listMdFiles(projectRoot, paths.execPlans),
    listMdFiles(projectRoot, paths.briefs),
  ]);

  // ── specs ────────────────────────────────────────────────────────────────
  const specs = await Promise.all(
    specFiles.map(async (file) => {
      const content = await readFile(join(projectRoot, file), "utf-8");
      const fm = parseFrontmatter(content);
      return {
        file,
        title: fm.title ?? null,
        id: fm.id ?? null,
        criticality: fm.criticality ?? null,
        status: fm.status ?? null,
        created: fm.created ?? null,
      };
    })
  );

  // ── exec-plans ───────────────────────────────────────────────────────────
  const exec_plans = await Promise.all(
    planFiles.map(async (file) => {
      const content = await readFile(join(projectRoot, file), "utf-8");
      const fm = parseFrontmatter(content);
      const { total, checked } = countBlocks(content);
      const entry = {
        file,
        status: fm.status ?? null,
        brief: fm.brief ?? null,
        brief_exists: fm.brief ? existsSync(resolveArtifact(projectRoot, fm.brief)) : null,
        blocks: { total, checked },
      };
      if (total > 0 && checked === total && fm.status !== "completed") {
        entry.warning = "tous les blocs sont cochés mais status != completed";
      }
      return entry;
    })
  );

  // ── briefs ───────────────────────────────────────────────────────────────
  const briefs = await Promise.all(
    briefFiles.map(async (file) => {
      const content = await readFile(join(projectRoot, file), "utf-8");
      const fm = parseFrontmatter(content);
      return {
        file,
        project: fm.project ?? null,
        type: fm.type ?? null,
        status: fm.status ?? null,
        exec_plan: fm.exec_plan ?? null,
        exec_plan_exists: fm.exec_plan ? existsSync(resolveArtifact(projectRoot, fm.exec_plan)) : null,
      };
    })
  );

  return { specs, exec_plans, briefs };
}

// ── mark_block_done ──────────────────────────────────────────────────────────

/**
 * Check a specific block in an exec-plan ([ ] → [x]).
 *
 * @param {string} projectRoot
 * @param {string} planFile  Relative path to the exec-plan
 * @param {string} blockName  Substring to match against block lines
 * @returns {Promise<object>}
 */
export async function markBlockDone(projectRoot, planFile, blockName) {
  const absPath = resolveArtifact(projectRoot, planFile);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Fichier introuvable : ${planFile}`);
  }

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
      `Bloc "${blockName}" introuvable dans ${planFile}.\nBlocs disponibles :\n${availableBlocks.map((b) => `  - ${b}`).join("\n")}`
    );
  }

  if (matchingIndices.length > 1) {
    const matches = matchingIndices.map((i) => lines[i].trim());
    throw new Error(
      `"${blockName}" correspond à plusieurs blocs dans ${planFile} — précisez davantage :\n${matches.map((m) => `  - ${m}`).join("\n")}`
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
    file: planFile,
    block: blockName,
    was: wasChecked ? "checked" : "unchecked",
    now: "checked",
    blocks: { total, checked },
    all_done,
  };

  if (all_done) {
    result.hint = `Tous les blocs sont done. Appelle complete_plan('${planFile}') pour clore ce scope.`;
  }

  return result;
}

// ── complete_plan ────────────────────────────────────────────────────────────

/**
 * Set an exec-plan's status to "completed" in its frontmatter.
 * Refuses if unchecked blocks remain.
 *
 * @param {string} projectRoot
 * @param {string} planFile  Relative path to the exec-plan
 * @returns {Promise<object>}
 */
export async function completePlan(projectRoot, planFile) {
  const absPath = resolveArtifact(projectRoot, planFile);
  let content;
  try {
    content = await readFile(absPath, "utf-8");
  } catch {
    throw new Error(`Fichier introuvable : ${planFile}`);
  }

  const fm = parseFrontmatter(content);
  const hasFrontmatter = /^---\r?\n/.test(content);
  if (!hasFrontmatter) throw new Error(`Frontmatter absent dans ${planFile}.`);
  if (fm.status === undefined || fm.status === "") throw new Error(`Champ 'status' manquant dans ${planFile}.`);

  const { unchecked } = countBlocks(content);
  if (unchecked.length > 0) {
    throw new Error(
      `${unchecked.length} bloc(s) non coché(s) dans ${planFile}. Utilise mark_block_done avant de compléter le plan :\n${unchecked.map((b) => `  - ${b}`).join("\n")}`
    );
  }

  let updated = setFrontmatterField(content, "status", "completed");
  const date = today();
  updated = setFrontmatterField(updated, "updated", date);

  await writeFile(absPath, updated, "utf-8");

  return {
    file: planFile,
    status: "completed",
    updated: date,
  };
}

// ── register_spec ────────────────────────────────────────────────────────────

/**
 * Create a new spec file with minimal frontmatter. Refuses to overwrite.
 *
 * @param {string} projectRoot
 * @param {{ specs: string }} paths
 * @param {string} specFile  Filename or relative path within paths.specs
 * @param {string} title
 * @returns {Promise<object>}
 */
export async function registerSpec(projectRoot, paths, specFile, title) {
  // Resolve: if specFile is already a path that includes the specs dir, use as-is;
  // otherwise, place it inside paths.specs.
  let relPath;
  const relDir = dirname(specFile);
  if (relDir !== ".") {
    relPath = specFile;
  } else {
    relPath = join(paths.specs, specFile);
  }

  const absPath = resolveArtifact(projectRoot, relPath);

  if (existsSync(absPath)) {
    throw new Error(`Le fichier '${relPath}' existe déjà.`);
  }

  await mkdir(dirname(absPath), { recursive: true });

  const safeTitle = title.replace(/[\r\n]/g, " ").replace(/"/g, '\\"');
  const frontmatter = `---\ntitle: "${safeTitle}"\nstatus: draft\ncreated: ${today()}\n---\n\n# ${safeTitle}\n`;
  await writeFile(absPath, frontmatter, "utf-8");

  return {
    created: true,
    file: relPath,
  };
}

// ── check_artifacts ──────────────────────────────────────────────────────────

/**
 * Cross-artifact consistency scan.
 *
 * @param {string} projectRoot
 * @param {{ specs: string, execPlans: string, briefs: string }} paths
 * @returns {Promise<object>}
 */
export async function checkArtifacts(projectRoot, paths) {
  const problems = [];
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const [planFiles, briefFiles, specFiles] = await Promise.all([
    listMdFiles(projectRoot, paths.execPlans),
    listMdFiles(projectRoot, paths.briefs),
    listMdFiles(projectRoot, paths.specs),
  ]);

  // ── exec-plans ───────────────────────────────────────────────────────────
  for (const file of planFiles) {
    let content;
    try {
      content = await readFile(join(projectRoot, file), "utf-8");
    } catch (err) {
      problems.push({ type: "unreadable_file", file, severity: "blocking", detail: err.message });
      continue;
    }
    const fm = parseFrontmatter(content);
    const { total, checked, unchecked } = countBlocks(content);

    if (total > 0 && checked === total && fm.status !== "completed") {
      problems.push({
        type: "plan_stale_status",
        file,
        severity: "blocking",
        detail: `tous les blocs sont cochés mais status est '${fm.status}'`,
        suggestion: `complete_plan('${file}')`,
      });
    }

    if (!fm.brief) {
      problems.push({
        type: "plan_missing_brief",
        file,
        severity: "warning",
        detail: "champ 'brief' absent ou vide",
        suggestion: "ajouter brief: <chemin> dans le frontmatter",
      });
    } else if (!existsSync(resolveArtifact(projectRoot, fm.brief))) {
      problems.push({
        type: "plan_brief_dead",
        file,
        severity: "blocking",
        detail: `brief '${fm.brief}' n'existe pas sur disque`,
        suggestion: "corriger le chemin ou créer le brief manquant",
      });
    }
  }

  // ── briefs ───────────────────────────────────────────────────────────────
  for (const file of briefFiles) {
    let content;
    try {
      content = await readFile(join(projectRoot, file), "utf-8");
    } catch (err) {
      problems.push({ type: "unreadable_file", file, severity: "blocking", detail: err.message });
      continue;
    }
    const fm = parseFrontmatter(content);

    if (!fm.exec_plan) {
      problems.push({
        type: "brief_missing_plan",
        file,
        severity: "warning",
        detail: "champ 'exec_plan' absent ou vide",
        suggestion: "ajouter exec_plan: <chemin> dans le frontmatter",
      });
    } else if (!existsSync(resolveArtifact(projectRoot, fm.exec_plan))) {
      problems.push({
        type: "brief_plan_dead",
        file,
        severity: "blocking",
        detail: `exec_plan '${fm.exec_plan}' n'existe pas sur disque`,
        suggestion: "corriger le chemin ou créer l'exec-plan manquant",
      });
    }
  }

  // ── specs ────────────────────────────────────────────────────────────────
  for (const file of specFiles) {
    let content;
    try {
      content = await readFile(join(projectRoot, file), "utf-8");
    } catch (err) {
      problems.push({ type: "unreadable_file", file, severity: "blocking", detail: err.message });
      continue;
    }
    const fm = parseFrontmatter(content);

    if (fm.status === "draft" && fm.created) {
      const created = new Date(fm.created);
      if (!isNaN(created.getTime()) && Date.now() - created.getTime() > THIRTY_DAYS_MS) {
        const ageDays = Math.floor((Date.now() - created.getTime()) / (24 * 60 * 60 * 1000));
        problems.push({
          type: "spec_stale_draft",
          file,
          severity: "warning",
          detail: `status: draft depuis ${ageDays} jours`,
          suggestion: "promouvoir en 'active' ou supprimer si abandonné",
        });
      }
    }
  }

  const blocking = problems.filter((p) => p.severity === "blocking").length;
  const warning = problems.filter((p) => p.severity === "warning").length;

  const summary =
    problems.length === 0
      ? "Tous les artefacts sont cohérents."
      : `${problems.length} problème(s) détecté(s) (${blocking} bloquant(s), ${warning} warning(s))`;

  return { problems, summary };
}
