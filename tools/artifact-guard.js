// tools/artifact-guard.js
// Pure guard logic for the tool.execute.before hook.
// Extracted as a separate module so it can be unit-tested without loading the plugin.

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
]);

/**
 * Returns true if `target` path starts with one of the protected directory prefixes.
 * Normalises backslashes and strips leading slashes for comparison.
 *
 * @param {string} target
 * @param {string[]} protectedDirs  e.g. ["docs/specs", "docs/exec-plans", "docs/briefs"]
 * @returns {boolean}
 */
export function isProtectedPath(target, protectedDirs) {
  if (typeof target !== "string" || target.length === 0) return false;
  const norm = target.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^(\.\/)+/, "").toLowerCase();
  return protectedDirs.some((dir) => {
    const normDir = dir.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
    return norm === normDir || norm.startsWith(normDir + "/");
  });
}

/**
 * Checks whether a tool call should be blocked.
 * Returns null if allowed, or an Error to throw if blocked.
 *
 * @param {{ tool: string, args: Record<string, unknown> }} call
 * @param {string[]} protectedDirs
 * @returns {Error | null}
 */
export function checkArtifactAccess({ tool: toolName, args }, protectedDirs) {
  // Lifecycle tools always bypass the guard.
  if (LIFECYCLE_TOOLS.has(toolName)) return null;

  if (toolName === "read" || toolName === "edit" || toolName === "write") {
    const filePath = args?.filePath ?? args?.path ?? "";
    if (isProtectedPath(filePath, protectedDirs)) {
      if (toolName === "read") {
        return new Error(
          `Direct '${toolName}' access to '${filePath}' is blocked. ` +
          `Use spec_get / spec_list, plan_get / plan_list, or brief_get / brief_list instead.`
        );
      }
      return new Error(
        `Direct '${toolName}' access to '${filePath}' is blocked. ` +
        `Use spec_create / spec_update / spec_delete, plan_create / plan_update / plan_delete, ` +
        `or brief_create / brief_update / brief_delete instead.`
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
        `Use the lifecycle tools (spec_*, plan_*, brief_*) to read or modify artifacts instead.`
      );
    }
    return null;
  }

  if (toolName === "glob") {
    const pattern = typeof args?.pattern === "string" ? args.pattern : "";
    const globPath = typeof args?.path === "string" ? args.path : "";
    const patternBlocked = pattern && isProtectedPath(pattern, protectedDirs);
    const pathBlocked = globPath && isProtectedPath(globPath, protectedDirs);
    if (patternBlocked || pathBlocked) {
      return new Error(
        `Direct 'glob' access to '${pathBlocked ? globPath : pattern}' is blocked. ` +
        `Use spec_list / plan_list / brief_list instead.`
      );
    }
    return null;
  }

  if (toolName === "grep") {
    const grepPath = args?.path;
    if (typeof grepPath === "string" && isProtectedPath(grepPath, protectedDirs)) {
      return new Error(
        `Direct 'grep' access to '${grepPath}' is blocked. ` +
        `Use spec_list / plan_list / brief_list instead.`
      );
    }
    return null;
  }

  return null;
}
