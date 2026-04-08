import type { Node } from '@xyflow/react'
import { phaseCards } from './cards'

// Cards font 600px de large. START/END sont des pills (largeur ~200px).
// Cards sont décalées à x:60 pour laisser ~160px à droite pour l'edge CHANGES_REQUESTED.
// START/END sont centrés sur la colonne cards : 60 + 600/2 - 100 = 260

const CARD_WIDTH = 600
const CARD_X = 60
const PILL_OFFSET = CARD_X + (CARD_WIDTH - 200) / 2 // 240

// Y positions : gap de 400px entre chaque card (hauteur card ~350px + 50px de respiration)
const Y_POSITIONS = [80, 500, 920, 1340, 1760, 2180]

export const initialNodes: Node[] = [
  {
    id: 'START',
    type: 'terminal',
    position: { x: PILL_OFFSET, y: 0 },
    data: { label: 'User request', variant: 'start' },
  },
  ...phaseCards.map((card, i) => ({
    id: card.id,
    type: 'phaseCard',
    position: { x: CARD_X, y: Y_POSITIONS[i] },
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
    position: { x: PILL_OFFSET, y: Y_POSITIONS[phaseCards.length - 1] + 420 },
    data: { label: 'Mission complete', variant: 'end' },
  },
]
