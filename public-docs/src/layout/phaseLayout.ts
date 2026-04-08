import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'
import { Position } from '@xyflow/react'

export function layoutPhaseNodes(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80, marginx: 40, marginy: 40 })

  nodes.forEach(n => {
    const isDecision = n.type === 'phaseDecision'
    g.setNode(n.id, { width: isDecision ? 140 : 220, height: isDecision ? 120 : 56 })
  })
  edges.forEach(e => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return nodes.map(n => {
    const pos = g.node(n.id)
    const isDecision = n.type === 'phaseDecision'
    const w = isDecision ? 140 : 220
    const h = isDecision ? 120 : 56
    return {
      ...n,
      position: { x: pos.x - w / 2, y: pos.y - h / 2 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    }
  })
}
