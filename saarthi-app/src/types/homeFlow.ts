import type { ChatBlock } from '@/types/chat'
import type { FlowKey } from '@/types/saarthi'

export type RoutedFlowKey = Exclude<FlowKey, 'home'>

export interface RouteContext {
  id: string
  label: string
  subLabel?: string
  flow: RoutedFlowKey
}

export interface RoutingRule {
  id: string
  phrases: string[]
  targetContextId: string
  notice: string
}

interface BaseDemoStep {
  id: string
  postDelayMs?: number
}

export interface DemoUserStep extends BaseDemoStep {
  type: 'user'
  text: string
  typingMsPerChar?: number
  skipEngineResponse?: boolean
  targetContextId?: string
  contextNotice?: string
  /** Short "what's carried forward" phrase shown on the handoff Transition Card */
  handoffSummary?: string
}

export interface DemoAssistantStep extends BaseDemoStep {
  type: 'assistant'
  text: string
  blocks?: ChatBlock[]
  agentName?: string
  /** Explicit org override — normally resolved from agentName via lib/orgTheme.ts */
  agentOrg?: string
  /** Marks an unprompted, proactive Saarthi turn (renders as a "Saarthi noticed" callout) */
  isNudge?: boolean
}

export type DemoStep = DemoUserStep | DemoAssistantStep

export interface DemoScript {
  id: string
  title: string
  steps: DemoStep[]
}

export interface HomeFlowConfig {
  version: number
  defaultContextId: string
  defaultScriptId: string
  contexts: RouteContext[]
  routingRules: RoutingRule[]
  demoScripts: DemoScript[]
}

export interface ResolvedRouteMatch {
  rule: RoutingRule
  context: RouteContext
}

export interface ChatHistoryEntry {
  id: string
  title: string
  description: string
  config: HomeFlowConfig
}
