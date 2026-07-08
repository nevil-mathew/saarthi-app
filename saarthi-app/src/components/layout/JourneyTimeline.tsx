import { ChevronRight, Route } from 'lucide-react'
import { Fragment, useState } from 'react'

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
 *
 * Stops are sized to their own label (not squeezed into equal-width
 * columns), so text stays legible regardless of journey length.
 */
export function JourneyTimeline({ entry, activeContextId }: JourneyTimelineProps) {
  const [isOpen, setIsOpen] = useState(false)

  const contexts = entry.config.contexts
  const effectiveContextId = activeContextId ?? contexts[0]?.id ?? null
  const activeIndex = Math.max(
    contexts.findIndex((context) => context.id === effectiveContextId),
    0,
  )

  return (
    <div className="w-full rounded-xl border border-border bg-card/90 px-3 py-2">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setIsOpen((previous) => !previous)}
        type="button"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Route className="h-3.5 w-3.5 text-primary" />
          {entry.title}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
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
          isOpen ? 'mt-2.5 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 pb-0.5">
            {contexts.map((context, index) => {
              const visual = getOrgVisual(context.label)
              const state = index < activeIndex ? 'completed' : index === activeIndex ? 'current' : 'upcoming'
              const isUpcoming = state === 'upcoming' || !visual

              return (
                <Fragment key={context.id}>
                  {index > 0 ? (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-border" />
                  ) : null}
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-2.5 py-1.5',
                      isUpcoming ? 'border-border bg-background/50' : 'border-transparent',
                    )}
                    style={
                      !isUpcoming
                        ? { backgroundColor: `${visual.hex}12`, borderColor: `${visual.hex}45` }
                        : undefined
                    }
                  >
                    <span
                      className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full border-2 bg-card"
                      style={
                        isUpcoming
                          ? undefined
                          : { borderColor: visual.hex, backgroundColor: visual.hex }
                      }
                    >
                      {state === 'current' && visual ? (
                        <span
                          aria-hidden
                          className="absolute h-4 w-4 rounded-full motion-safe:animate-soft-highlight"
                          style={{ backgroundColor: `${visual.hex}33` }}
                        />
                      ) : null}
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span
                        className={cn(
                          'whitespace-nowrap text-[13px] font-semibold',
                          isUpcoming ? 'text-muted-foreground' : 'text-foreground',
                        )}
                      >
                        {context.label}
                      </span>
                      {context.subLabel ? (
                        <span className="whitespace-nowrap text-[10.5px] text-muted-foreground">
                          {context.subLabel}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
