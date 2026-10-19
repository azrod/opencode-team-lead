// tools/artifact-guard.js
// Pure guard logic for the tool.execute.before hook.
// Extracted as a separate module so it can be unit-tested without loading the plugin.

import { existsSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";

/**
 * Tool names that are allowed to access protected artifact directories.
 * These tools operate directly on the filesystem and bypass the hook intentionally.
 */
export const LIFECYCLE_TOOLS = new Set([
  "project_state",
  "spec_get",
  "spec_create",
  "spec_update",
  "spec_validate",
  "spec_list",
  "spec_delete",
  "plan_get",
  "plan_create",
  "plan_validate",
  "plan_block_done",
  "plan_update",
  "plan_delete",
  "plan_list",
  "brief_get",
  "brief_create",
  "brief_update",
  "brief_delete",
  "brief_list",
  "spec_format",
  "plan_format",
]);

function resolveFromProject(projectRoot, target) {
  return resolve(projectRoot, target);
}

function canonicalPath(projectRoot, target) {
  const unresolved = resolveFromProject(projectRoot, target);
  const missingParts = [];
  let existing = unresolved;

  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) return unresolved;
    missingParts.unshift(basename(existing));
    existing = parent;
  }

  try {
    return resolve(realpathSync(existing), ...missingParts);
  } catch {
    // A path that cannot be canonicalized must still be checked structurally.
    return unresolved;
  }
}

function comparablePath(path) {
  // Conservative case folding also protects case-insensitive filesystems.
  return path.toLocaleLowerCase();
}

/**
 * Returns true when `child` is `parent` or is contained inside it.
 * `path.relative` is separator-aware and avoids string-prefix false positives.
 */
function containsPath(parent, child) {
  const rel = relative(comparablePath(parent), comparablePath(child));
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

/**
 * Returns true if `target` resolves inside a protected artifact directory.
 * Relative paths are resolved from the project root; absolute paths stay absolute.
 *
 * @param {string} target
 * @param {string[]} protectedDirs
 * @param {string} projectRoot
 * @returns {boolean}
 */
export function isProtectedPath(target, protectedDirs, projectRoot = process.cwd()) {
  if (typeof target !== "string" || target.length === 0) return false;
  const targetPath = canonicalPath(projectRoot, target);
  return protectedDirs.some((dir) => containsPath(canonicalPath(projectRoot, dir), targetPath));
}

/**
 * Returns true if a recursive search root is protected or is an ancestor of a
 * protected artifact directory. Searches cannot safely return partial results,
 * so ancestor roots are blocked before the tool executes.
 */
function canReachProtectedPath(searchRoot, protectedDirs, projectRoot) {
  const rootPath = canonicalPath(projectRoot, searchRoot);
  return protectedDirs.some((dir) => {
    const protectedPath = canonicalPath(projectRoot, dir);
    return containsPath(protectedPath, rootPath) || containsPath(rootPath, protectedPath);
  });
}

function containsParentTraversal(pattern) {
  return /(^|[\\/,{])\.\.(?=$|[\\/,}])/.test(pattern);
}

/**
 * Finds the static directory prefix of a glob pattern. The resulting directory
 * is the widest area that the glob could traverse before a wildcard restricts it.
 */
function globSearchRoot(pattern) {
  const magicIndex = pattern.search(/[*!?\[{]/);
  if (magicIndex === -1) return pattern;
  const prefix = pattern.slice(0, magicIndex);
  const separator = Math.max(prefix.lastIndexOf("/"), prefix.lastIndexOf("\\"));
  return separator === -1 ? "." : prefix.slice(0, separator) || sep;
}

/**
 * Checks whether a tool call should be blocked.
 * Returns null if allowed, or an Error to throw if blocked.
 *
 * @param {{ tool: string, args: Record<string, unknown> }} call
 * @param {string[]} protectedDirs
 * @param {string} projectRoot
 * @returns {Error | null}
 */
export function checkArtifactAccess({ tool: toolName, args }, protectedDirs, projectRoot = process.cwd()) {
  // Lifecycle tools always bypass the guard.
  if (LIFECYCLE_TOOLS.has(toolName)) return null;

  if (toolName === "read" || toolName === "edit" || toolName === "write" || toolName === "list") {
    const filePath = args?.filePath ?? args?.path ?? "";
    if (isProtectedPath(filePath, protectedDirs, projectRoot)) {
      if (toolName === "list") {
        return new Error(
          `Direct '${toolName}' access to '${filePath}' is blocked. ` +
          "Use spec_list, plan_list, or brief_list instead."
        );
      }
      if (toolName === "read") {
        return new Error(
          `Direct '${toolName}' access to '${filePath}' is blocked. ` +
          "Use spec_get / spec_list, plan_get / plan_list, or brief_get / brief_list instead."
        );
      }
      return new Error(
        `Direct '${toolName}' access to '${filePath}' is blocked. ` +
        "Use spec_create / spec_update / spec_delete, plan_create / plan_update / plan_delete, " +
        "or brief_create / brief_update / brief_delete instead."
      );
    }
    return null;
  }

  if (toolName === "bash") {
    const command = args?.command ?? "";
    const hitDir = protectedDirs.find((dir) => command.toLowerCase().includes(dir.toLowerCase()));
    if (hitDir) {
      return new Error(
        `bash command references protected artifact directory '${hitDir}'. ` +
        "Use the lifecycle tools (spec_*, plan_*, brief_*) to read or modify artifacts instead."
      );
    }
    return null;
  }

  if (toolName === "glob") {
    const pattern = typeof args?.pattern === "string" ? args.pattern : "**";
    const globPath = typeof args?.path === "string" ? args.path : ".";
    if (containsParentTraversal(pattern)) {
      return new Error(
        "Direct 'glob' access with parent-directory traversal is blocked. " +
        "Use spec_list, plan_list, or brief_list instead."
      );
    }
    const staticRoot = globSearchRoot(pattern);
    const searchRoot = isAbsolute(staticRoot)
      ? staticRoot
      : resolveFromProject(resolveFromProject(projectRoot, globPath), staticRoot);
    if (canReachProtectedPath(searchRoot, protectedDirs, projectRoot)) {
      return new Error(
        `Direct 'glob' access to '${globPath}' is blocked because it can traverse protected artifacts. ` +
        "Use spec_list, plan_list, or brief_list instead."
      );
    }
    return null;
  }

  if (toolName === "grep") {
    const grepPath = typeof args?.path === "string" ? args.path : ".";
    if (canReachProtectedPath(grepPath, protectedDirs, projectRoot)) {
      return new Error(
        `Direct 'grep' access to '${grepPath}' is blocked because it can traverse protected artifacts. ` +
        "Use spec_list, plan_list, or brief_list instead."
      );
    }
    return null;
  }

  return null;
}
