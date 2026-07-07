import {
  BookOpen,
  ChevronRight,
  Ear,
  Globe,
  History,
  Home,
  Lightbulb,
  MessagesSquare,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useState, type ComponentType } from 'react'

import { chatHistoryEntries } from '@/lib/chatHistory'
import { getOrgVisualByName } from '@/lib/orgTheme'
import { cn } from '@/lib/utils'
import type { FlowKey } from '@/types/saarthi'

interface CapabilityItem {
  key: FlowKey
  label: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
  subActions?: Array<{ key: FlowKey; label: string }>
  /** Which partner org's agent this capability maps to, if any — makes "any org can plug in" concrete */
  orgName?: string
}

const capabilityItems: CapabilityItem[] = [
  {
    key: 'capture',
    label: 'Listening at Scale',
    subtitle: 'Synthesize field insights into actionable knowledge',
    icon: Ear,
    orgName: 'Shikshalokam',
    subActions: [
      { key: 'capture', label: 'Capture Discussions' },
      { key: 'story', label: 'Record Stories' },
      { key: 'feedback', label: 'Capture Feedback' },
    ],
  },
  {
    key: 'recommendations',
    label: 'Contextual Recommendations',
    subtitle: 'Delivering relevant, localized guidance',
    icon: WandSparkles,
    subActions: [{ key: 'recommendations', label: 'Recommendation Engine' }],
  },
  {
    key: 'insights',
    label: 'Insights Engine',
    subtitle: 'Evidence analysis and data insights',
    icon: Lightbulb,
    orgName: 'Shikshalokam',
  },
  {
    key: 'companion',
    label: 'Saathi - MI Companion',
    subtitle: 'Real-time assistance to first-mile actors',
    icon: Sparkles,
    orgName: 'Shikshalokam',
  },
  {
    key: 'program',
    label: 'Design Companion',
    subtitle: 'Support for program designers',
    icon: BookOpen,
    orgName: 'Shikshalokam',
  },
  {
    key: 'commons',
    label: 'SG Commons Portal',
    subtitle: 'AI search for ecosystem assets',
    icon: Globe,
  },
]

const quickActions: Array<{ key: FlowKey; label: string; icon: ComponentType<{ className?: string }> }> = [
  { key: 'capture', label: 'Classroom Challenge', icon: MessagesSquare },
  { key: 'insights', label: 'Get Insights', icon: Lightbulb },
  { key: 'recommendations', label: 'Find Resources', icon: Globe },
  { key: 'companion', label: 'Connect Peers', icon: Sparkles },
]

interface SidebarNavProps {
  activeFlow: FlowKey
  onFlowChange: (flow: FlowKey) => void
  activeHistoryId: string | null
  onSelectHistory: (id: string) => void
}

