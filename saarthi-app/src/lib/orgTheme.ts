/**
 * Single source of truth for "which org runs this agent."
 *
 * To reassign an agent to a different org (e.g. after lead confirmation),
 * change one line in AGENT_ORG_MAP. To onboard a brand-new partner org,
 * add one line here and one line to ORG_VISUALS — no other file needs to
 * change; chatHistories.json only ever needs `agentName`.
 */
const AGENT_ORG_MAP: Record<string, string> = {
  Mitra: 'Shikshalokam',
  Saathi: 'Shikshalokam',
  'Teacher Companion': 'Shikshalokam',
  'AI Insights Engine': 'Shikshalokam',
  'Program Design Companion': 'Shikshalokam',
  'Video Analyzer Agent': 'TAP',
}

interface OrgVisual {
  org: string
  shortCode: string
  hex: string
}

const ORG_VISUALS: Record<string, Omit<OrgVisual, 'org'>> = {
  Shikshalokam: { shortCode: 'SL', hex: '#0E5C52' },
  TAP: { shortCode: 'TAP', hex: '#B45309' },
}

const ORCHESTRATOR_VISUAL: OrgVisual = {
  org: 'Saarthi',
  shortCode: 'ORCH',
  hex: '#12181A',
}

const UNKNOWN_ORG_VISUAL: Omit<OrgVisual, 'org'> = {
  shortCode: 'ORG',
  hex: '#5B6764',
}

export function getOrgVisual(agentName?: string, agentOrgOverride?: string): OrgVisual | null {
  if (!agentName) {
    return null
  }

  if (agentName === 'Saarthi') {
    return ORCHESTRATOR_VISUAL
  }

  const org = agentOrgOverride ?? AGENT_ORG_MAP[agentName]
  if (!org) {
    return null
  }

  return getOrgVisualByName(org)
}

/** Resolve a visual directly from an org name — for places (e.g. the sidebar) with no specific agent. */
export function getOrgVisualByName(org: string): OrgVisual {
  const visual = ORG_VISUALS[org] ?? UNKNOWN_ORG_VISUAL
  return { org, ...visual }
}
