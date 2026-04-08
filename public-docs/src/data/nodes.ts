import type { Node } from '@xyflow/react'
import { phaseCards } from './cards'

// Layout zigzag sur 2 colonnes.
// Colonne gauche : x=0, Colonne droite : x=720
// Card width : 600px, gap horizontal : 120px, gap vertical entre rangées : 100px
// Hauteur card estimée : ~450px → rangée suivante à y+550

const COL_LEFT  = 0
const COL_RIGHT = 720
const ROW_GAP   = 100
const CARD_HEIGHT = 450

const ROW_Y = [
  120,                              // rangée 0 : PHASE_0 (left) & PHASE_1 (right)
  120 + CARD_HEIGHT + ROW_GAP,      // rangée 1 : PHASE_2 (left) & PHASE_3 (right)  → 670
  120 + (CARD_HEIGHT + ROW_GAP) * 2, // rangée 2 : PHASE_4 (left) & PHASE_5 (right) → 1220
]

// Positions par phase (index 0-5)
const PHASE_POSITIONS: { x: number; y: number }[] = [
  { x: COL_LEFT,  y: ROW_Y[0] }, // PHASE_0
  { x: COL_RIGHT, y: ROW_Y[0] }, // PHASE_1
  { x: COL_LEFT,  y: ROW_Y[1] }, // PHASE_2
  { x: COL_RIGHT, y: ROW_Y[1] }, // PHASE_3
  { x: COL_LEFT,  y: ROW_Y[2] }, // PHASE_4
  { x: COL_RIGHT, y: ROW_Y[2] }, // PHASE_5
]

// START centré visuellement entre les 2 colonnes (entre x=0+300 et x=720+300 → milieu=660), pill width ~200 → x=560
const START_X = 560
// END centré sous PHASE_4 (x=0, card width=600 → centre=300), pill width~200 → x=200
const END_X = 200
const END_Y = ROW_Y[2] + CARD_HEIGHT + ROW_GAP + 100 // 1220+450+100+100=1870

export const initialNodes: Node[] = [
  {
    id: 'START',
    type: 'terminal',
    position: { x: START_X, y: 0 },
    data: { label: 'User request', variant: 'start' },
  },
  ...phaseCards.map((card, i) => ({
    id: card.id,
    type: 'phaseCard',
    position: PHASE_POSITIONS[i],
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
    position: { x: END_X, y: END_Y },
    data: { label: 'Mission complete', variant: 'end' },
  },
]
