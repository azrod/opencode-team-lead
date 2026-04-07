import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Section =
  | "overview"
  | "phases"
  | "flows"
  | "agents"
  | "memory"
  | "harness-gardener"
  | "protocols";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-sm bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200">
    {children}
  </code>
);

const Badge = ({
  children,
  color = "zinc",
}: {
  children: React.ReactNode;
  color?: "zinc" | "amber" | "blue" | "green" | "red" | "purple" | "cyan";
}) => {
  const colors = {
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-violet-50 text-violet-800 border-violet-200",
    cyan: "bg-cyan-50 text-cyan-800 border-cyan-200",
  };
  return (
    <span
      className={`text-xs font-mono px-2 py-0.5 rounded border ${colors[color]}`}
    >
      {children}
    </span>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-2xl font-semibold text-zinc-900 mb-1 tracking-tight">
    {children}
  </h2>
);

const SectionSubtitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-zinc-500 text-sm mb-8 border-b border-zinc-100 pb-4">
    {children}
  </p>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-semibold text-zinc-800 mt-8 mb-3">
    {children}
  </h3>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-zinc-600 text-sm leading-relaxed mb-3">{children}</p>
);

// ─── Flow diagram helpers ─────────────────────────────────────────────────────

const FlowBox = ({
  children,
  color = "zinc",
  small = false,
}: {
  children: React.ReactNode;
  color?: "zinc" | "amber" | "blue" | "green" | "red" | "purple" | "cyan";
  small?: boolean;
}) => {
  const colors = {
    zinc: "bg-zinc-50 border-zinc-300 text-zinc-700",
    amber: "bg-amber-50 border-amber-300 text-amber-900",
    blue: "bg-blue-50 border-blue-300 text-blue-900",
    green: "bg-green-50 border-green-300 text-green-900",
    red: "bg-red-50 border-red-300 text-red-900",
    purple: "bg-violet-50 border-violet-300 text-violet-900",
    cyan: "bg-cyan-50 border-cyan-300 text-cyan-900",
  };
  return (
    <div
      className={`border rounded px-3 py-2 font-mono text-xs text-center ${colors[color]} ${small ? "text-[11px] px-2 py-1" : ""}`}
    >
      {children}
    </div>
  );
};

const Arrow = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center my-1">
    {label && (
      <span className="text-[10px] text-zinc-400 font-mono mb-0.5">
        {label}
      </span>
    )}
    <div className="text-zinc-400 text-sm">↓</div>
  </div>
);

// ─── Table ────────────────────────────────────────────────────────────────────

