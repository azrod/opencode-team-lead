// tools/registry.js
// Builds and returns the complete tool registry object for the team-lead plugin.
// All 20 lifecycle tools are defined here.

import { tool } from "@opencode-ai/plugin/tool";
import {
  projectState,
  specGet,
  specCreate,
  specUpdate,
  specValidate,
  specList,
  specDelete,
  planGet,
  planCreate,
  planUpdate,
  planValidate,
  planBlockDone,
  planList,
  planDelete,
  briefGet,
  briefCreate,
  briefUpdate,
  briefDelete,
  briefList,
  specFormat,
  planFormat,
} from "./lifecycle.js";

/**
 * Build and return the full tool registry object.
 *
 * @param {string} projectRoot
 * @param {{ specs: string, execPlans: string, briefs: string }} paths
 * @returns {Record<string, object>}
 */
export function buildToolRegistry(projectRoot, paths) {
  return {
    project_state: {
      description: "Return the current state of active artifacts: all specs with metadata, and active exec-plans (those with at least one unchecked block). Briefs are excluded — call brief_list() if needed. Call at the start of every mission.",
      args: {},
      async execute(_args) {
        try { return JSON.stringify(await projectState(projectRoot, paths)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    spec_get: {
      description: "Retrieve a spec by id. Returns file path, content, and frontmatter.",
      args: {
        id: tool.schema.string().describe("Spec id (filename without extension, e.g. 'auth')"),
      },
      async execute({ id }) {
        try { return JSON.stringify(await specGet(projectRoot, paths, id)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    spec_create: {
      description: "Create a new spec file. Refuses to overwrite an existing one. After creation, call spec_validate to trigger the LLM spec-validator agent. Call spec_format() first if unsure of the expected structure.",
      args: {
        title: tool.schema.string().describe("Human-readable title of the spec"),
        type: tool.schema.string().optional().describe("Spec type: 'technical' | 'functional' | 'architectural'. Defaults to 'technical'"),
        content: tool.schema.string().optional().describe("Optional markdown body content"),
      },
      async execute({ title, type, content }) {
        try { return JSON.stringify(await specCreate(projectRoot, paths, title, type ?? "technical", content ?? null)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    spec_update: {
      description: "Update a spec by replacing oldString with newString. Fails if oldString not found or found multiple times. After updating, call spec_validate to trigger the LLM spec-validator agent. Call spec_format() first if unsure of the expected structure.",
      args: {
        id: tool.schema.string().describe("Spec id"),
        old_string: tool.schema.string().describe("Exact string to replace"),
        new_string: tool.schema.string().describe("Replacement string"),
      },
      async execute({ id, old_string, new_string }) {
        try { return JSON.stringify(await specUpdate(projectRoot, paths, id, old_string, new_string)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    spec_validate: {
      description: "Validate a spec's structure: frontmatter present, required fields, non-empty body.",
      args: {
        id: tool.schema.string().describe("Spec id"),
      },
      async execute({ id }) {
        try { return JSON.stringify(await specValidate(projectRoot, paths, id)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    spec_list: {
      description: "List all specs with their metadata (title, id, type, status, created).",
      args: {},
      async execute(_args) {
        try { return JSON.stringify(await specList(projectRoot, paths)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    spec_delete: {
      description: "Delete a spec by id.",
      args: {
        id: tool.schema.string().describe("Spec id"),
      },
      async execute({ id }) {
        try { return JSON.stringify(await specDelete(projectRoot, paths, id)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    plan_get: {
      description: "Retrieve an exec-plan by id. Returns file path, content, frontmatter, and block counts.",
      args: {
        id: tool.schema.string().describe("Plan id (filename without extension, e.g. 'auth-system')"),
      },
      async execute({ id }) {
        try { return JSON.stringify(await planGet(projectRoot, paths, id)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    plan_create: {
      description: "Create a new exec-plan. functional_objective is required. After creation, call plan_validate to check structure, then delegate to plan-reviewer for a full semantic review. Call plan_format() first if unsure of the expected structure — especially the building blocks syntax.",
      args: {
        title: tool.schema.string().describe("Plan title"),
        functional_objective: tool.schema.string().describe("2-4 sentences describing the user problem being solved"),
        content: tool.schema.string().optional().describe("Optional markdown content for Scope section"),
        brief: tool.schema.string().optional().describe("Optional id of the associated brief"),
      },
      async execute({ title, functional_objective, content, brief }) {
        try { return JSON.stringify(await planCreate(projectRoot, paths, { title, functional_objective, content: content ?? null, brief: brief ?? null })); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    plan_update: {
      description: "Update an exec-plan by replacing oldString with newString. Same surgical mechanic as spec_update.",
      args: {
        id: tool.schema.string().describe("Plan id"),
        old_string: tool.schema.string().describe("Exact string to replace"),
        new_string: tool.schema.string().describe("Replacement string"),
      },
      async execute({ id, old_string, new_string }) {
        try { return JSON.stringify(await planUpdate(projectRoot, paths, id, old_string, new_string)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    plan_validate: {
      description: "Validate an exec-plan's structure: functional_objective present, building blocks present, at least one block.",
      args: {
        id: tool.schema.string().describe("Plan id"),
      },
      async execute({ id }) {
        try { return JSON.stringify(await planValidate(projectRoot, paths, id)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    plan_block_done: {
      description: "Check a specific block in an exec-plan ([ ] → [x]). Call after each validated sub-task delivery.",
      args: {
        plan_id: tool.schema.string().describe("Plan id (filename without extension)"),
        block_name: tool.schema.string().describe("Name or unambiguous substring of the block to check"),
      },
      async execute({ plan_id, block_name }) {
        try { return JSON.stringify(await planBlockDone(projectRoot, paths, plan_id, block_name)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    plan_list: {
      description: "List all exec-plans with their metadata and block progress.",
      args: {},
      async execute(_args) {
        try { return JSON.stringify(await planList(projectRoot, paths)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    plan_delete: {
      description: "Delete an exec-plan by id. Use when a plan is abandoned — deletion is the signal of abandonment, not a status field.",
      args: {
        id: tool.schema.string().describe("Plan id"),
      },
      async execute({ id }) {
        try { return JSON.stringify(await planDelete(projectRoot, paths, id)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    spec_format: {
      description: "Return the canonical format expected for a spec file. Call this before spec_create or spec_update if unsure of the expected structure.",
      args: {},
      async execute(_args) {
        // Raw string intentional — not JSON-encoded, format content for direct LLM consumption
        try { return specFormat(); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    plan_format: {
      description: "Return the canonical format expected for an exec-plan file. Call this before plan_create if unsure of the expected structure — especially the building blocks syntax.",
      args: {},
      async execute(_args) {
        // Raw string intentional — not JSON-encoded, format content for direct LLM consumption
        try { return planFormat(); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    brief_get: {
      description: "Retrieve a brief by id. Returns file path, content, and frontmatter.",
      args: {
        id: tool.schema.string().describe("Brief id (filename without extension)"),
      },
      async execute({ id }) {
        try { return JSON.stringify(await briefGet(projectRoot, paths, id)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    brief_create: {
      description: "Create a new product brief.",
      args: {
        title: tool.schema.string().describe("Brief title"),
        content: tool.schema.string().optional().describe("Optional markdown body content"),
        exec_plan: tool.schema.string().optional().describe("Optional id of the associated exec-plan"),
      },
      async execute({ title, content, exec_plan }) {
        try { return JSON.stringify(await briefCreate(projectRoot, paths, { title, content: content ?? null, exec_plan: exec_plan ?? null })); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    brief_update: {
      description: "Update a brief by replacing oldString with newString.",
      args: {
        id: tool.schema.string().describe("Brief id"),
        old_string: tool.schema.string().describe("Exact string to replace"),
        new_string: tool.schema.string().describe("Replacement string"),
      },
      async execute({ id, old_string, new_string }) {
        try { return JSON.stringify(await briefUpdate(projectRoot, paths, id, old_string, new_string)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    brief_delete: {
      description: "Delete a brief by id. Use when a brief is abandoned.",
      args: {
        id: tool.schema.string().describe("Brief id"),
      },
      async execute({ id }) {
        try { return JSON.stringify(await briefDelete(projectRoot, paths, id)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
    brief_list: {
      description: "List all briefs with their metadata (title, id, exec_plan, created).",
      args: {},
      async execute(_args) {
        try { return JSON.stringify(await briefList(projectRoot, paths)); }
        catch (err) { return JSON.stringify({ error: err instanceof Error ? err.message : String(err) }); }
      },
    },
  };
}