export function SidebarNav({ activeFlow, onFlowChange, activeHistoryId, onSelectHistory }: SidebarNavProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const isAdvancedOpen = activeFlow !== 'home' || advancedOpen

  return (
    <div className="space-y-4 text-foreground motion-safe:animate-fade-in">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary</p>
        <button
          className={cn(
            'w-full rounded-2xl border px-3 py-3 text-left transition-[transform,background-color,border-color,color,box-shadow] motion-transition-md active:scale-[0.98]',
            activeFlow === 'home'
              ? 'border-primary/35 bg-primary/10 text-foreground'
              : 'border-border bg-card/90 text-foreground hover:border-primary/25 hover:bg-muted',
          )}
          onClick={() => onFlowChange('home')}
          type="button"
        >
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Home
              className={cn(
                'h-4 w-4 transition-transform motion-transition-md',
                activeFlow === 'home' ? 'scale-105 text-primary' : 'text-primary/85',
              )}
            />
            Home
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Main chat workspace with automatic context routing</p>
        </button>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chat History</p>
        <div className="space-y-2.5">
          {chatHistoryEntries.map((entry) => (
            <button
              className={cn(
                'w-full rounded-2xl border px-3 py-3 text-left transition-[transform,background-color,border-color,color,box-shadow] motion-transition-md active:scale-[0.98]',
                entry.id === activeHistoryId
                  ? 'border-primary/35 bg-primary/10 text-foreground'
                  : 'border-border bg-card/90 text-foreground hover:border-primary/25 hover:bg-muted',
              )}
              key={entry.id}
              onClick={() => onSelectHistory(entry.id)}
              type="button"
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                <History
                  className={cn(
                    'h-4 w-4 transition-transform motion-transition-md',
                    entry.id === activeHistoryId ? 'scale-105 text-primary' : 'text-primary/85',
                  )}
                />
                {entry.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{entry.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card/80 px-3 py-2.5 text-left transition-[transform,background-color,border-color] motion-transition-md active:scale-[0.99]"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          type="button"
        >
          <span>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Advanced</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">Manual capability controls</p>
          </span>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform motion-transition-md',
              isAdvancedOpen ? 'rotate-90' : 'rotate-0',
            )}
          />
        </button>

        <div
          aria-hidden={!isAdvancedOpen}
          className={cn(
            'grid transition-[grid-template-rows,opacity,transform] motion-transition-slow',
            isAdvancedOpen
              ? 'mt-3 grid-rows-[1fr] opacity-100'
              : 'mt-0 grid-rows-[0fr] opacity-0 pointer-events-none',
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-5 pb-0.5">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capabilities</p>
                <div className="space-y-2.5">
                  {capabilityItems.map((item) => {
                    const Icon = item.icon
                    const active = item.key === activeFlow || item.subActions?.some((subAction) => subAction.key === activeFlow)
                    return (
                      <button
                        className={cn(
                          'w-full rounded-2xl border px-3 py-3 text-left transition-[transform,background-color,border-color,color,box-shadow] motion-transition-md active:scale-[0.98]',
                          active
                            ? 'border-primary/35 bg-primary/10 text-foreground'
                            : 'border-border bg-card/90 text-foreground hover:border-primary/25 hover:bg-muted',
                        )}
                        key={item.label}
                        onClick={() => onFlowChange(item.key)}
                        type="button"
                      >
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          <Icon
                            className={cn(
                              'h-4 w-4 transition-transform motion-transition-md',
                              active ? 'scale-105 text-primary' : 'text-primary/85',
                            )}
                          />
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                        {item.orgName ? (
                          <span
                            className="mt-1.5 inline-flex items-center rounded-[4px] border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider"
                            style={{
                              borderColor: getOrgVisualByName(item.orgName).hex,
                              color: getOrgVisualByName(item.orgName).hex,
                              backgroundColor: `${getOrgVisualByName(item.orgName).hex}14`,
                            }}
                          >
                            {item.orgName}
                          </span>
                        ) : null}

                        {item.subActions ? (
                          <div className="mt-3 space-y-1.5">
                            {item.subActions.map((subAction) => (
                              <button
                                className={cn(
                                  'block w-full rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-[transform,background-color,border-color,color] motion-transition-fast active:scale-[0.99]',
                                  subAction.key === activeFlow
                                    ? 'border-primary/30 bg-primary/15 text-foreground'
                                    : 'border-border bg-background text-muted-foreground hover:bg-muted',
                                )}
                                key={`${item.label}-${subAction.label}`}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onFlowChange(subAction.key)
                                }}
                                type="button"
                              >
                                {subAction.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <button
                        className={cn(
                          'rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition-[transform,background-color,border-color,color,box-shadow] motion-transition-fast active:scale-[0.98]',
                          action.key === activeFlow
                            ? 'border-primary/30 bg-primary/10 text-foreground'
                            : 'border-border bg-card/85 text-foreground/85 hover:bg-muted',
                        )}
                        key={action.label}
                        onClick={() => onFlowChange(action.key)}
                        type="button"
                      >
                        <span className="flex items-center gap-1.5">
                          <Icon
                            className={cn(
                              'h-3.5 w-3.5 transition-transform motion-transition-fast',
                              action.key === activeFlow ? 'scale-105 text-primary' : 'text-primary/85',
                            )}
                          />
                          {action.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}