const Table = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) => (
  <div className="overflow-x-auto my-4">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-zinc-50 border-b border-zinc-200">
          {headers.map((h, i) => (
            <th
              key={i}
              className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 py-2"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            className={`border-b border-zinc-100 ${ri % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}`}
          >
            {row.map((cell, ci) => (
              <td key={ci} className="px-3 py-2 text-zinc-600 text-sm">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── Agent Card ───────────────────────────────────────────────────────────────

const AgentCard = ({
  name,
  role,
  color,
  temp,
  variant,
  mode,
  permissions,
  triggers,
  details,
}: {
  name: string;
  role: string;
  color: "amber" | "blue" | "green" | "red" | "purple" | "cyan" | "zinc";
  temp: string;
  variant?: string;
  mode: string;
  permissions: string[];
  triggers: string[];
  details?: React.ReactNode;
}) => {
  const borderColors = {
    amber: "border-l-amber-400",
    blue: "border-l-blue-400",
    green: "border-l-green-400",
    red: "border-l-red-400",
    purple: "border-l-violet-400",
    cyan: "border-l-cyan-400",
    zinc: "border-l-zinc-400",
  };
  return (
    <div
      className={`border border-zinc-200 border-l-4 ${borderColors[color]} rounded-sm mb-6 bg-white`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-mono font-semibold text-base text-zinc-900">
              {name}
            </span>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <Badge color="zinc">temp: {temp}</Badge>
              {variant && <Badge color="zinc">variant: {variant}</Badge>}
              <Badge color={color}>mode: {mode}</Badge>
            </div>
          </div>
        </div>
        <p className="text-zinc-600 text-sm mt-3 mb-4">{role}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Déclencheurs
            </div>
            <ul className="space-y-1">
              {triggers.map((t, i) => (
                <li key={i} className="text-xs text-zinc-600 flex gap-1.5">
                  <span className="text-zinc-300 mt-0.5">›</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Permissions
            </div>
            <div className="flex flex-wrap gap-1">
              {permissions.map((p, i) => (
                <Code key={i}>{p}</Code>
              ))}
            </div>
          </div>
        </div>
        {details && (
          <div className="mt-4 pt-4 border-t border-zinc-100">{details}</div>
        )}
      </div>
    </div>
  );
};

// ─── Sections ─────────────────────────────────────────────────────────────────

function SectionOverview() {
  return (
    <div>
      <SectionTitle>Vue d'ensemble</SectionTitle>
      <SectionSubtitle>
        Architecture générale du système Orion — un plugin OpenCode qui injecte
        un agent orchestrateur pur.
      </SectionSubtitle>

      <H3>Qu'est-ce qu'Orion ?</H3>
      <P>
        Orion est un agent orchestrateur injecté dans OpenCode via un plugin.
        Son rôle est de planifier le travail, déléguer chaque tâche à des
        sous-agents spécialisés, réviser les résultats, et faire un rapport à
        l'utilisateur.
      </P>
      <P>
        La règle cardinale est absolue :{" "}
        <strong className="text-zinc-900">
          Orion ne touche jamais au code directement.
        </strong>{" "}
        Il n'implémente pas, ne modifie pas, ne crée pas de fichiers (sauf{" "}
        <Code>scratchpad.md</Code>). Tout ce qui touche au code passe par un
        sous-agent.
      </P>

      <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 my-4">
        <div className="text-xs font-mono text-amber-700 font-semibold mb-1">
          RÈGLE CARDINALE
        </div>
        <p className="text-amber-900 text-sm font-medium">
          "You NEVER do the work yourself. You delegate everything to
          sub-agents."
        </p>
      </div>

      <H3>Comment le plugin fonctionne</H3>
      <P>
        Le plugin enregistre les définitions d'agents dans la config OpenCode
        via le hook <Code>config</Code>. Au démarrage, chaque prompt agent est
        chargé depuis un fichier <Code>.md</Code> dédié. Le scratchpad persiste
        entre les sessions via le hook{" "}
        <Code>experimental.session.compacting</Code> qui l'injecte lors des
        resets de contexte.
      </P>

      <H3>Écosystème complet</H3>

      {/* Ecosystem diagram */}
      <div className="bg-zinc-50 border border-zinc-200 rounded p-6 mt-4 overflow-x-auto">
        <div className="min-w-[560px]">
          {/* User row */}
          <div className="flex justify-center mb-2">
            <FlowBox color="zinc">👤 Utilisateur</FlowBox>
          </div>

          {/* Phase 0 — brainstorm (upstream, before Orion) */}
          <div className="flex justify-center mb-1">
            <div className="text-zinc-400 text-xs font-mono">↓ si découverte produit</div>
          </div>
          <div className="flex justify-center mb-1">
            <div className="bg-blue-100 border-2 border-blue-400 rounded px-4 py-2 font-mono font-semibold text-blue-900 text-sm">
              ◈ brainstorm (Phase 0)
            </div>
          </div>
          <div className="flex justify-center mb-1">
            <div className="text-zinc-400 text-xs font-mono">↓ produit docs/briefs/*.md</div>
          </div>
          <div className="flex justify-center mb-2">
            <div className="text-zinc-400 text-xs font-mono">↓ sinon demande directe</div>
          </div>

          {/* Orion center */}
          <div className="flex justify-center mb-2">
            <div className="bg-amber-100 border-2 border-amber-400 rounded px-5 py-2.5 font-mono font-bold text-amber-900 text-sm">
              ✦ Orion (team-lead)
            </div>
          </div>

          {/* Bidirectional arrow */}
          <div className="flex justify-center mb-2">
            <div className="text-zinc-400 text-xs font-mono">
              ↕ planifie · délègue · synthétise
            </div>
          </div>

          {/* Sub-agents row */}
          <div className="flex gap-2 justify-center flex-wrap mt-2">
            <FlowBox color="blue">planning</FlowBox>
            <FlowBox color="red">bug-finder</FlowBox>
            <FlowBox color="zinc">general agents</FlowBox>
            <FlowBox color="purple">review-manager</FlowBox>
            <FlowBox color="green">harness</FlowBox>
            <FlowBox color="cyan">gardener</FlowBox>
          </div>

          {/* Review sub-agents */}
          <div className="flex justify-center mt-3 gap-2 flex-wrap">
            <div className="text-[10px] text-zinc-400 font-mono mr-2 mt-1">
              └─ spawned by review-manager:
            </div>
            <FlowBox color="purple" small>
              code-reviewer
            </FlowBox>
            <FlowBox color="purple" small>
              security-reviewer
            </FlowBox>
            <FlowBox color="purple" small>
              requirements-reviewer
            </FlowBox>
          </div>
        </div>
      </div>

      <H3>Ce que le plugin enregistre</H3>
      <Table
        headers={["Agent", "Mode", "Temp", "Variant", "Rôle résumé"]}
        rows={[
          [
            <Code>team-lead</Code>,
            "all",
            "0.3",
            "max",
            "Orchestrateur principal",
          ],
          [
            <Code>review-manager</Code>,
            "subagent",
            "0.2",
            "max",
            "Arbitre des reviews",
          ],
          [
            <Code>code-reviewer</Code>,
            "subagent",
            "0.2",
            "—",
            "Correctness & maintenabilité",
          ],
          [
            <Code>security-reviewer</Code>,
            "subagent",
            "0.2",
            "—",
            "Vulnérabilités & exposition",
          ],
          [
            <Code>requirements-reviewer</Code>,
            "subagent",
            "0.2",
            "—",
            "Conformité aux specs",
          ],
          [<Code>bug-finder</Code>, "all", "0.2", "—", "Root cause analysis"],
          [
            <Code>planning</Code>,
            "all",
            "0.2",
            "—",
            "Exec-plans et contrats de travail",
          ],
          [
            <Code>harness</Code>,
            "all",
            "0.2",
            "—",
            "Encode les patterns en règles",
          ],
          [
            <Code>gardener</Code>,
            "all",
            "0.2",
            "—",
            "Doc-gardening + Code-GC",
          ],
          [
            <Code>brainstorm</Code>,
            "all",
            "0.5",
            "max",
            "Découverte produit → product brief",
          ],
        ]}
      />
    </div>
  );
}

function SectionPhases() {
  const phases = [
    {
      num: "1",
      name: "Comprendre",
      color: "blue" as const,
      description:
        "Orion commence chaque mission en lisant son état courant : le scratchpad, puis deux appels obligatoires aux lifecycle tools. Il qualifie ensuite la demande.",
      steps: [
        "Lire scratchpad.md",
        "Appeler project_state() — état complet des exec-plans, specs, briefs",
        "Appeler check_artifacts() — cohérence inter-artefacts, refs mortes, statuts stales",
        "Qualifier : Bug / Feature complexe / Feature simple / Maintenance",
      ],
      agents: ["Orion seul — phase de lecture"],
    },
    {
      num: "2",
      name: "Planifier",
      color: "amber" as const,
      description:
        "Selon la qualification, Orion choisit sa stratégie de planification. La règle : plus c'est ambigu ou complexe, plus il faut un contrat formel.",
      steps: [
        "Écrire le plan dans scratchpad.md",
        "Créer une todo list",
        "Si complexe/ambigu → déléguer au planning agent (→ exec-plan.md)",
        "Si simple/clair → plan inline dans scratchpad",
        "Si bug → bug-finder en priorité",
      ],
      agents: ["planning (si complexe/ambigu)", "bug-finder (si bug)"],
    },
    {
      num: "3",
      name: "Déléguer",
      color: "green" as const,
      description:
        "Lancement des agents spécialisés avec un contexte complet. Parallélisation maximale des tâches indépendantes.",
      steps: [
        "Lancer les agents avec contexte complet (objectif, contraintes, fichiers concernés)",
        "Utiliser des personas descriptifs et spécifiques",
        "Paralléliser les tâches indépendantes",
        "Pointer vers les fichiers pertinents dans la délégation",
      ],
      agents: ["general agents", "agents spécialisés selon le domaine"],
    },
    {
      num: "4",
      name: "Réviser",
      color: "purple" as const,
      description:
        "TOUS les changements code/archi/infra passent par le review-manager. Maximum 2 rounds. Le verdict détermine la suite.",
      steps: [
        "Déléguer au review-manager (qui spawne les reviewers en parallèle)",
        "APPROVED → rapport + mise à jour decision log",
        "CHANGES_REQUESTED → fix via agent + re-review (max 2 rounds)",
        "BLOCKED → escalade immédiate à l'utilisateur",
      ],
      agents: [
        "review-manager",
        "code-reviewer",
        "security-reviewer",
        "requirements-reviewer",
      ],
    },
    {
      num: "5",
      name: "Synthétiser",
      color: "cyan" as const,
      description:
        "Auto-évaluation, mise à jour de la mémoire, rapport à l'utilisateur, et suggestions de suivi si pertinent.",
      steps: [
        "Checklist d'auto-évaluation : tout livré ? docs à jour ? tests OK ?",
        "Mettre à jour scratchpad.md avec le résumé de mission",
        "Rapport structuré à l'utilisateur",
        "Suggérer gardener si patterns émergents",
        "Suggérer harness si pattern récurrent détecté",
      ],
      agents: ["Orion", "gardener (suggestion)", "harness (suggestion)"],
    },
  ];

  return (
    <div>
      <SectionTitle>Les 5 phases d'Orion</SectionTitle>
      <SectionSubtitle>
        Chaque mission suit ce workflow linéaire. La rigueur du processus est ce
        qui garantit la qualité des livrables.
      </SectionSubtitle>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-zinc-200" />
        {phases.map((phase, idx) => {
          const dotColors = {
            blue: "bg-blue-400",
            amber: "bg-amber-400",
            green: "bg-green-400",
            purple: "bg-violet-400",
            cyan: "bg-cyan-400",
          };
          const headerBg = {
            blue: "bg-blue-50 border-blue-200 text-blue-700",
            amber: "bg-amber-50 border-amber-200 text-amber-800",
            green: "bg-green-50 border-green-200 text-green-700",
            purple: "bg-violet-50 border-violet-200 text-violet-700",
            cyan: "bg-cyan-50 border-cyan-200 text-cyan-700",
          };
          const cardBorder = {
            blue: "border-blue-200",
            amber: "border-amber-200",
            green: "border-green-200",
            purple: "border-violet-200",
            cyan: "border-cyan-200",
          };
          return (
            <div key={idx} className="relative pl-12 pb-8">
              <div
                className={`absolute left-3.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${dotColors[phase.color]}`}
              />
              <div className={`border rounded-sm ${cardBorder[phase.color]}`}>
                <div
                  className={`px-4 py-2 border-b flex items-center gap-3 ${headerBg[phase.color]}`}
                >
                  <span className="font-mono text-xs opacity-60">
                    Phase {phase.num}
                  </span>
                  <span className="font-semibold text-sm">{phase.name}</span>
                </div>
                <div className="px-4 py-3 bg-white">
                  <p className="text-zinc-600 text-sm mb-3">
                    {phase.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Étapes
                      </div>
                      <ul className="space-y-1">
                        {phase.steps.map((s, i) => (
                          <li
                            key={i}
                            className="text-xs text-zinc-600 flex gap-1.5"
                          >
                            <span className="text-zinc-300 mt-0.5 shrink-0">
                              ›
                            </span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Agents impliqués
                      </div>
                      <ul className="space-y-1">
                        {phase.agents.map((a, i) => (
                          <li
                            key={i}
                            className="text-xs text-zinc-600 flex gap-1.5"
                          >
                            <span className="text-zinc-300 mt-0.5 shrink-0">
                              ›
                            </span>
                            <Code>{a}</Code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionFlows() {
  const [active, setActive] = useState<
    "delivery" | "bug" | "maintenance" | "discovery"
  >("discovery");

  return (
    <div>
      <SectionTitle>Les flux principaux</SectionTitle>
      <SectionSubtitle>
        Selon la nature de la demande, Orion (ou Brainstorm en Phase 0) suit un
        flux différent. Le flux Orion est déterminé lors de la phase Comprendre.
      </SectionSubtitle>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(
          [
            { id: "discovery", label: "Phase 0 — Découverte" },
            { id: "delivery", label: "Livraison (Feature)" },
            { id: "bug", label: "Bug" },
            { id: "maintenance", label: "Maintenance" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-sm border transition-colors ${
              active === tab.id
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "discovery" && (
        <div>
          <H3>Flux Phase 0 — Découverte produit (Brainstorm)</H3>
          <P>
            Le brainstorm s'exécute <strong className="text-zinc-900">avant</strong>{" "}
            Orion et Planning. Il transforme une idée floue en product brief
            structuré via un dialogue Socratique en 3 phases.
          </P>
          <div className="bg-zinc-50 border border-zinc-200 rounded p-5 mt-2">
            <div className="flex flex-col items-center gap-1 max-w-sm mx-auto">
              <FlowBox color="zinc">👤 User → brainstorm agent</FlowBox>
              <Arrow label="Démarrage de session" />

              {/* Démarrage de session block */}
              <div className="w-full border border-blue-200 rounded bg-blue-50/50 p-3">
                <div className="text-xs font-mono text-blue-700 font-semibold mb-2">
                  Démarrage de session — explorer docs/briefs/
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="border border-blue-100 rounded p-1.5 bg-white text-center">
                    <div className="font-mono text-blue-600 mb-1">Aucun brief</div>
                    <div className="text-zinc-500">→ Phase 1</div>
                  </div>
                  <div className="border border-amber-100 rounded p-1.5 bg-white text-center">
                    <div className="font-mono text-amber-600 mb-1">Draft existant</div>
                    <div className="text-zinc-500">continuer / nouveau</div>
                  </div>
                  <div className="border border-green-100 rounded p-1.5 bg-white text-center">
                    <div className="font-mono text-green-600 mb-1">Brief terminé</div>
                    <div className="text-zinc-500">réviser / nouveau</div>
                  </div>
                  <div className="border border-zinc-100 rounded p-1.5 bg-white text-center">
                    <div className="font-mono text-zinc-500 mb-1">Multiples</div>
                    <div className="text-zinc-500">liste → user choisit</div>
                  </div>
                </div>
              </div>

              <Arrow />

              {/* Phase 1 */}
              <div className="w-full border border-blue-200 rounded bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Phase 1
                  </span>
                  <span className="text-xs font-semibold text-zinc-700">
                    Découverte
                  </span>
                </div>
                <ul className="space-y-1 text-[10px] text-zinc-500">
                  <li>≤ 2 questions à la fois</li>
                  <li>Fin : problème en 2-4 phrases, utilisateur principal nommé</li>
                </ul>
              </div>

              <Arrow />

              {/* Phase 2 */}
              <div className="w-full border border-amber-200 rounded bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Phase 2
                  </span>
                  <span className="text-xs font-semibold text-zinc-700">
                    Approfondissement
                  </span>
                </div>
                <ul className="space-y-1 text-[10px] text-zinc-500">
                  <li>Scope, Critères de succès, Cas d'usage, Contraintes, Idées rejetées</li>
                  <li>4 questions de défi</li>
                  <li>webfetch autorisé pour contexte domaine externe</li>
                </ul>
              </div>

              <Arrow label="Obligatoire avant Phase 3" />

              {/* Vérification adversariale */}
              <div className="w-full border border-red-200 rounded bg-red-50/50 p-3">
                <div className="text-xs font-mono text-red-700 font-semibold mb-2">
                  Vérification adversariale
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[10px] text-zinc-600">
                  <li>
                    "Voici le meilleur argument contre ce projet…" → 3 choix proposés
                  </li>
                  <li>
                    "Qu'est-ce qui devrait être vrai pour que ça échoue en 1 an ?"
                    → enregistré en Open Questions / Contraintes
                  </li>
                </ol>
                <p className="text-[10px] text-zinc-400 mt-1.5 italic">
                  Séquentiel, obligatoire, exécuté une seule fois.
                </p>
              </div>

              <Arrow />

              {/* Phase 3 */}
              <div className="w-full border border-green-200 rounded bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                    Phase 3
                  </span>
                  <span className="text-xs font-semibold text-zinc-700">
                    Rédaction + Validation
                  </span>
                </div>
                <ul className="space-y-1 text-[10px] text-zinc-500">
                  <li>Générer le brief complet → présenter inline (pas d'écriture)</li>
                  <li>Itérer via question → Quality Gate</li>
                </ul>
              </div>

              <Arrow label="Quality Gate passée" />

              {/* Quality Gate */}
              <div className="w-full border border-zinc-200 rounded bg-white p-3">
                <div className="text-xs font-mono text-zinc-500 font-semibold mb-2">
                  Quality Gate
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="border border-zinc-100 rounded p-1.5 bg-zinc-50">
                    <div className="font-mono text-zinc-600 mb-1">Tier 1 — auto-fix</div>
                    <div className="text-zinc-400">Solution dans Problème, Vision &gt;3 phrases, nom non kebab-case…</div>
                  </div>
                  <div className="border border-red-100 rounded p-1.5 bg-red-50/50">
                    <div className="font-mono text-red-600 mb-1">Tier 2 — question obligatoire</div>
                    <div className="text-zinc-400">Utilisateur vague, Cas sans AC, Critère non mesurable…</div>
                    <div className="text-red-400 mt-1">+ STOP si bloquant (Problème absent, Scope In vide…)</div>
                  </div>
                </div>
              </div>

              <Arrow />
              <FlowBox color="blue">Écrire docs/briefs/&#123;nom&#125;.md</FlowBox>
              <Arrow label="Transfert" />
              <div className="flex gap-2 justify-center">
                <FlowBox color="blue" small>→ planning agent</FlowBox>
                <FlowBox color="amber" small>→ Orion</FlowBox>
              </div>
            </div>
          </div>
        </div>
      )}

      {active === "delivery" && (
        <div>
          <H3>Flux Livraison (Feature)</H3>
          <P>
            Utilisé pour les nouvelles fonctionnalités, les refactors, et tous
            les travaux d'implémentation planifiés.
          </P>
          <div className="bg-zinc-50 border border-zinc-200 rounded p-5 mt-2">
            <div className="flex flex-col items-center gap-1 max-w-sm mx-auto">
              <FlowBox color="zinc">👤 User → Orion qualifie</FlowBox>
              <Arrow />
              <div className="w-full border border-zinc-200 rounded bg-white p-3">
                <div className="text-xs font-mono text-zinc-400 mb-2">
                  Branche de planification
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-blue-100 rounded p-2 bg-blue-50/50">
                    <div className="text-[10px] font-mono text-blue-600 mb-1">
                      Si complexe/ambigu
                    </div>
                    <FlowBox color="blue" small>
                      planning agent
                    </FlowBox>
                    <Arrow />
                    <FlowBox color="blue" small>
                      exec-plan.md
                    </FlowBox>
                    <div className="text-[9px] font-mono text-blue-400 text-center mt-1">
                      status: draft → active
                    </div>
                  </div>
                  <div className="border border-zinc-100 rounded p-2 bg-zinc-50">
                    <div className="text-[10px] font-mono text-zinc-500 mb-1">
                      Si simple/clair
                    </div>
                    <FlowBox color="zinc" small>
                      plan inline
                    </FlowBox>
                    <Arrow />
                    <FlowBox color="zinc" small>
                      scratchpad.md
                    </FlowBox>
                  </div>
                </div>
              </div>
              <Arrow label="Par bloc" />
              <div className="w-full border border-zinc-200 rounded bg-white p-3">
                <div className="text-xs font-mono text-zinc-400 mb-2">
                  Boucle d'implémentation
                </div>
                <FlowBox color="zinc">general agent → implémente</FlowBox>
                <Arrow />
                <FlowBox color="purple">review-manager</FlowBox>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-green-600 mb-1">
                      APPROVED
                    </div>
                    <FlowBox color="green" small>
                      ✓ bloc validé
                    </FlowBox>
                    <div className="text-[9px] text-zinc-400 mt-1">
                      update decision log
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-amber-600 mb-1">
                      CHANGES_REQ.
                    </div>
                    <FlowBox color="amber" small>
                      fix + re-review
                    </FlowBox>
                    <div className="text-[9px] text-zinc-400 mt-1">
                      max 2 rounds
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-red-600 mb-1">
                      BLOCKED
                    </div>
                    <FlowBox color="red" small>
                      escalate
                    </FlowBox>
                    <div className="text-[9px] text-zinc-400 mt-1">→ user</div>
                  </div>
                </div>
              </div>
              <Arrow label="Tous blocs ✓" />
              <FlowBox color="blue">exec-plan: completed</FlowBox>
              <Arrow />
              <FlowBox color="cyan">
                Post-delivery: suggest Gardener + Harness
              </FlowBox>
            </div>
          </div>
        </div>
      )}

      {active === "bug" && (
        <div>
          <H3>Flux Bug</H3>
          <P>
            La règle : <strong className="text-zinc-900">toujours</strong>{" "}
            passer par bug-finder avant d'implémenter un fix, sauf si la ligne
            exacte fautive est déjà identifiée avec certitude.
          </P>
          <div className="bg-zinc-50 border border-zinc-200 rounded p-5 mt-2">
            <div className="flex flex-col items-center gap-1 max-w-xs mx-auto">
              <FlowBox color="zinc">Bug report → Orion</FlowBox>
              <Arrow />
              <FlowBox color="red">bug-finder (root cause)</FlowBox>
              <Arrow />
              <div className="w-full border border-zinc-200 rounded bg-white p-3">
                <div className="text-xs font-mono text-zinc-400 mb-2">
                  Pattern Detection block
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-[10px] font-mono text-zinc-500">
                      Pattern: YES/NO
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Encodable: YES/NO
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-mono text-amber-600">
                      Certitude:
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      HIGH / MEDIUM / UNCERTAINTY
                    </div>
                  </div>
                </div>
              </div>
              <Arrow />
              <FlowBox color="zinc">general agent (fix)</FlowBox>
              <Arrow />
              <FlowBox color="purple">review-manager</FlowBox>
              <Arrow />
              <div className="w-full border border-amber-100 rounded bg-amber-50/50 p-2 text-center">
                <div className="text-[10px] font-mono text-amber-700">
                  Si Pattern=YES + Encodable=YES
                </div>
                <Arrow />
                <FlowBox color="green" small>
                  → suggest Harness
                </FlowBox>
              </div>
            </div>
          </div>
        </div>
      )}

      {active === "maintenance" && (
        <div>
          <H3>Flux Maintenance</H3>
          <P>
            Le gardener est le point d'entrée de la maintenance. Il opère en
            deux modes : doc-gardening et code-GC. Les patterns récurrents qu'il
            détecte deviennent des règles mécaniques via le harness.
          </P>
          <div className="bg-zinc-50 border border-zinc-200 rounded p-5 mt-2">
            <div className="flex flex-col items-center gap-1 max-w-sm mx-auto">
              <FlowBox color="cyan">
                Gardener (post-feature ou périodique)
              </FlowBox>
              <div className="flex gap-3 mt-2 w-full">
                <div className="flex-1 border border-cyan-100 rounded p-2 bg-cyan-50/50">
                  <div className="text-[10px] font-mono text-cyan-700 text-center mb-2">
                    Fonction 1 : Doc-gardening
                  </div>
                  <FlowBox color="cyan" small>
                    docs stales vs code réel
                  </FlowBox>
                  <Arrow />
                  <FlowBox color="cyan" small>
                    PRs de correction
                  </FlowBox>
                </div>
                <div className="flex-1 border border-zinc-100 rounded p-2 bg-zinc-50">
                  <div className="text-[10px] font-mono text-zinc-500 text-center mb-2">
                    Fonction 2 : Code-GC
                  </div>
                  <FlowBox color="zinc" small>
                    vérifie dérives sémantiques
                  </FlowBox>
                  <Arrow />
                  <div className="grid grid-cols-1 gap-1">
                    <FlowBox color="amber" small>
                      one-time → PR directe
                    </FlowBox>
                    <FlowBox color="red" small>
                      pattern récurrent → Harness
                    </FlowBox>
                  </div>
                </div>
              </div>
              <Arrow label="Si pattern récurrent" />
              <FlowBox color="green">Harness agent</FlowBox>
              <Arrow />
              <FlowBox color="green">Identifie → Choisit artefact</FlowBox>
              <Arrow />
              <div className="flex gap-1 flex-wrap justify-center">
                <FlowBox color="green" small>
                  lint rule
                </FlowBox>
                <FlowBox color="green" small>
                  CI check
                </FlowBox>
                <FlowBox color="green" small>
                  AGENTS.md
                </FlowBox>
                <FlowBox color="green" small>
                  guiding-principles
                </FlowBox>
              </div>
              <Arrow />
              <FlowBox color="zinc">
                PR → artefact s'exécute autonomement
              </FlowBox>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionAgents() {
  return (
    <div>
      <SectionTitle>Les agents</SectionTitle>
      <SectionSubtitle>
        Chaque agent a un rôle précis, des permissions restreintes au minimum
        nécessaire, et des conditions d'activation explicites.
      </SectionSubtitle>

      <AgentCard
        name="brainstorm agent"
        role="Phase 0 — Product Brief Agent. Aide l'utilisateur à découvrir et articuler ce qu'il veut construire. Produit un product brief structuré dans docs/briefs/{project-name}.md. S'exécute avant Orion et avant Planning. N'implémente rien — pure discovery."
        color="blue"
        temp="0.5"
        variant="max"
        mode="all"
        triggers={[
          "Demande floue ou ouverte (\"je voudrais construire quelque chose qui...\")",
          "Invocation directe par l'utilisateur",
          "Brief existant dans docs/briefs/ → reprise ou révision du brief",
          "Contexte suffisant dès le départ → passage direct à la Phase 3",
          "Demande très vague reçue par Orion → Orion peut suggérer le brainstorm comme Phase 0",
        ]}
        permissions={[
          "task",
          "question",
          "webfetch",
          "write docs/briefs/**",
        ]}
        details={
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Démarrage de session
                </div>
                <ul className="space-y-1 text-xs text-zinc-600">
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Délègue <Code>explore docs/briefs/</Code> en premier
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Aucun brief → Phase 1 directement
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Draft trouvé → continuer ou nouveau brief
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Brief terminé → réviser ou nouveau
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Multiples → liste, l'utilisateur choisit
                  </li>
                </ul>
                <p className="text-[11px] text-zinc-400 mt-2 italic">
                  La lecture de fichiers est déléguée à un sous-agent{" "}
                  <Code>explore</Code> via <Code>task</Code>.
                </p>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Workflow 3 phases
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-2 items-start">
                    <Badge color="blue">Phase 1</Badge>
                    <span className="text-xs text-zinc-600">
                      Découverte — ≤ 2 questions, problème en 2-4 phrases
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Badge color="amber">Phase 2</Badge>
                    <span className="text-xs text-zinc-600">
                      Approfondissement — Scope, Critères, Cas d'usage, Contraintes
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Badge color="green">Phase 3</Badge>
                    <span className="text-xs text-zinc-600">
                      Rédaction + Validation — brief inline → Quality Gate → écriture fichier
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-zinc-100 pt-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Vérification adversariale (entre Phase 2 et Phase 3)
              </div>
              <ol className="space-y-1.5 list-decimal list-inside text-xs text-zinc-600">
                <li>
                  "Voici le meilleur argument contre ce projet…" → 3 choix proposés à l'utilisateur
                </li>
                <li>
                  "Qu'est-ce qui devrait être vrai pour que ça échoue en 1 an ?" →
                  enregistré en Open Questions / Contraintes
                </li>
              </ol>
              <p className="text-[11px] text-zinc-400 mt-1.5 italic">
                Séquentielle, obligatoire, exécutée une seule fois avant la Phase 3.
              </p>
            </div>

            <div className="mt-3 border-t border-zinc-100 pt-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Quality Gate
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge color="zinc">Tier 1 — auto-fix silencieux</Badge>
                <Badge color="amber">Tier 2 — question obligatoire</Badge>
                <Badge color="red">Tier 2 — STOP si bloquant</Badge>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                <li className="flex gap-1.5">
                  <span className="text-zinc-300">›</span>
                  Questions (Tier 2) : utilisateur vague, cas sans AC, critère non mesurable, rationale inconnu
                </li>
                <li className="flex gap-1.5">
                  <span className="text-zinc-300">›</span>
                  STOP conditions : Problème absent, aucun critère de succès, Scope In vide
                </li>
              </ul>
            </div>

            <div className="mt-3 border-t border-zinc-100 pt-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Artefact de sortie
              </div>
              <div className="bg-zinc-900 rounded p-3 font-mono text-xs text-zinc-300">
                <div className="text-zinc-500"># docs/briefs/&#123;project-name&#125;.md</div>
                <div className="text-zinc-500 mt-1">---</div>
                <div className="text-zinc-400">project: nom-en-kebab-case</div>
                <div className="text-zinc-400">type: product  <span className="text-zinc-600"># product | tool | library | service | experiment</span></div>
                <div className="text-zinc-400">status: draft | done</div>
                <div className="text-zinc-400">created / updated: date</div>
                <div className="text-zinc-500 mt-1">---</div>
                <div className="text-green-400 mt-1">## Problem</div>
                <div className="text-zinc-500">## Vision</div>
                <div className="text-zinc-500">## Users (Primary / Secondary)</div>
                <div className="text-zinc-500">## Core Use Cases (UC-NNN)</div>
                <div className="text-zinc-500">## Success Criteria (SC-NNN)</div>
                <div className="text-zinc-500">## Scope (In / Out)</div>
                <div className="text-zinc-500">## Constraints</div>
                <div className="text-zinc-500">## Open Questions</div>
                <div className="text-zinc-500">## Rejected Ideas</div>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                Phase 0 — s'exécute avant Orion et avant le planning agent.
                Ne fait PAS : market research, architecture technique, tickets, backlog.
              </div>
              <div className="mt-1.5 text-xs text-zinc-400 italic">
                Le brief est toujours rédigé en anglais, quelle que soit la langue de la session.
              </div>
            </div>
          </div>
        }
      />

      <AgentCard
        name="orion (team-lead)"
        role="Orchestrateur pur. Planifie, délègue, synthétise. Ne touche JAMAIS au code directement. Qualifie les demandes, choisit les agents, supervise les reviews, et fait les rapports à l'utilisateur."
        color="amber"
        temp="0.3"
        variant="max"
        mode="all"
        triggers={[
          "Toute demande utilisateur",
          "Point d'entrée principal du système",
        ]}
        permissions={[
          "task",
          "todowrite",
          "todoread",
          "skill",
          "question",
          "distill",
          "prune",
          "compress",
          "read/write scratchpad.md",
          "git bash only",
        ]}
        details={
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Ce qu'Orion NE fait PAS
            </div>
            <ul className="space-y-1">
              {[
                "Modifier des fichiers source (sauf scratchpad.md)",
                "Exécuter des commandes shell arbitraires",
                "Implémenter du code",
                "Accéder à internet",
              ].map((item, i) => (
                <li key={i} className="text-xs text-red-600 flex gap-1.5">
                  <span className="mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <AgentCard
        name="review-manager"
        role='Évaluateur — le "E" du pattern Generator/Evaluator. Orchestre les trois reviewers spécialisés en parallèle, synthétise leurs verdicts, et rend un jugement final : APPROVED, CHANGES_REQUESTED, ou BLOCKED.'
        color="purple"
        temp="0.2"
        variant="max"
        mode="subagent"
        triggers={[
          "Tout changement code/archi/infra soumis par Orion",
          "Jamais invoqué directement par l'utilisateur",
        ]}
        permissions={["task", "question"]}
        details={
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Verdicts possibles
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge color="green">APPROVED</Badge>
              <Badge color="amber">CHANGES_REQUESTED</Badge>
              <Badge color="red">BLOCKED</Badge>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Spawne code-reviewer, security-reviewer et requirements-reviewer
              en parallèle. Maximum 2 rounds de review par bloc.
            </p>
          </div>
        }
      />

      <div className="border border-zinc-200 rounded-sm mb-6 bg-zinc-50/50 p-4">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Reviewers spécialisés (spawned by review-manager)
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              name: "code-reviewer",
              focus: "Correctness, logic, error handling, maintenabilité",
              color: "border-violet-200",
            },
            {
              name: "security-reviewer",
              focus: "Vulnérabilités, misconfigurations, exposition de données",
              color: "border-violet-200",
            },
            {
              name: "requirements-reviewer",
              focus: "Conformité avec les requirements originaux",
              color: "border-violet-200",
            },
          ].map((r, i) => (
            <div
              key={i}
              className={`border ${r.color} rounded bg-white p-3 border-l-2 border-l-violet-300`}
            >
              <Code>{r.name}</Code>
              <p className="text-xs text-zinc-500 mt-2">{r.focus}</p>
              <div className="mt-2">
                <Badge color="purple">mode: subagent</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AgentCard
        name="bug-finder"
        role="Analyse de cause racine structurée avant tout fix. Force les 4 questions fondamentales : Qu'est-ce qui est cassé exactement ? Pourquoi est-ce cassé ? Qu'est-ce qui a changé ? Est-ce un pattern ?"
        color="red"
        temp="0.2"
        mode="all"
        triggers={[
          "Tout bug report (sauf ligne exacte identifiée avec certitude)",
          "Comportement inattendu sans cause évidente",
        ]}
        permissions={["task", "question"]}
        details={
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Format de sortie
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Badge color="green">HIGH → implémentation directe</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge color="amber">MEDIUM → implémenter + signaler</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge color="red">
                  UNCERTAINTY_EXPOSED → questions avant de continuer
                </Badge>
              </div>
            </div>
            <div className="mt-3 bg-zinc-50 rounded p-2 font-mono text-xs text-zinc-600">
              <div className="font-semibold mb-1">Pattern Detection block:</div>
              <div>Pattern récurrent: YES / NO</div>
              <div>Mécaniquement encodable: YES / NO</div>
              <div className="text-amber-700 mt-1">
                Si YES+YES → Orion suggère Harness
              </div>
            </div>
          </div>
        }
      />

      <AgentCard
        name="planning agent"
        role='Rédige les contrats de travail (exec-plans). Doctrine : "Contraindre les livrables, laisser les agents trouver comment." Deux modes : plan inline dans scratchpad (simple) ou exec-plan.md (complexe).'
        color="blue"
        temp="0.2"
        mode="all"
        triggers={[
          "Feature complexe ou ambiguë",
          "Projet multi-blocs avec dépendances",
          "Quand Orion ne peut pas planifier inline sans risque",
        ]}
        permissions={[
          "task",
          "question",
          "read",
          "write docs/exec-plans/",
        ]}
        details={
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Template exec-plan
            </div>
            <div className="bg-zinc-900 rounded p-3 font-mono text-xs text-zinc-300">
              <div className="text-zinc-500">
                # exec-plan: &lt;feature&gt;
              </div>
              <div className="text-zinc-500">
                status: draft | active | completed
              </div>
              <div className="mt-1 text-green-400">## Goal</div>
              <div className="text-zinc-500">## Scope</div>
              <div className="text-zinc-500">## Building blocks</div>
              <div className="text-zinc-500 pl-2">
                - [ ] Bloc 1 (Done when: X, Depends on: —)
              </div>
              <div className="text-zinc-500">## Open questions</div>
              <div className="text-zinc-500">## Decision log</div>
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Activation : complexe OU ambigu. PAS pour bugs (→ bug-finder).
              PAS pour tâches simples.
            </div>
          </div>
        }
      />

      <AgentCard
        name="harness agent"
        role="Transforme un pattern émergent en règle mécanique permanente dans le repo. N'est PAS un setup one-shot. Ne corrige pas les violations existantes — installe le filet pour l'avenir."
        color="green"
        temp="0.2"
        mode="all"
        triggers={[
          "Pattern récurrent détecté par bug-finder (Pattern=YES + Encodable=YES)",
          "Pattern récurrent détecté par gardener",
          "Déclenchement direct par l'utilisateur",
        ]}
        permissions={[
          "task",
          "question",
          "read",
          "write",
          "bash (lint, CI tools)",
        ]}
        details={
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Hiérarchie des artefacts (préférence décroissante)
            </div>
            <div className="flex gap-1 items-center flex-wrap">
              <Badge color="green">lint rule</Badge>
              <span className="text-zinc-400 text-xs">›</span>
              <Badge color="zinc">CI check</Badge>
              <span className="text-zinc-400 text-xs">›</span>
              <Badge color="zinc">AGENTS.md</Badge>
              <span className="text-zinc-400 text-xs">›</span>
              <Badge color="zinc">guiding-principles</Badge>
            </div>
            <div className="mt-3 text-xs text-zinc-500">
              <strong className="text-zinc-700">Workflow :</strong> Identifier le
              pattern → Choisir l'artefact → Générer la règle (le linter
              lui-même, pas une description) → Tester contre le code existant →
              Ouvrir une PR
            </div>
          </div>
        }
      />

      <AgentCard
        name="gardener agent"
        role="Double fonction : doc-gardening (docs stales vs code réel) et code-GC (dérives sémantiques vs guiding-principles). Met à jour QUALITY_SCORE.md. Suggère harness si pattern récurrent."
        color="cyan"
        temp="0.2"
        mode="all"
        triggers={[
          "Post-feature (suggéré par Orion)",
          "Invocation directe par l'utilisateur",
          "Sweep périodique (daily background sweep — TBD)",
        ]}
        permissions={[
          "task",
          "question",
          "read",
          "write docs/",
          "write QUALITY_SCORE.md",
          "bash (git)",
        ]}
        details={
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Fonction 1 : Doc-gardening
                </div>
                <ul className="space-y-1 text-xs text-zinc-600">
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Trouve docs stales vs code réel
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Ouvre des PRs de correction
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Vérifie README, AGENTS.md, specs
                  </li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Fonction 2 : Code-GC
                </div>
                <ul className="space-y-1 text-xs text-zinc-600">
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Vérifie vs guiding-principles + AGENTS.md
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Dérive one-time → PR directe
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Pattern récurrent → trigger Harness
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-zinc-300">›</span>
                    Met à jour QUALITY_SCORE.md
                  </li>
                </ul>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}

function SectionMemory() {
  return (
    <div>
      <SectionTitle>Mémoire & État</SectionTitle>
      <SectionSubtitle>
        Deux artefacts de mémoire complémentaires : le scratchpad pour la
        mission courante, l'exec-plan pour le contrat de feature.
      </SectionSubtitle>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-zinc-200 rounded-sm bg-white">
          <div className="bg-zinc-900 text-zinc-100 px-4 py-2.5 rounded-t-sm font-mono text-sm flex items-center justify-between">
            <span>scratchpad.md</span>
            <Badge color="amber">éphémère</Badge>
          </div>
          <div className="p-4">
            <p className="text-sm text-zinc-600 mb-3">
              Mémoire de travail d'Orion pour la mission courante. Survit aux
              resets de contexte. Écrasé à chaque nouvelle mission.
            </p>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Contenu
            </div>
            <ul className="space-y-1 text-xs text-zinc-600">
              {[
                "Mission courante",
                "Plan (blocs, dépendances)",
                "Tâche active (sous-tâches, fichiers modifiés, resume context)",
                "Résultats des agents",
                "Décisions prises",
                "Questions ouvertes",
                "Scopes parkés",
              ].map((item, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-zinc-300 mt-0.5">›</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-3 bg-zinc-50 rounded p-2 text-xs text-zinc-500">
              <Code>.opencode/scratchpad.md</Code>
            </div>
          </div>
        </div>

        <div className="border border-zinc-200 rounded-sm bg-white">
          <div className="bg-blue-900 text-blue-100 px-4 py-2.5 rounded-t-sm font-mono text-sm flex items-center justify-between">
            <span>exec-plan.md</span>
            <Badge color="blue">permanent</Badge>
          </div>
          <div className="p-4">
            <p className="text-sm text-zinc-600 mb-3">
              Contrat de travail de la feature. Partagé, archivé, mis à jour
              pendant l'implémentation. Répond à : quoi + done-when +
              depends-on.
            </p>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Lifecycle
            </div>
            <div className="flex gap-2 items-center mb-3">
              <Badge color="zinc">draft</Badge>
              <span className="text-zinc-400 text-xs">→</span>
              <Badge color="amber">active</Badge>
              <span className="text-zinc-400 text-xs">→</span>
              <Badge color="green">completed</Badge>
            </div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Contenu
            </div>
            <ul className="space-y-1 text-xs text-zinc-600">
              {[
                "Goal (l'objectif final)",
                "Scope (in/out)",
                "Building blocks (Done when + Depends on)",
                "Open questions",
                "Decision log (mis à jour par Orion)",
              ].map((item, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-zinc-300 mt-0.5">›</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-3 bg-zinc-50 rounded p-2 text-xs text-zinc-500">
              <Code>docs/exec-plans/&lt;feature&gt;.md</Code>
            </div>
          </div>
        </div>
      </div>

      <H3>Différences clés</H3>
      <Table
        headers={["", "Scratchpad", "Exec-plan"]}
        rows={[
          ["Scope", "Session Orion courante", "Feature / projet"],
          [
            "Durée de vie",
            "Éphémère (écrasé chaque mission)",
            "Permanent (archive)",
          ],
          ["Auteur", "Orion", "Planning agent"],
          [
            "Contenu",
            "Qui fait quoi maintenant",
            "Quoi + done-when + depends-on",
          ],
          [
            "Duplication",
            "Jamais — le scratchpad pointe vers l'exec-plan",
            "—",
          ],
          [
            "Survit au context reset",
            <Badge color="green">Oui (hook compaction)</Badge>,
            <Badge color="green">Oui (fichier permanent)</Badge>,
          ],
        ]}
      />

      <H3>Lifecycle tools — les outils qui font avancer les plans</H3>
      <P>
        Orion dispose d'outils de bookkeeping directs — sans délégation, sans
        sous-agent. Ils sont déterministes et non optionnels.
      </P>
      <Table
        headers={["Outil", "Quand", "Effet"]}
        rows={[
          [
            <Code>project_state()</Code>,
            "Début de chaque mission",
            "Vue complète : exec-plans, specs, briefs",
          ],
          [
            <Code>check_artifacts()</Code>,
            "Début de mission + fin de scope",
            "Scan de cohérence inter-artefacts",
          ],
          [
            <Code>mark_block_done(plan, block)</Code>,
            "Après chaque livraison validée",
            "Coche un bloc dans l'exec-plan",
          ],
          [
            <Code>complete_plan(plan)</Code>,
            "Quand tous les blocs sont cochés",
            "Passe l'exec-plan à status: completed",
          ],
          [
            <Code>register_spec(file, title)</Code>,
            "Quand une nouvelle spec doit exister",
            "Crée le fichier spec avec frontmatter minimal",
          ],
        ]}
      />

      <H3>Survie au context reset</H3>
      <P>
        Le scratchpad survit aux resets de contexte via le hook{" "}
        <Code>experimental.session.compacting</Code> — Orion retrouve son état
        courant après une compaction. L'exec-plan, étant un fichier permanent
        sur disque, survit également par nature.
      </P>
    </div>
  );
}

function SectionHarnessGardener() {
  return (
    <div>
      <SectionTitle>Boucle Harness / Gardener</SectionTitle>
      <SectionSubtitle>
        Le mécanisme d'amélioration continue du repo. Ce n'est pas un processus
        humain — c'est une boucle de feedback autonome entre les agents.
      </SectionSubtitle>

      <H3>Philosophie de la boucle</H3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-green-200 bg-green-50/50 rounded p-4">
          <div className="font-mono text-sm font-semibold text-green-800 mb-2">
            harness
          </div>
          <p className="text-sm text-zinc-600">
            <strong className="text-zinc-800">Installe le filet.</strong> Encode
            les patterns récurrents en règles mécaniques (lint, CI, docs). Une
            fois installé, il s'exécute automatiquement sans intervention
            humaine.
          </p>
        </div>
        <div className="border border-cyan-200 bg-cyan-50/50 rounded p-4">
          <div className="font-mono text-sm font-semibold text-cyan-800 mb-2">
            gardener
          </div>
          <p className="text-sm text-zinc-600">
            <strong className="text-zinc-800">Vérifie les mailles.</strong>{" "}
            Détecte ce que lint/CI ne couvrent pas encore — la dérive
            sémantique, les docs stales. S'il trouve un pattern récurrent, il
            déclenche harness pour combler la brèche.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded px-4 py-3 mb-6">
        <div className="text-xs font-mono text-amber-700 font-semibold mb-1">
          DISTINCTION IMPORTANTE
        </div>
        <p className="text-sm text-amber-900">
          Le gardener vérifie UNIQUEMENT ce que lint/CI ne couvrent PAS encore.
          Si le harness a déjà encodé une règle, le gardener n'a pas à la
          revérifier — c'est redondant.
        </p>
      </div>

      <H3>Diagramme de la boucle</H3>
      <div className="bg-zinc-50 border border-zinc-200 rounded p-6 mt-2">
        <div className="flex flex-col items-center gap-1 max-w-md mx-auto">
          <FlowBox color="zinc">Implémentation feature</FlowBox>
          <Arrow />
          <FlowBox color="cyan">Gardener (post-feature sweep)</FlowBox>
          <Arrow />
          <div className="w-full border border-zinc-200 rounded bg-white p-3">
            <div className="text-xs font-mono text-zinc-400 text-center mb-2">
              Dérive détectée ?
            </div>
            <div className="flex gap-3">
              <div className="flex-1 text-center">
                <div className="text-[10px] font-mono text-green-600 mb-1">
                  Non
                </div>
                <FlowBox color="green" small>
                  QUALITY_SCORE.md ↑
                </FlowBox>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-mono text-red-600 mb-1 text-center">
                  Oui
                </div>
                <FlowBox color="amber" small>
                  One-time → PR directe
                </FlowBox>
                <div className="text-center my-1 text-xs text-zinc-400">
                  ou
                </div>
                <div>
                  <FlowBox color="red" small>
                    Pattern récurrent
                  </FlowBox>
                  <Arrow />
                  <FlowBox color="green" small>
                    → Harness
                  </FlowBox>
                  <Arrow />
                  <FlowBox color="green" small>
                    Encode règle mécanique
                  </FlowBox>
                  <Arrow />
                  <FlowBox color="zinc" small>
                    lint / CI / AGENTS.md
                  </FlowBox>
                  <Arrow />
                  <FlowBox color="zinc" small>
                    PR → s'exécute autonomement
                  </FlowBox>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <H3>Règle d'activation du harness</H3>
      <P>
        Le harness n'est PAS un outil de setup initial. Il est déclenché quand
        un pattern a DÉJÀ émergé — la répétition est la preuve qu'une règle
        mécanique est nécessaire.
      </P>
      <Table
        headers={["Trigger", "Source", "Action harness"]}
        rows={[
          [
            "bug-finder détecte Pattern=YES + Encodable=YES",
            "bug-finder output",
            "Orion suggère harness après le fix",
          ],
          [
            "Gardener détecte pattern récurrent",
            "Code-GC sweep",
            "Gardener déclenche harness directement",
          ],
          [
            "User demande explicitement",
            "Invocation directe",
            "Harness analyse et encode",
          ],
        ]}
      />
    </div>
  );
}

function SectionProtocols() {
  return (
    <div>
      <SectionTitle>Protocoles</SectionTitle>
      <SectionSubtitle>
        Les règles opérationnelles qui gouvernent le comportement d'Orion dans
        les situations critiques.
      </SectionSubtitle>

      <H3>Protocole de review</H3>
      <div className="border border-zinc-200 rounded-sm bg-white mb-6">
        <div className="bg-violet-900 text-violet-100 px-4 py-2 font-mono text-sm">
          review-protocol
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2 items-start">
            <div className="bg-zinc-900 text-white text-xs font-mono px-2 py-0.5 rounded mt-0.5 shrink-0">
              règle
            </div>
            <p className="text-sm text-zinc-700">
              TOUS les changements code / architecture / infrastructure passent
              par review-manager, sans exception.
            </p>
          </div>
          <div className="flex gap-2 items-start">
            <div className="bg-zinc-900 text-white text-xs font-mono px-2 py-0.5 rounded mt-0.5 shrink-0">
              max
            </div>
            <p className="text-sm text-zinc-700">
              Maximum <strong>2 rounds de review</strong> par bloc. Après 2
              rounds sans résolution → escalade.
            </p>
          </div>
          <div className="border-t border-zinc-100 pt-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Arbre de décision
            </div>
            <div className="space-y-2">
              <div className="flex gap-3 items-center">
                <Badge color="green">APPROVED</Badge>
                <span className="text-xs text-zinc-600">
                  → rapport à l'utilisateur, mise à jour decision log, ✓ bloc
                </span>
              </div>
              <div className="flex gap-3 items-center">
                <Badge color="amber">CHANGES_REQUESTED</Badge>
                <span className="text-xs text-zinc-600">
                  → fix via agent + re-soumission (max 2 rounds total)
                </span>
              </div>
              <div className="flex gap-3 items-center">
                <Badge color="red">BLOCKED</Badge>
                <span className="text-xs text-zinc-600">
                  → escalade IMMÉDIATE à l'utilisateur, jamais de contournement
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-100 pt-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Quand passer la review
            </div>
            <ul className="space-y-1 text-xs text-zinc-500">
              <li className="flex gap-1.5">
                <span className="text-green-500">✓</span>
                Doc only, pas de sécurité (gardener le vérifie de toute façon)
              </li>
              <li className="flex gap-1.5">
                <span className="text-green-500">✓</span>
                L'utilisateur demande explicitement la vitesse sur une tâche
                triviale
              </li>
            </ul>
          </div>
        </div>
      </div>

      <H3>Protocole bug-finder</H3>
      <div className="border border-zinc-200 rounded-sm bg-white mb-6">
        <div className="bg-red-900 text-red-100 px-4 py-2 font-mono text-sm">
          bug-protocol
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2 items-start">
            <div className="bg-zinc-900 text-white text-xs font-mono px-2 py-0.5 rounded mt-0.5 shrink-0">
              règle
            </div>
            <p className="text-sm text-zinc-700">
              TOUJOURS déléguer au bug-finder en premier — sauf si la ligne
              exacte fautive est identifiée avec certitude absolue.
            </p>
          </div>
          <div className="border-t border-zinc-100 pt-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Comportement selon la certitude
            </div>
            <div className="space-y-2">
              <div className="flex gap-3 items-start">
                <Badge color="green">HIGH</Badge>
                <span className="text-xs text-zinc-600">
                  → implémenter directement sans demander confirmation
                </span>
              </div>
              <div className="flex gap-3 items-start">
                <Badge color="amber">MEDIUM</Badge>
                <span className="text-xs text-zinc-600">
                  → implémenter, mais signaler l'incertitude dans le rapport
                </span>
              </div>
              <div className="flex gap-3 items-start">
                <Badge color="red">UNCERTAINTY_EXPOSED</Badge>
                <span className="text-xs text-zinc-600">
                  → poser les questions à l'utilisateur AVANT de continuer
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <H3>Gestion des erreurs</H3>
      <div className="border border-zinc-200 rounded-sm bg-white mb-6">
        <div className="bg-zinc-800 text-zinc-100 px-4 py-2 font-mono text-sm">
          error-handling
        </div>
        <div className="p-4">
          <Table
            headers={["Situation", "Action"]}
            rows={[
              [
                "Incomplete output / compaction",
                "Décomposer la tâche en unités plus petites",
              ],
              [
                "Wrong approach",
                "Reformuler le prompt, pas retenter à l'identique",
              ],
              [
                "Missing context",
                "Envoyer un explore agent d'abord, puis redéléguer",
              ],
              [
                "2 tentatives échouées",
                "Escalade utilisateur immédiate — jamais une 3ème tentative sans input",
              ],
            ]}
          />
          <div className="bg-red-50 border border-red-200 rounded px-3 py-2 mt-2">
            <p className="text-xs text-red-800 font-semibold">
              NEVER retry with identical inputs.
            </p>
            <p className="text-xs text-red-700 mt-1">
              Si un agent échoue, soit le prompt est reformulé, soit la tâche
              est décomposée, soit on escalade. Jamais de copier-coller de la
              même délégation.
            </p>
          </div>
        </div>
      </div>

      <H3>Gestion du contexte</H3>
      <div className="border border-zinc-200 rounded-sm bg-white">
        <div className="bg-zinc-800 text-zinc-100 px-4 py-2 font-mono text-sm">
          context-management
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {[
              {
                step: "1",
                action: "Update scratchpad FIRST",
                detail:
                  "Avant toute action longue — c'est l'assurance compaction. Si le contexte reset, Orion sait où il en était.",
              },
              {
                step: "2",
                action: "Distill agent outputs",
                detail:
                  "Résumer les sorties d'agents en summaries compacts. Ne pas conserver les outputs bruts dans le contexte.",
              },
              {
                step: "3",
                action: "Prune stale content",
                detail:
                  "Après avoir incorporé les résultats, supprimer les contenus obsolètes du scratchpad.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="bg-zinc-900 text-white text-xs font-mono w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-800">
                    {item.action}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

const navItems: {
  id: Section;
  label: string;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    description: "Architecture générale",
  },
  {
    id: "phases",
    label: "Les 5 phases",
    description: "Workflow de chaque mission",
  },
  {
    id: "flows",
    label: "Les flux",
    description: "Phase 0, Feature, Bug, Maintenance",
  },
  {
    id: "agents",
    label: "Les agents",
    description: "Rôles, permissions, triggers",
  },
  {
    id: "memory",
    label: "Mémoire & État",
    description: "Scratchpad, exec-plan",
  },
  {
    id: "harness-gardener",
    label: "Harness / Gardener",
    description: "Boucle d'amélioration continue",
  },
  {
    id: "protocols",
    label: "Protocoles",
    description: "Règles opérationnelles",
  },
];

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>("overview");

  const renderSection = () => {
    switch (activeSection) {
      case "overview":         return <SectionOverview />;
      case "phases":           return <SectionPhases />;
      case "flows":            return <SectionFlows />;
      case "agents":           return <SectionAgents />;
      case "memory":           return <SectionMemory />;
      case "harness-gardener": return <SectionHarnessGardener />;
      case "protocols":        return <SectionProtocols />;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Top bar */}
      <header className="h-12 border-b border-zinc-200 flex items-center px-5 gap-4 shrink-0 bg-white z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 bg-amber-400 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">O</span>
          </div>
          <span className="font-mono font-semibold text-sm text-zinc-900">
            Orion
          </span>
          <span className="text-zinc-300 text-xs mx-1">/</span>
          <span className="text-zinc-500 text-xs">Documentation</span>
        </div>
        <div className="ml-auto">
          <span className="text-xs font-mono text-zinc-400">
            opencode-team-lead
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 48px)" }}>
        {/* Sidebar */}
        <nav className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-zinc-200">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-2 py-1">
              Référence
            </div>
          </div>
          <ul className="py-2 flex-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    activeSection === item.id
                      ? "bg-white border-r-2 border-amber-400 text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <div className="text-sm font-medium leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {item.description}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-4 border-t border-zinc-200">
            <div className="text-[10px] text-zinc-400 font-mono leading-relaxed">
              <div>plugin: opencode-team-lead</div>
              <div className="text-amber-500 mt-1">✦ Orion v2</div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
