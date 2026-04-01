// eslint.config.js — flat ESLint config for opencode-team-lead
//
// This project has zero dependencies by design (see docs/guiding-principles.md).
// Standard ESLint plugins (eslint-plugin-n, eslint-plugin-unicorn) cannot be used
// without installing them. Instead, we define an inline plugin with a custom rule
// that enforces the node: protocol prefix on built-in imports — no npm install needed.

/** @type {string[]} */
const NODE_BUILTINS = [
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "crypto",
  "dns",
  "events",
  "fs",
  "fs/promises",
  "http",
  "https",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "querystring",
  "readline",
  "stream",
  "string_decoder",
  "timers",
  "timers/promises",
  "tty",
  "url",
  "util",
  "vm",
  "worker_threads",
  "zlib",
];

/**
 * Custom ESLint rule: require the `node:` protocol prefix on all Node.js built-in imports.
 *
 * Pattern encoded: imports like `from "fs/promises"` must be `from "node:fs/promises"`.
 * Consistent with the existing style in index.js and enforces it for future edits.
 *
 * @type {import("eslint").Rule.RuleModule}
 */
const preferNodeProtocol = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Require the `node:` protocol prefix on Node.js built-in imports",
    },
    messages: {
      missingNodeProtocol:
        'Use the `node:` protocol prefix for built-in imports: change "{{specifier}}" to "node:{{specifier}}".',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const specifier = node.source.value;
        if (typeof specifier === "string" && NODE_BUILTINS.includes(specifier)) {
          context.report({
            node: node.source,
            messageId: "missingNodeProtocol",
            data: { specifier },
            fix(fixer) {
              // Replace "fs/promises" → "node:fs/promises" (including the surrounding quotes)
              const raw = node.source.raw ?? `"${specifier}"`;
              const quote = raw[0];
              return fixer.replaceText(node.source, `${quote}node:${specifier}${quote}`);
            },
          });
        }
      },
    };
  },
};

export default [
  {
    // Apply to all JS files at the repo root. team-lead-workflow/ has its own
    // package.json and build toolchain — lint it separately with its own config.
    files: ["*.js"],
    plugins: {
      // Inline plugin — no npm install required. See comment at top of file.
      local: {
        rules: {
          "prefer-node-protocol": preferNodeProtocol,
        },
      },
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "local/prefer-node-protocol": "error",
    },
  },
];
