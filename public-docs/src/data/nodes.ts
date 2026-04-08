import type { Node } from '@xyflow/react'
import { phaseCards } from './cards'

export const initialNodes: Node[] = [
  {
    id: 'START',
    type: 'terminal',
    position: { x: 161, y: 0 },
    data: { label: 'User request', variant: 'start' },
  },
  ...phaseCards.map((card, i) => ({
    id: card.id,
    type: 'phaseCard',
    position: { x: 0, y: 120 + i * 420 },
    data: {
      phase: card.phase,
      label: card.label,
      sublabel: card.sublabel,
      color: card.color,
      lightColor: card.lightColor,
      steps: card.steps,
    },
  })),
  {
    id: 'END',
    type: 'terminal',
    position: { x: 161, y: 120 + phaseCards.length * 420 },
    data: { label: 'Mission complete', variant: 'end' },
  },
]
