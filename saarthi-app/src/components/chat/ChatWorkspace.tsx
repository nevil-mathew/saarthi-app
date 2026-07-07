import { Bot, SendHorizontal, UserCircle2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'

import { AgentStamp, getAgentRailColor } from '@/components/chat/AgentStamp'
import { TransitionCard } from '@/components/chat/TransitionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { challengeData } from '@/data/mockData'
import { useSaarthiState } from '@/hooks/useSaarthiState'
import {
  getComposerPlaceholder,
  getFlowLabel,
  resolveChatResponse,
} from '@/lib/chatEngine'
import {
  commonsFlowConfig,
  commonsSimulationEnabled,
} from '@/lib/commonsFlow'
import { getChatHistoryById } from '@/lib/chatHistory'
import { getOrgVisual } from '@/lib/orgTheme'
import {
  feedbackFlowConfig,
  feedbackSimulationEnabled,
} from '@/lib/feedbackFlow'
import {
  getDemoScriptById,
  homeFlowConfig,
  homeSimulationEnabled,
  resolveRouteMatch,
} from '@/lib/homeFlow'
import {
  programFlowConfig,
  programSimulationEnabled,
} from '@/lib/programFlow'
import {
  saathiFlowConfig,
  saathiSimulationEnabled,
} from '@/lib/saathiFlow'
import {
  storyFlowConfig,
  storySimulationEnabled,
} from '@/lib/storyFlow'
import { cn } from '@/lib/utils'
import type { DemoUserStep, HomeFlowConfig, RouteContext } from '@/types/homeFlow'
import type { ChatBlock, ChatMessage } from '@/types/chat'
import type { FlowKey } from '@/types/saarthi'

interface ChatWorkspaceProps {
  activeFlow: FlowKey
  onFlowChange: (flow: FlowKey) => void
  activeHistoryId: string | null
  onHistoryContextChange?: (contextId: string | null) => void
}

const defaultTypingMsPerChar = 24
const defaultPostStepDelayMs = 700
const baseContextNoticeDelayMs = 260
const devTypingSpeedMultiplier = 0.2
const minTypingDelayMs = 1
const minComposerHeightPx = 52
const maxComposerHeightPx = 220

function parseTypingSpeedMultiplier() {
  const raw = import.meta.env.VITE_SIMULATION_TYPING_SPEED_MULTIPLIER
  const parsed = typeof raw === 'string' ? Number(raw) : Number.NaN

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }

  return import.meta.env.DEV ? devTypingSpeedMultiplier : 1
}

const typingSpeedMultiplier = parseTypingSpeedMultiplier()

