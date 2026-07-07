import { AgentStamp } from '@/components/chat/AgentStamp'
import type { ChatHandoff } from '@/types/chat'

interface TransitionCardProps {
  handoff: ChatHandoff
  timestamp: string
}

/**
 * The one moment in this app worth a deliberate, choreographed animation:
 * a live agent-to-agent handoff. Reuses AgentStamp for both ends so a
 * handoff, a message stamp, and a journey timeline stop all look like the
 * same visual language.
 */
export function TransitionCard({ handoff, timestamp }: TransitionCardProps) {
  const { fromLabel, fromOrg, toLabel, toOrg, summary } = handoff
  const isFreshAssignment = !fromLabel

  return (
    <div className="flex justify-center motion-safe:animate-fade-up-sm motion-safe:[animation-fill-mode:both]">
      <div className="w-full max-w-[560px] rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <p className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Saarthi is carrying context forward
        </p>

        <div className="flex items-center justify-center gap-2.5">
          {fromLabel ? <AgentStamp agentName={fromLabel} agentOrg={fromOrg} muted /> : null}
          {fromLabel ? (
            <span
              aria-hidden
              className="h-px w-8 origin-left bg-border motion-safe:animate-rail-draw"
            />
          ) : null}
          <span className="motion-safe:animate-stamp-in motion-safe:[animation-fill-mode:both]">
            <AgentStamp agentName={toLabel} agentOrg={toOrg} />
          </span>
        </div>

        <p className="mt-2.5 text-center text-xs leading-relaxed text-muted-foreground">
          {isFreshAssignment ? (
            <>Assigning to <span className="font-semibold text-foreground">{toLabel}</span></>
          ) : (
            <>
              {summary ? <span className="text-foreground">{summary}</span> : 'Context carried forward'}
              {' → activating '}
              <span className="font-semibold text-foreground">{toLabel}</span>
              {toOrg ? ` (${toOrg})` : null}
            </>
          )}
        </p>

        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
