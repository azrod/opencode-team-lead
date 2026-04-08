import { tool } from "@opencode-ai/plugin";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import * as path from "node:path";

const require = createRequire(import.meta.url);

function loadPlaywright(worktree: string) {
  try {
    return require(path.join(worktree, ".opencode", "node_modules", "@playwright/test"));
  } catch (e) {
    throw new Error(
      `Playwright not found. Run: cd .opencode && npm install\n${e}`
    );
  }
}

export const doc_screenshot = tool({
  description:
    "Take a screenshot of a page in the team-lead-workflow documentation website. " +
    "The dev server must be running first (use doc_dev_start). " +
    "Screenshots are saved to .opencode/screenshots/ and the file path is returned.",
  args: {
    url: tool.schema.string().describe("Full URL to screenshot, e.g. http://localhost:5173"),
    name: tool.schema.string().optional().default("page").describe("Filename suffix for the screenshot"),
    fullPage: tool.schema
      .boolean()
      .optional()
      .default(false)
      .describe("Capture full scrollable page height"),
    width: tool.schema.number().optional().default(1280).describe("Viewport width in pixels"),
    height: tool.schema.number().optional().default(900).describe("Viewport height in pixels"),
  },
  async execute(args, context) {
    const worktree = context.worktree;
    const screenshotsDir = path.join(worktree, ".opencode", "screenshots");

    let chromium: any;
    try {
      ({ chromium } = loadPlaywright(worktree));
    } catch (e: any) {
      return e.message;
    }

    if (!existsSync(screenshotsDir)) {
      await mkdir(screenshotsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `doc-${args.name ?? "page"}-${timestamp}.png`;
    const filePath = path.join(screenshotsDir, filename);

    let browser: any;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setViewportSize({
        width: args.width ?? 1280,
        height: args.height ?? 900,
      });
      await page.goto(args.url, { waitUntil: "networkidle", timeout: 30000 });
      await page.screenshot({ path: filePath, fullPage: args.fullPage ?? false });

      return JSON.stringify({
        success: true,
        filePath,
        url: args.url,
        width: args.width ?? 1280,
        height: args.height ?? 900,
        fullPage: args.fullPage ?? false,
      });
    } catch (e: any) {
      return JSON.stringify({ success: false, error: e.message, url: args.url });
    } finally {
      if (browser) await browser.close();
    }
  },
});

export const doc_navigate = tool({
  description:
    "Navigate to a page in the documentation website and extract its text content and links. " +
    "Useful for reading doc content without a screenshot.",
  args: {
    url: tool.schema.string().describe("URL to navigate to, e.g. http://localhost:5173"),
    selector: tool.schema
      .string()
      .optional()
      .default("body")
      .describe("CSS selector to extract text from (default: body)"),
  },
  async execute(args, context) {
    const worktree = context.worktree;

    let chromium: any;
    try {
      ({ chromium } = loadPlaywright(worktree));
    } catch (e: any) {
      return e.message;
    }

    let browser: any;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.goto(args.url, { waitUntil: "load", timeout: 30000 });

      const title = await page.title();
      const description = await page
        .$eval('meta[name="description"]', (el: any) => el.getAttribute("content"))
        .catch(() => "");

      const selector = args.selector ?? "body";
      const textContent = await page
        .$eval(selector, (el: any) => el.innerText)
        .catch(() => "")
        .then((t: string) => t.trim().slice(0, 5000));

      const links: string[] = await page.$$eval("a[href]", (els: any[]) =>
        els
          .map((el) => el.getAttribute("href"))
          .filter((h: string) => h && !h.startsWith("#"))
          .slice(0, 20)
      );

      return JSON.stringify({ title, description, url: args.url, textContent, links });
    } catch (e: any) {
      return JSON.stringify({ error: e.message, url: args.url });
    } finally {
      if (browser) await browser.close();
    }
  },
});

export const doc_get_html = tool({
  description:
    "Get the HTML of a page or a specific element in the documentation website. " +
    "Useful for inspecting structure and components.",
  args: {
    url: tool.schema.string().describe("URL to fetch HTML from"),
    selector: tool.schema
      .string()
      .optional()
      .default("body")
      .describe("CSS selector to get outerHTML of (default: body)"),
  },
  async execute(args, context) {
    const worktree = context.worktree;

    let chromium: any;
    try {
      ({ chromium } = loadPlaywright(worktree));
    } catch (e: any) {
      return e.message;
    }

    let browser: any;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.goto(args.url, { waitUntil: "load", timeout: 30000 });

      const selector = args.selector ?? "body";
      const html = await page
        .$eval(selector, (el: any) => el.outerHTML)
        .catch(() => `Element not found: ${selector}`);

      return JSON.stringify({
        url: args.url,
        selector,
        html: typeof html === "string" ? html.slice(0, 10000) : html,
      });
    } catch (e: any) {
      return JSON.stringify({ error: e.message, url: args.url });
    } finally {
      if (browser) await browser.close();
    }
  },
});
