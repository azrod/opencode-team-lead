import { tool } from "@opencode-ai/plugin";
import { spawn } from "node:child_process";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { existsSync, openSync, closeSync } from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

function httpCheck(port: number): Promise<{ reachable: boolean; status: number }> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve({ reachable: true, status: res.statusCode ?? 0 });
      res.resume();
    });
    req.on("error", () => resolve({ reachable: false, status: 0 }));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve({ reachable: false, status: 0 });
    });
  });
}

async function waitForServer(port: number, timeoutMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { reachable } = await httpCheck(port);
    if (reachable) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

export const doc_dev_start = tool({
  description:
    "Start the Vite dev server for the team-lead-workflow documentation website. " +
    "Spawns `npm run dev` from the team-lead-workflow/ directory and waits for the server to be reachable. " +
    "Use doc_dev_status to check if already running before calling this.",
  args: {
    port: tool.schema
      .number()
      .optional()
      .default(5173)
      .describe("Port to run the dev server on (default: 5173)"),
  },
  async execute(args, context) {
    const port = args.port ?? 5173;
    const worktree = context.worktree;
    const workflowDir = path.join(worktree, "team-lead-workflow");
    const opencodeDir = path.join(worktree, ".opencode");
    const pidFile = path.join(opencodeDir, "doc-server.pid");
    const portFile = path.join(opencodeDir, "doc-server.port");
    const logFile = path.join(opencodeDir, "doc-server.log");

    // Check if already running
    if (existsSync(pidFile)) {
      const pid = parseInt(await readFile(pidFile, "utf-8"), 10);
      try {
        process.kill(pid, 0);
        return JSON.stringify({
          success: false,
          message: `Server already running (PID ${pid}). Use doc_dev_stop first.`,
        });
      } catch {
        // stale PID, continue
      }
    }

    // Open log file as a raw fd and pass it directly to spawn.
    // Safe: the log goes directly to the kernel, not via a JS stream.
    // Close the fd on the parent side immediately after fork.
    const logFd = openSync(logFile, "a");

    const child = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
      cwd: workflowDir,
      detached: true,
      stdio: ["ignore", logFd, logFd],
    });

    // Close the fd on the parent side — child keeps its own copy
    closeSync(logFd);
    child.unref();

    await writeFile(pidFile, String(child.pid), "utf-8");
    await writeFile(portFile, String(port), "utf-8");

    const ready = await waitForServer(port, 15000);

    if (!ready) {
      return JSON.stringify({
        success: false,
        pid: child.pid,
        port,
        message: "Server did not become reachable within 15s. Check logs with doc_dev_logs.",
      });
    }

    return JSON.stringify({
      success: true,
      pid: child.pid,
      port,
      url: `http://localhost:${port}`,
      message: `Doc server started on http://localhost:${port}`,
    });
  },
});

export const doc_dev_stop = tool({
  description: "Stop the running Vite dev server for the team-lead-workflow documentation website.",
  args: {},
  async execute(_args, context) {
    const worktree = context.worktree;
    const pidFile = path.join(worktree, ".opencode", "doc-server.pid");
    const portFile = path.join(worktree, ".opencode", "doc-server.port");

    if (!existsSync(pidFile)) {
      return JSON.stringify({ success: false, message: "No PID file found — server may not be running." });
    }

    const pid = parseInt(await readFile(pidFile, "utf-8"), 10);

    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        // process already gone
      }
    }

    await new Promise((r) => setTimeout(r, 1500));
    try {
      process.kill(pid, 0);
      try {
        process.kill(-pid, "SIGKILL");
      } catch {
        process.kill(pid, "SIGKILL");
      }
    } catch {
      // already dead
    }

    try { await unlink(pidFile); } catch {}
    try { await unlink(portFile); } catch {}

    return JSON.stringify({ success: true, message: `Stopped server (PID ${pid})` });
  },
});

export const doc_dev_status = tool({
  description:
    "Check the status of the Vite dev server for the team-lead-workflow documentation website. " +
    "Returns whether it is running, the PID, port, and whether it is reachable via HTTP.",
  args: {},
  async execute(_args, context) {
    const worktree = context.worktree;
    const pidFile = path.join(worktree, ".opencode", "doc-server.pid");
    const portFile = path.join(worktree, ".opencode", "doc-server.port");

    if (!existsSync(pidFile)) {
      return JSON.stringify({ running: false, pid: null, port: null, reachable: false, url: null, httpStatus: null });
    }

    const pid = parseInt(await readFile(pidFile, "utf-8"), 10);
    const port = existsSync(portFile)
      ? parseInt(await readFile(portFile, "utf-8"), 10)
      : 5173;

    let running = false;
    try {
      process.kill(pid, 0);
      running = true;
    } catch {}

    const { reachable, status: httpStatus } = running
      ? await httpCheck(port)
      : { reachable: false, status: 0 };

    return JSON.stringify({ running, pid, port, reachable, url: `http://localhost:${port}`, httpStatus });
  },
});

export const doc_dev_logs = tool({
  description:
    "Read the dev server logs for the team-lead-workflow documentation website. " +
    "Useful for debugging startup failures or checking build output.",
  args: {
    lines: tool.schema
      .number()
      .optional()
      .default(50)
      .describe("Number of lines to return from the end of the log (default: 50)"),
    filter: tool.schema
      .string()
      .optional()
      .describe("Only return lines containing this string"),
  },
  async execute(args, context) {
    const worktree = context.worktree;
    const logFile = path.join(worktree, ".opencode", "doc-server.log");

    if (!existsSync(logFile)) {
      return JSON.stringify({ lines: [], total: 0, message: "No log file found — server may never have been started." });
    }

    const content = await readFile(logFile, "utf-8");
    let allLines = content.split("\n").filter(Boolean);

    if (args.filter) {
      allLines = allLines.filter((l) => l.includes(args.filter!));
    }

    const count = args.lines ?? 50;
    const slice = allLines.slice(-count);

    return JSON.stringify({ lines: slice, total: allLines.length });
  },
});
