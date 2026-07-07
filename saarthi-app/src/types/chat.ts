import type { FlowKey } from '@/types/saarthi'

export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatBlock =
  | {
      type: 'list'
      title: string
      items: string[]
    }
  | {
      type: 'kv'
      title: string
      rows: Array<{ label: string; value: string }>
      action?: { label: string; prompt?: string; url?: string }
    }
  | {
      type: 'tags'
      title?: string
      tags: string[]
    }
  | {
      type: 'text'
      title?: string
      body: string
    }
  | {
      type: 'actions'
      title?: string
      actions: Array<{ label: string; prompt?: string; url?: string }>
    }

export interface ChatHandoff {
  fromLabel?: string
  fromOrg?: string
  toLabel: string
  toOrg?: string
  summary?: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  flow: FlowKey
  timestamp: string
  blocks?: ChatBlock[]
  agentName?: string
  /** Explicit org override — normally the org is resolved from agentName via lib/orgTheme.ts */
  agentOrg?: string
  /** Marks an unprompted, proactive Saarthi turn (renders as a "Saarthi noticed" callout) */
  isNudge?: boolean
  /** Present on a system-role message that represents a live agent-to-agent handoff */
  handoff?: ChatHandoff
}

export interface ChatSuggestion {
  id: string
  flow: FlowKey
  label: string
  prompt: string
}