export function ChatWorkspace({ activeFlow, onFlowChange, activeHistoryId, onHistoryContextChange }: ChatWorkspaceProps) {
  const idRef = useRef(0)
  const endRef = useRef<HTMLDivElement | null>(null)
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const prefersReducedMotionRef = useRef(false)
  const simulationStateRef = useRef<'idle' | 'running' | 'awaiting-user' | 'completed'>('idle')
  const awaitingScriptedUserStepRef = useRef<DemoUserStep | null>(null)
  const resumeSimulationRef = useRef<(() => void) | null>(null)
  const [draft, setDraft] = useState('')
  const [isDraftAutoTyping, setIsDraftAutoTyping] = useState(false)
  const [isAssistantThinking, setIsAssistantThinking] = useState(false)
  const [assistantThinkingLabel, setAssistantThinkingLabel] = useState('Reviewing your input...')
  const [homeContext, setHomeContext] = useState<RouteContext | null>(null)
  const [feedbackContext, setFeedbackContext] = useState<RouteContext | null>(null)
  const [storyContext, setStoryContext] = useState<RouteContext | null>(null)
  const [saathiContext, setSaathiContext] = useState<RouteContext | null>(null)
  const [commonsContext, setCommonsContext] = useState<RouteContext | null>(null)
  const [programContext, setProgramContext] = useState<RouteContext | null>(null)
  const [historyContext, setHistoryContext] = useState<RouteContext | null>(null)

  const {
    selectedChallenge,
    captureAnswers,
    insights,
    selectedRecommendations,
    improvementPlanDraft,
    storyDraft,
    programDesignDraft,
    setCaptureAnswer,
    generateCapturedSummary,
    toggleRecommendationSelection,
    setImprovementPlanField,
    setStoryField,
    askCompanion,
    setProgramDraftField,
  } = useSaarthiState()

  const dataset = challengeData[selectedChallenge]

  const [messages, setMessages] = useState<ChatMessage[]>(() => createInitialMessages())

  const homeContextRef = useRef(homeContext)
  const feedbackContextRef = useRef(feedbackContext)
  const storyContextRef = useRef(storyContext)
  const saathiContextRef = useRef(saathiContext)
  const commonsContextRef = useRef(commonsContext)
  const programContextRef = useRef(programContext)
  const historyContextRef = useRef(historyContext)
  const activeFlowRef = useRef(activeFlow)
  const activeHistoryIdRef = useRef(activeHistoryId)
  const lastAssistantAgentRef = useRef<{ agentName?: string; agentOrg?: string }>({})

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant')
    lastAssistantAgentRef.current = {
      agentName: lastAssistant?.agentName,
      agentOrg: lastAssistant?.agentOrg,
    }
  }, [messages])

  useEffect(() => {
    onHistoryContextChange?.(historyContext?.id ?? null)
  }, [historyContext, onHistoryContextChange])

  useEffect(() => {
    homeContextRef.current = homeContext
  }, [homeContext])

  useEffect(() => {
    feedbackContextRef.current = feedbackContext
  }, [feedbackContext])

  useEffect(() => {
    storyContextRef.current = storyContext
  }, [storyContext])

  useEffect(() => {
    saathiContextRef.current = saathiContext
  }, [saathiContext])

  useEffect(() => {
    commonsContextRef.current = commonsContext
  }, [commonsContext])

  useEffect(() => {
    programContextRef.current = programContext
  }, [programContext])

  useEffect(() => {
    historyContextRef.current = historyContext
  }, [historyContext])

  useEffect(() => {
    activeFlowRef.current = activeFlow
  }, [activeFlow])

  useEffect(() => {
    activeHistoryIdRef.current = activeHistoryId
  }, [activeHistoryId])

  const isHistoryMode = Boolean(activeHistoryId)
  const isHomeRoutedMode = !isHistoryMode && activeFlow === 'home'
  const isFeedbackRoutedMode = !isHistoryMode && activeFlow === 'feedback'
  const isStoryRoutedMode = !isHistoryMode && activeFlow === 'story'
  const isSaathiRoutedMode = !isHistoryMode && activeFlow === 'companion'
  const isCommonsRoutedMode = !isHistoryMode && activeFlow === 'commons'
  const isProgramRoutedMode = !isHistoryMode && activeFlow === 'program'

  const effectiveFlow = isHistoryMode
    ? historyContext?.flow ?? 'history'
    : isHomeRoutedMode
    ? homeContext?.flow ?? 'home'
    : isFeedbackRoutedMode
    ? feedbackContext?.flow ?? 'capture'
    : isStoryRoutedMode
    ? storyContext?.flow ?? 'story'
    : isSaathiRoutedMode
    ? saathiContext?.flow ?? 'companion'
    : isCommonsRoutedMode
    ? commonsContext?.flow ?? 'recommendations'
    : isProgramRoutedMode
    ? programContext?.flow ?? 'program'
    : activeFlow

  const contextLabel = isHistoryMode
    ? historyContext?.label
    : isHomeRoutedMode
    ? homeContext?.label
    : isFeedbackRoutedMode
    ? feedbackContext?.label
    : isStoryRoutedMode
    ? storyContext?.label
    : isSaathiRoutedMode
    ? saathiContext?.label
    : isCommonsRoutedMode
    ? commonsContext?.label
    : isProgramRoutedMode
    ? programContext?.label
    : getFlowLabel(activeFlow)
  const subContextLabel = isHistoryMode
    ? historyContext?.subLabel
    : isHomeRoutedMode
    ? homeContext?.subLabel
    : isFeedbackRoutedMode
    ? feedbackContext?.subLabel
    : isStoryRoutedMode
    ? storyContext?.subLabel
    : isSaathiRoutedMode
    ? saathiContext?.subLabel
    : isCommonsRoutedMode
    ? commonsContext?.subLabel
    : isProgramRoutedMode
    ? programContext?.subLabel
    : undefined
  const isRoutedContextUnset =
    (isHistoryMode && !historyContext)
    || (isHomeRoutedMode && !homeContext)
    || (isFeedbackRoutedMode && !feedbackContext)
    || (isStoryRoutedMode && !storyContext)
    || (isSaathiRoutedMode && !saathiContext)
    || (isCommonsRoutedMode && !commonsContext)
    || (isProgramRoutedMode && !programContext)
  const showUnsetContextState = !isHistoryMode && activeFlow === 'home' && isRoutedContextUnset
  const displayContextLabel = contextLabel ?? (isHistoryMode || activeFlow !== 'home' ? getFlowLabel(effectiveFlow) : undefined)

  const homeDemoScript = useMemo(
    () => getDemoScriptById(homeFlowConfig.defaultScriptId, homeFlowConfig),
    [],
  )
  const feedbackDemoScript = useMemo(
    () => getDemoScriptById(feedbackFlowConfig.defaultScriptId, feedbackFlowConfig),
    [],
  )
  const storyDemoScript = useMemo(
    () => getDemoScriptById(storyFlowConfig.defaultScriptId, storyFlowConfig),
    [],
  )
  const saathiDemoScript = useMemo(
    () => getDemoScriptById(saathiFlowConfig.defaultScriptId, saathiFlowConfig),
    [],
  )
  const commonsDemoScript = useMemo(
    () => getDemoScriptById(commonsFlowConfig.defaultScriptId, commonsFlowConfig),
    [],
  )
  const programDemoScript = useMemo(
    () => getDemoScriptById(programFlowConfig.defaultScriptId, programFlowConfig),
    [],
  )
  const activeHistoryEntry = useMemo(
    () => (activeHistoryId ? getChatHistoryById(activeHistoryId) : null),
    [activeHistoryId],
  )
  const historyDemoScript = useMemo(
    () =>
      activeHistoryEntry
        ? getDemoScriptById(activeHistoryEntry.config.defaultScriptId, activeHistoryEntry.config)
        : null,
    [activeHistoryEntry],
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const syncPreference = () => {
      prefersReducedMotionRef.current = mediaQuery.matches
    }

    syncPreference()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncPreference)
      return () => mediaQuery.removeEventListener('change', syncPreference)
    }

    mediaQuery.addListener(syncPreference)
    return () => mediaQuery.removeListener(syncPreference)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: prefersReducedMotionRef.current ? 'auto' : 'smooth',
      block: 'end',
    })
  }, [isAssistantThinking, messages])

  const syncComposerHeight = useCallback(() => {
    const textarea = composerTextareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    const nextHeight = Math.min(
      maxComposerHeightPx,
      Math.max(minComposerHeightPx, textarea.scrollHeight),
    )
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY =
      textarea.scrollHeight > maxComposerHeightPx ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    syncComposerHeight()
  }, [draft, syncComposerHeight])

  const nextId = useCallback(() => {
    idRef.current += 1
    return `msg-${idRef.current}`
  }, [])

  const getRuntimeFlow = useCallback(
    (mode: FlowKey = activeFlowRef.current): FlowKey => {
      if (activeHistoryIdRef.current) {
        return historyContextRef.current?.flow ?? 'history'
      }
      if (mode === 'home') {
        return homeContextRef.current?.flow ?? 'home'
      }
      if (mode === 'feedback') {
        return feedbackContextRef.current?.flow ?? 'capture'
      }
      if (mode === 'story') {
        return storyContextRef.current?.flow ?? 'story'
      }
      if (mode === 'companion') {
        return saathiContextRef.current?.flow ?? 'companion'
      }
      if (mode === 'commons') {
        return commonsContextRef.current?.flow ?? 'recommendations'
      }
      if (mode === 'program') {
        return programContextRef.current?.flow ?? 'program'
      }
      return mode
    },
    [],
  )

  const setContextByMode = useCallback((mode: FlowKey, context: RouteContext | null) => {
    if (activeHistoryIdRef.current) {
      setHistoryContext(context)
      return
    }
    if (mode === 'home') {
      setHomeContext(context)
      return
    }
    if (mode === 'feedback') {
      setFeedbackContext(context)
      return
    }
    if (mode === 'story') {
      setStoryContext(context)
      return
    }
    if (mode === 'companion') {
      setSaathiContext(context)
      return
    }
    if (mode === 'commons') {
      setCommonsContext(context)
      return
    }
    if (mode === 'program') {
      setProgramContext(context)
    }
  }, [])

  const getContextByMode = useCallback((mode: FlowKey): RouteContext | null => {
    if (activeHistoryIdRef.current) {
      return historyContextRef.current
    }
    if (mode === 'home') {
      return homeContextRef.current
    }
    if (mode === 'feedback') {
      return feedbackContextRef.current
    }
    if (mode === 'story') {
      return storyContextRef.current
    }
    if (mode === 'companion') {
      return saathiContextRef.current
    }
    if (mode === 'commons') {
      return commonsContextRef.current
    }
    if (mode === 'program') {
      return programContextRef.current
    }
    return null
  }, [])

  useEffect(() => {
    if (activeHistoryId || activeFlow === 'home') {
      return
    }

    const routedFlowConfig = activeFlow === 'feedback'
      ? feedbackFlowConfig
      : activeFlow === 'story'
      ? storyFlowConfig
      : activeFlow === 'companion'
      ? saathiFlowConfig
      : activeFlow === 'commons'
      ? commonsFlowConfig
      : activeFlow === 'program'
      ? programFlowConfig
      : null

    if (!routedFlowConfig || getContextByMode(activeFlow)) {
      return
    }

    const defaultContext = getPreferredContextForMode(activeFlow, routedFlowConfig)
    if (!defaultContext) {
      return
    }

    setContextByMode(activeFlow, defaultContext)
  }, [activeFlow, activeHistoryId, getContextByMode, setContextByMode])

  const appendScriptedAssistantTurn = useCallback((
    text: string,
    blocks?: ChatBlock[],
    agentName?: string,
    options?: { agentOrg?: string; isNudge?: boolean },
  ) => {
    const routedFlow = getRuntimeFlow()

    const assistantMessage: ChatMessage = {
      id: nextId(),
      role: 'assistant',
      flow: routedFlow,
      timestamp: new Date().toISOString(),
      text,
      blocks,
      agentName,
      agentOrg: options?.agentOrg,
      isNudge: options?.isNudge,
    }

    setMessages((previous) => [...previous, assistantMessage])
  }, [getRuntimeFlow, nextId])

  const sendPrompt = useCallback(async (
    rawPrompt: string,
    options?: {
      skipEngineResponse?: boolean
      targetContextId?: string
      contextNotice?: string
      handoffSummary?: string
    },
  ) => {
    const input = rawPrompt.trim()
    if (!input) {
      return
    }

    let responseFlow: FlowKey = getRuntimeFlow(activeFlow)
    let contextNoticeMessage: ChatMessage | null = null

    const routedFlowConfig = activeHistoryId
      ? activeHistoryEntry?.config ?? null
      : activeFlow === 'home'
      ? homeFlowConfig
      : activeFlow === 'feedback'
      ? feedbackFlowConfig
      : activeFlow === 'story'
      ? storyFlowConfig
      : activeFlow === 'companion'
      ? saathiFlowConfig
      : activeFlow === 'commons'
      ? commonsFlowConfig
      : activeFlow === 'program'
      ? programFlowConfig
      : null

    if (routedFlowConfig) {
      const currentModeContext = getContextByMode(activeFlow)

      if (!activeHistoryId && activeFlow !== 'home' && !currentModeContext) {
        const defaultContext = getPreferredContextForMode(activeFlow, routedFlowConfig)
        if (defaultContext) {
          setContextByMode(activeFlow, defaultContext)
          responseFlow = defaultContext.flow
        }
      }

      if (options?.targetContextId) {
        const targetContext = routedFlowConfig.contexts.find(
          (context) => context.id === options.targetContextId,
        )

        if (targetContext) {
          responseFlow = targetContext.flow

          if (targetContext.id !== currentModeContext?.id) {
            setContextByMode(activeFlow, targetContext)

            if (options.contextNotice && options.contextNotice.trim().length > 0) {
              contextNoticeMessage = {
                id: nextId(),
                role: 'system',
                flow: targetContext.flow,
                timestamp: new Date().toISOString(),
                text: options.contextNotice,
              }

              if (activeHistoryId) {
                const lastAgent = lastAssistantAgentRef.current
                const fromVisual = getOrgVisual(lastAgent.agentName, lastAgent.agentOrg)
                const toVisual = getOrgVisual(targetContext.label)
                contextNoticeMessage.handoff = {
                  fromLabel: lastAgent.agentName,
                  fromOrg: fromVisual?.org,
                  toLabel: targetContext.label,
                  toOrg: toVisual?.org,
                  summary: options.handoffSummary,
                }
              }
            }
          }
        }
      } else {
        const routeMatch = resolveRouteMatch(input, routedFlowConfig)
        if (routeMatch) {
          responseFlow = routeMatch.context.flow

          if (routeMatch.context.id !== currentModeContext?.id) {
            setContextByMode(activeFlow, routeMatch.context)

            if (routeMatch.rule.notice.trim().length > 0) {
              contextNoticeMessage = {
                id: nextId(),
                role: 'system',
                flow: routeMatch.context.flow,
                timestamp: new Date().toISOString(),
                text: routeMatch.rule.notice,
              }
            }
          }
        }
      }
    } else {
      const routeMatch = resolveRouteMatch(input, homeFlowConfig)
      if (routeMatch) {
        responseFlow = routeMatch.context.flow

        if (routeMatch.context.id !== homeContext?.id) {
          setHomeContext(routeMatch.context)
          contextNoticeMessage = {
            id: nextId(),
            role: 'system',
            flow: routeMatch.context.flow,
            timestamp: new Date().toISOString(),
            text: routeMatch.rule.notice,
          }
        }

        if (activeFlow !== 'home') {
          onFlowChange('home')
        }
      }
    }

    const userMessage: ChatMessage = {
      id: nextId(),
      role: 'user',
      flow: responseFlow,
      timestamp: new Date().toISOString(),
      text: input,
    }

    setMessages((previous) => [...previous, userMessage])

    if (contextNoticeMessage) {
      await wait(getContextNoticeDelayMs(contextNoticeMessage.text))
      setMessages((previous) => [...previous, contextNoticeMessage])
    }

    if (options?.skipEngineResponse) {
      return
    }

    const engineResult = resolveChatResponse({
      flow: responseFlow,
      input,
      dataset,
      captureAnswers,
      insights,
      selectedRecommendations,
      improvementPlanDraft,
      storyDraft,
      programDesignDraft,
      actions: {
        setCaptureAnswer,
        generateCapturedSummary,
        toggleRecommendationSelection,
        setImprovementPlanField,
        setStoryField,
        askCompanion,
        setProgramDraftField,
      },
    })

    const assistantMessage: ChatMessage = {
      id: nextId(),
      role: 'assistant',
      flow: responseFlow,
      timestamp: new Date().toISOString(),
      text: engineResult.text,
      blocks: engineResult.blocks,
    }

    setAssistantThinkingLabel(pickThinkingLabel(responseFlow))
    setIsAssistantThinking(true)
    try {
      await wait(getAssistantResponseDelayMs(engineResult.text, Boolean(engineResult.blocks?.length)))
      setMessages((previous) => [...previous, assistantMessage])
    } finally {
      setIsAssistantThinking(false)
    }
  }, [
    activeFlow,
    activeHistoryEntry,
    activeHistoryId,
    askCompanion,
    captureAnswers,
    dataset,
    generateCapturedSummary,
    getContextByMode,
    getRuntimeFlow,
    improvementPlanDraft,
    insights,
    nextId,
    onFlowChange,
    programDesignDraft,
    selectedRecommendations,
    setCaptureAnswer,
    setContextByMode,
    setImprovementPlanField,
    setProgramDraftField,
    setStoryField,
    storyDraft,
    toggleRecommendationSelection,
  ])
  const sendPromptRef = useRef(sendPrompt)

  useEffect(() => {
    sendPromptRef.current = sendPrompt
  }, [sendPrompt])

  useEffect(() => {
    setMessages(createInitialMessages())
    setHistoryContext(null)
    setDraft('')
    simulationStateRef.current = 'idle'
  }, [activeHistoryId])

  useEffect(() => {
    const simulationEnabled = activeHistoryId
      ? homeSimulationEnabled
      : activeFlow === 'home'
      ? homeSimulationEnabled
      : activeFlow === 'feedback'
      ? feedbackSimulationEnabled
      : activeFlow === 'story'
      ? storySimulationEnabled
      : activeFlow === 'companion'
      ? saathiSimulationEnabled
      : activeFlow === 'commons'
      ? commonsSimulationEnabled
      : activeFlow === 'program'
      ? programSimulationEnabled
      : false
    const demoScript = activeHistoryId
      ? historyDemoScript
      : activeFlow === 'home'
      ? homeDemoScript
      : activeFlow === 'feedback'
      ? feedbackDemoScript
      : activeFlow === 'story'
      ? storyDemoScript
      : activeFlow === 'companion'
      ? saathiDemoScript
      : activeFlow === 'commons'
      ? commonsDemoScript
      : activeFlow === 'program'
      ? programDemoScript
      : null

    if (!simulationEnabled || !demoScript) {
      return
    }

    if (simulationStateRef.current !== 'idle') {
      return
    }

    const script = demoScript
    simulationStateRef.current = 'running'

    let cancelled = false

    async function runScript() {
      await wait(0)

      if (cancelled) {
        return
      }

      for (const step of script.steps) {
        if (cancelled) {
          return
        }

        if (step.type === 'assistant') {
          const scriptedFlow = getRuntimeFlow()
          setAssistantThinkingLabel(pickThinkingLabel(scriptedFlow))
          setIsAssistantThinking(true)
          await wait(getScriptedAssistantDelayMs(step.text))
          if (cancelled) {
            setIsAssistantThinking(false)
            return
          }
          appendScriptedAssistantTurn(step.text, step.blocks, step.agentName, {
            agentOrg: step.agentOrg,
            isNudge: step.isNudge,
          })
          setIsAssistantThinking(false)
          await wait(step.postDelayMs ?? defaultPostStepDelayMs)
          continue
        }

        setIsDraftAutoTyping(true)
        for (let cursor = 1; cursor <= step.text.length; cursor += 1) {
          if (cancelled) {
            return
          }

          setDraft(step.text.slice(0, cursor))
          const baseTypingDelay = step.typingMsPerChar ?? defaultTypingMsPerChar
          const adjustedTypingDelay = Math.max(
            minTypingDelayMs,
            Math.round(baseTypingDelay * typingSpeedMultiplier),
          )
          await wait(adjustedTypingDelay)
        }

        if (cancelled) {
          return
        }

        setIsDraftAutoTyping(false)
        simulationStateRef.current = 'awaiting-user'
        awaitingScriptedUserStepRef.current = step

        await new Promise<void>((resolve) => {
          resumeSimulationRef.current = resolve
        })

        if (cancelled) {
          return
        }

        simulationStateRef.current = 'running'
        awaitingScriptedUserStepRef.current = null
        resumeSimulationRef.current = null
        await wait(step.postDelayMs ?? defaultPostStepDelayMs)
      }
    }

    void runScript()
      .then(() => {
        if (!cancelled) {
          simulationStateRef.current = 'completed'
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDraft('')
        }
        setIsAssistantThinking(false)
        setIsDraftAutoTyping(false)
      })

    return () => {
      cancelled = true
      awaitingScriptedUserStepRef.current = null
      if (resumeSimulationRef.current) {
        resumeSimulationRef.current()
        resumeSimulationRef.current = null
      }
      simulationStateRef.current = 'idle'
      setIsAssistantThinking(false)
      setIsDraftAutoTyping(false)
    }
  }, [
    activeFlow,
    activeHistoryId,
    appendScriptedAssistantTurn,
    commonsDemoScript,
    feedbackDemoScript,
    getRuntimeFlow,
    historyDemoScript,
    homeDemoScript,
    programDemoScript,
    saathiDemoScript,
    storyDemoScript,
  ])

  const submitDraft = useCallback((rawPrompt: string) => {
    if (isDraftAutoTyping || isAssistantThinking) {
      return
    }

    const input = rawPrompt.trim()
    if (!input) {
      return
    }

    const awaitingStep = awaitingScriptedUserStepRef.current
    if (awaitingStep && simulationStateRef.current === 'awaiting-user') {
      void sendPrompt(input, {
        skipEngineResponse: awaitingStep.skipEngineResponse,
        targetContextId: awaitingStep.targetContextId,
        contextNotice: awaitingStep.contextNotice,
        handoffSummary: awaitingStep.handoffSummary,
      })
      setDraft('')
      const resume = resumeSimulationRef.current
      resumeSimulationRef.current = null
      resume?.()
      return
    }

    void sendPrompt(input)
    setDraft('')
  }, [isAssistantThinking, isDraftAutoTyping, sendPrompt])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitDraft(draft)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitDraft(draft)
    }
  }

  const isSendDisabled = isDraftAutoTyping || isAssistantThinking || !draft.trim()

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card/75 shadow-sm">
      <div className="border-b border-border/80 bg-background/75 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {showUnsetContextState ? (
            <>
              <Badge className="border-dashed border-border text-muted-foreground" variant="outline">
                Context: Not selected yet
              </Badge>
              <Badge className="border-dashed border-border text-muted-foreground" variant="outline">
                Sub-context: Waiting for intent
              </Badge>
            </>
          ) : (
            <>
              <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline">
                Context: {displayContextLabel}
              </Badge>
              {subContextLabel ? (
                <Badge variant="outline">Sub-context: {subContextLabel}</Badge>
              ) : activeFlow !== 'home' ? (
                <Badge className="text-muted-foreground" variant="outline">
                  Sub-context: -
                </Badge>
              ) : null}
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {showUnsetContextState
            ? 'Share what you want to do, and SAARTHI will auto-select the right context.'
            : activeFlow === 'home'
            ? 'Home routing evaluates every user turn and keeps context sticky until a new match appears.'
            : activeFlow === 'feedback'
            ? 'Feedback flow keeps context sticky so the capture conversation remains consistent.'
            : activeFlow === 'story'
            ? 'Story flow keeps context sticky so your narrative capture remains consistent.'
            : activeFlow === 'companion'
            ? 'Saathi flow keeps context sticky so support guidance stays grounded.'
            : activeFlow === 'commons'
            ? 'Commons flow keeps context sticky so discovery remains focused.'
            : activeFlow === 'program'
            ? 'Design Companion flow keeps context sticky so program planning stays structured.'
            : 'Advanced mode is manual, but matching intents still route this shared thread automatically.'}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 md:px-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isAssistantThinking ? <AssistantThinkingBubble label={assistantThinkingLabel} /> : null}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border/80 bg-card/95 px-4 py-3 backdrop-blur md:px-6">
        <form className="flex items-center gap-2" onSubmit={onSubmit}>
          <Textarea
            className="min-h-[52px] max-h-[220px] resize-none rounded-2xl bg-background transition-[background-color,border-color,box-shadow] motion-transition-md focus-visible:border-primary/40 focus-visible:bg-card"
            disabled={isDraftAutoTyping || isAssistantThinking}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={getComposerPlaceholder(effectiveFlow)}
            ref={composerTextareaRef}
            value={draft}
          />
          <Button
            className={cn(
              'h-[52px] shrink-0 rounded-xl px-4 transition-[opacity,background-color,box-shadow] motion-transition-fast',
              isSendDisabled
                ? 'opacity-75'
                : 'opacity-100',
            )}
            disabled={isSendDisabled}
            type="submit"
          >
            <SendHorizontal className="mr-1 h-4 w-4" />
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
}: {
  message: ChatMessage
}) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    if (message.handoff) {
      return <TransitionCard handoff={message.handoff} timestamp={message.timestamp} />
    }

    return (
      <div className="flex justify-center motion-safe:animate-fade-up-sm motion-safe:[animation-fill-mode:both]">
        <div className="max-w-[900px] rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-center">
          <p className="text-xs font-medium text-primary">{renderMessageText(message.text)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    )
  }

  const railColor = !isUser ? getAgentRailColor(message.agentName, message.agentOrg) : undefined
  const showAgentStamp = !isUser && Boolean(message.agentName) && !message.isNudge

  return (
    <div
      className={cn(
        'flex gap-3 motion-safe:[animation-fill-mode:both]',
        isUser
          ? 'justify-end motion-safe:animate-slide-x-sm'
          : 'justify-start motion-safe:animate-fade-up-sm',
      )}
    >
      {!isUser ? (
        <div className="mt-1 shrink-0 text-primary">
          <Bot className="h-5 w-5" />
        </div>
      ) : null}

      <div
        className={cn(
          'max-w-[900px] rounded-2xl border px-4 py-3',
          isUser
            ? 'border-primary/30 bg-primary text-primary-foreground'
            : message.isNudge
            ? 'border-accent/50 bg-accent/5 text-foreground'
            : 'border-border bg-background text-foreground',
        )}
        style={
          !isUser && !message.isNudge && railColor
            ? { borderLeftColor: railColor, borderLeftWidth: 4 }
            : undefined
        }
      >
        {message.isNudge ? (
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-soft-highlight" />
            Saarthi noticed
          </p>
        ) : null}

        {showAgentStamp ? (
          <div className="mb-1.5">
            <AgentStamp agentName={message.agentName} agentOrg={message.agentOrg} />
          </div>
        ) : null}

        <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', isUser ? 'text-primary-foreground' : 'text-foreground')}>
          {renderMessageText(message.text)}
        </p>

        {message.blocks && message.blocks.length > 0 ? <AssistantBlocks blocks={message.blocks} /> : null}

        <p className={cn('mt-2 text-[11px]', isUser ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {message.agentName ?? getFlowLabel(message.flow)}
        </p>
      </div>

      {isUser ? (
        <div className="mt-1 shrink-0 text-primary">
          <UserCircle2 className="h-5 w-5" />
        </div>
      ) : null}
    </div>
  )
}

function renderMessageText(text: string) {
  const urlRegex = /https?:\/\/[^\s]+/g
  const parts: ReactNode[] = []
  let cursor = 0
  let linkIndex = 0

  for (const match of text.matchAll(urlRegex)) {
    const matchedText = match[0]
    const start = match.index ?? 0

    if (start > cursor) {
      parts.push(text.slice(cursor, start))
    }

    const href = matchedText.replace(/[),.;!?]+$/g, '')
    const trailing = matchedText.slice(href.length)

    parts.push(
      <a
        className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
        href={href}
        key={`msg-link-${linkIndex}`}
        rel="noreferrer noopener"
        target="_blank"
      >
        {href}
      </a>,
    )

    if (trailing) {
      parts.push(trailing)
    }

    cursor = start + matchedText.length
    linkIndex += 1
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return parts.length > 0 ? parts : text
}

function AssistantThinkingBubble({ label }: { label: string }) {
  return (
    <div className="flex justify-start gap-3 motion-safe:animate-fade-up-sm motion-safe:[animation-fill-mode:both]">
      <div className="mt-1 shrink-0 text-primary">
        <Bot className="h-5 w-5" />
      </div>
      <div className="max-w-[900px] rounded-2xl border border-border bg-background px-4 py-3 text-foreground">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70 motion-safe:animate-soft-highlight motion-safe:[animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70 motion-safe:animate-soft-highlight motion-safe:[animation-delay:140ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70 motion-safe:animate-soft-highlight motion-safe:[animation-delay:280ms]" />
        </div>
      </div>
    </div>
  )
}

function AssistantBlocks({
  blocks,
}: {
  blocks: ChatBlock[]
}) {
  return (
    <div className="mt-3 space-y-2.5">
      {blocks.map((block, index) => {
        const animationDelay = `${Math.min(index, 6) * 45}ms`

        if (block.type === 'list') {
          return (
            <div
              className="rounded-xl border border-border bg-card/70 p-3 motion-safe:animate-fade-up-sm motion-safe:[animation-fill-mode:both]"
              key={`${block.title}-${index}`}
              style={{ animationDelay }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.title}</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-foreground">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )
        }

        if (block.type === 'kv') {
          const cardAction = block.action

          return (
            <div
              className="rounded-xl border border-border bg-card/70 p-3 motion-safe:animate-fade-up-sm motion-safe:[animation-fill-mode:both]"
              key={`${block.title}-${index}`}
              style={{ animationDelay }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.title}</p>
              <div className="mt-2 grid gap-1.5">
                {block.rows.map((row) => (
                  <div className="grid grid-cols-[130px_1fr] gap-2 text-sm" key={row.label}>
                    <p className="text-muted-foreground">{row.label}</p>
                    <p className="text-foreground">{row.value}</p>
                  </div>
                ))}
              </div>
              {cardAction ? (
                <div className="mt-3">
                  <Button
                    className="h-8 rounded-lg px-3 text-xs"
                    disabled
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {cardAction.label}
                  </Button>
                </div>
              ) : null}
            </div>
          )
        }

        if (block.type === 'tags') {
          return (
            <div
              className="rounded-xl border border-border bg-card/70 p-3 motion-safe:animate-fade-up-sm motion-safe:[animation-fill-mode:both]"
              key={`${block.title ?? 'tags'}-${index}`}
              style={{ animationDelay }}
            >
              {block.title ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.title}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {block.tags.map((tag) => (
                  <span
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )
        }

        if (block.type === 'actions') {
          return (
            <div
              className="rounded-xl border border-border bg-card/70 p-3 motion-safe:animate-fade-up-sm motion-safe:[animation-fill-mode:both]"
              key={`${block.title ?? 'actions'}-${index}`}
              style={{ animationDelay }}
            >
              {block.title ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.title}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {block.actions.map((action) => (
                  <Button
                    className="h-8 rounded-lg px-3 text-xs"
                    key={action.label}
                    disabled
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )
        }

        return (
          <div
            className="rounded-xl border border-border bg-card/70 p-3 motion-safe:animate-fade-up-sm motion-safe:[animation-fill-mode:both]"
            key={`${block.title ?? 'text'}-${index}`}
            style={{ animationDelay }}
          >
            {block.title ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.title}</p>
            ) : null}
            <p className="mt-1 text-sm text-foreground">{block.body}</p>
          </div>
        )
      })}
    </div>
  )
}

function pickThinkingLabel(flow: FlowKey) {
  const labels: Record<FlowKey, string[]> = {
    home: ['Understanding your intent...', 'Routing to the best context...', 'Preparing the next step...'],
    feedback: ['Reviewing your feedback...', 'Framing the feedback context...', 'Preparing the next feedback step...'],
    commons: ['Searching SG Commons...', 'Reviewing relevant assets...', 'Preparing resource suggestions...'],
    capture: ['Reviewing captured signals...', 'Structuring challenge details...', 'Assembling your summary...'],
    insights: ['Scanning patterns...', 'Comparing root causes...', 'Synthesizing insights...'],
    recommendations: ['Matching practical recommendations...', 'Evaluating options...', 'Building recommendation shortlist...'],
    improvement: ['Drafting a micro-improvement plan...', 'Aligning action and timeline...', 'Preparing implementation steps...'],
    story: ['Shaping your story arc...', 'Polishing impact narrative...', 'Preparing story card output...'],
    companion: ['Reviewing similar scenarios...', 'Thinking through support options...', 'Preparing contextual guidance...'],
    mentoring: ['Matching you with practitioner mentors...', 'Preparing actionable session options...', 'Structuring mentoring next steps...'],
    program: ['Aligning program design elements...', 'Checking objective-indicator fit...', 'Preparing program snapshot...'],
    history: ['Reviewing this example...', 'Loading the next step...', 'Preparing the next turn...'],
  }

  const flowLabels = labels[flow]
  return flowLabels[Math.floor(Math.random() * flowLabels.length)]
}

function getPreferredContextForMode(mode: FlowKey, config: HomeFlowConfig) {
  const preferredFlowByMode: Partial<Record<FlowKey, RouteContext['flow']>> = {
    feedback: 'capture',
    story: 'story',
    companion: 'companion',
    commons: 'commons',
    program: 'program',
  }

  const preferredFlow = preferredFlowByMode[mode]
  if (preferredFlow) {
    const preferredContext = config.contexts.find((context) => context.flow === preferredFlow)
    if (preferredContext) {
      return preferredContext
    }
  }

  return config.contexts.find((context) => context.id === config.defaultContextId) ?? config.contexts[0] ?? null
}

function getAssistantResponseDelayMs(text: string, hasBlocks: boolean) {
  const base = 450
  const textContribution = Math.min(900, text.length * 10)
  const blockContribution = hasBlocks ? 180 : 0
  const jitter = Math.floor(Math.random() * 220)
  return Math.min(2200, base + textContribution + blockContribution + jitter)
}

function getScriptedAssistantDelayMs(text: string) {
  const base = 380
  const textContribution = Math.min(780, text.length * 8)
  const jitter = Math.floor(Math.random() * 180)
  return Math.min(1700, base + textContribution + jitter)
}

function getContextNoticeDelayMs(text: string) {
  const textContribution = Math.min(240, text.length * 3)
  const jitter = Math.floor(Math.random() * 120)
  return Math.min(720, baseContextNoticeDelayMs + textContribution + jitter)
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), ms)
  })
}

function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: 'msg-initial',
      role: 'assistant',
      flow: 'home',
      timestamp: new Date().toISOString(),
      text: `Namaste. How can I help you today?`,
    },
  ]
}
