import { Agent } from "@opencode/plugin";

export const permission = { async assert() {} };
export const toolContext = { sessionID: "ses_test", agent: "team-lead", messageID: "msg_test", id: "call_test" };

export function mockContext(directory, options = {}, configured = []) {
  const agents = new Map(configured.map((agent) => [agent.id, structuredClone(agent)]));
  const tools = new Map();
  const skills = new Map();
  const hooks = {};
  const transforms = [];
  const editor = {
    get: (id) => agents.get(id),
    update(id, update) {
      if (!agents.has(id)) agents.set(id, Agent.Info.default(Agent.ID.make(id)));
      update(agents.get(id));
    },
  };
  return {
    location: { directory }, options, permission, agents, tools, skills, hooks, transforms,
    agent: {
      async transform(callback) { transforms.push(callback); callback(editor); },
      async get({ agentID }) { return { location: { directory }, data: agents.get(agentID) }; },
    },
    tool: {
      async transform(callback) { callback({ add(tool) { tools.set(tool.name, tool); } }); },
      async hook(name, callback) { hooks[name] = callback; },
    },
    skill: { async transform(callback) { callback({ get: (id) => skills.get(id), add: (skill) => skills.set(skill.id, skill) }); } },
    session: {
      async get() { return { location: { directory } }; },
      async hook(name, callback) { hooks[name] = callback; },
    },
  };
}
