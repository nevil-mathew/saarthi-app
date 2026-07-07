import { getOrgVisual } from '@/lib/orgTheme'
import { cn } from '@/lib/utils'

interface AgentStampProps {
  agentName?: string
  agentOrg?: string
  size?: 'sm' | 'md'
  muted?: boolean
  className?: string
}

/**
 * Renders an agent name + a mono, uppercase, bordered org short-code —
 * meant to read like a routing label (manifest stamp / waybill / boarding
 * pass), not a generic badge. Shared by MessageBubble, TransitionCard, and
 * JourneyTimeline so every "who served this" moment looks identical.
 */
export function AgentStamp({ agentName, agentOrg, size = 'sm', muted = false, className }: AgentStampProps) {
  if (!agentName) {
    return null
  }

  const visual = getOrgVisual(agentName, agentOrg)

  return (
    <span className={cn('inline-flex items-center gap-1.5', muted && 'opacity-55', className)}>
      <span className={cn('font-semibold text-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {agentName}
      </span>
      {visual ? (
        <span
          className="inline-flex items-center rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
          style={{
            borderColor: visual.hex,
            color: visual.hex,
            backgroundColor: `${visual.hex}14`,
          }}
        >
          {visual.shortCode}
        </span>
      ) : null}
    </span>
  )
}

export function getAgentRailColor(agentName?: string, agentOrg?: string): string | undefined {
  return getOrgVisual(agentName, agentOrg)?.hex
}
