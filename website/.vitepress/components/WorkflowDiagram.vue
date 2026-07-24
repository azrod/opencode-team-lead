<template>
  <div class="mermaid-wrapper">
    <div ref="containerRef" class="mermaid-container" v-html="svgContent" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const containerRef = ref<HTMLElement | null>(null)
const svgContent = ref('')

const diagramDef = `flowchart TD
  U["<b>01 — Understand</b><br/>Check state · ask questions · read context"]
  P["<b>02 — Plan</b><br/>Break tasks · identify agents · dependencies"]
  D["<b>03 — Delegate</b><br/>Write prompts · launch agents · parallelize"]
  AD{"agents done?"}
  R["<b>04 — Review</b><br/>Send to review-manager · handle verdict"]
  VD{"verdict?"}
  S["<b>05 — Synthesize</b><br/>Collect outputs · self-evaluate · report"]
  DONE(["✓ report to user"])
  ESC(["✗ escalate to user"])

  U --> P --> D --> AD
  AD -->|yes| R
  AD -->|no — wait| D
  R --> VD
  VD -->|APPROVED| S
  VD -->|CHANGES_REQUESTED| D
  VD -->|BLOCKED| ESC
  S --> DONE`

async function renderDiagram() {
  const { default: mermaid } = await import('mermaid')

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark.value ? 'dark' : 'default',
    themeVariables: isDark.value ? {
      primaryColor: '#1e1e2e',
      primaryTextColor: '#cdd6f4',
      primaryBorderColor: '#89b4fa',
      lineColor: '#89b4fa',
      secondaryColor: '#313244',
      tertiaryColor: '#181825',
    } : {
      primaryColor: '#eff6ff',
      primaryTextColor: '#1e3a5f',
      primaryBorderColor: '#3b82f6',
      lineColor: '#3b82f6',
      secondaryColor: '#fef3c7',
      tertiaryColor: '#f0fdf4',
    },
    flowchart: {
      curve: 'basis',
      padding: 20,
    },
  })

  const id = 'workflow-diagram-' + Date.now()
  const { svg } = await mermaid.render(id, diagramDef)
  svgContent.value = svg
}

onMounted(() => {
  renderDiagram()
})

watch(isDark, () => {
  renderDiagram()
})
</script>

<style scoped>
.mermaid-wrapper {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  margin: 1.5rem 0;
  padding: 1rem;
}

.mermaid-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.mermaid-container :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
