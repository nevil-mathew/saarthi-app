import { ChevronRight, Route } from 'lucide-react'
import { useState } from 'react'

import { getOrgVisual } from '@/lib/orgTheme'
import { cn } from '@/lib/utils'
import type { ChatHistoryEntry } from '@/types/homeFlow'

interface JourneyTimelineProps {
  entry: ChatHistoryEntry
  activeContextId: string | null
}

/**
 * The signature "transit line" element: renders the ordered chain of
 * org-stamped stops for the active demo journey, filling in as Saarthi
 * routes across time. Used once, prominently, in the AppShell header —
 * not repeated per-message (message-level attribution is AgentStamp).
 */
export function JourneyTimeline({ entry, activeContextId }: JourneyTimelineProps) {
  const [isOpen, setIsOpen] = useState(true)

  const contexts = entry.config.contexts
  const effectiveContextId = activeContextId ?? contexts[0]?.id ?? null
  const activeIndex = Math.max(
    contexts.findIndex((context) => context.id === effectiveContextId),
    0,
  )

  return (
    <div className="w-full rounded-2xl border border-border bg-card/90 px-4 py-2.5">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setIsOpen((previous) => !previous)}
        type="button"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Route className="h-3.5 w-3.5 text-primary" />
          {entry.title}
        </span>
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
          Stop {activeIndex + 1} of {contexts.length}
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 transition-transform motion-transition-md',
              isOpen ? 'rotate-90' : 'rotate-0',
            )}
          />
        </span>
      </button>

      <div
        aria-hidden={!isOpen}
        className={cn(
          'grid transition-[grid-template-rows,opacity] motion-transition-slow',
          isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="relative flex items-start justify-between gap-2 pb-0.5 pt-1">
            <div className="absolute left-0 right-0 top-[8px] h-px bg-border" />
            {contexts.map((context, index) => {
              const visual = getOrgVisual(context.label)
              const state = index < activeIndex ? 'completed' : index === activeIndex ? 'current' : 'upcoming'

              return (
                <div className="relative flex flex-1 flex-col items-center gap-1" key={context.id}>
                  <span
                    className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 bg-card"
                    style={
                      state === 'upcoming' || !visual
                        ? undefined
                        : { borderColor: visual.hex, backgroundColor: visual.hex }
                    }
                  >
                    {state === 'current' && visual ? (
                      <span
                        aria-hidden
                        className="absolute h-6 w-6 rounded-full motion-safe:animate-soft-highlight"
                        style={{ backgroundColor: `${visual.hex}33` }}
                      />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap text-center text-[11px] font-semibold',
                      state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
                    )}
                  >
                    {context.label}
                  </span>
                  {context.subLabel ? (
                    <span className="whitespace-nowrap text-center font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                      {context.subLabel}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
