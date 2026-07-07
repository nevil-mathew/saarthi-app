import { useState } from 'react'

import { ChatWorkspace } from '@/components/chat/ChatWorkspace'
import { AppShell } from '@/components/layout/AppShell'
import { challengeData } from '@/data/mockData'
import { SaarthiStateProvider, useSaarthiState } from '@/hooks/useSaarthiState'
import type { FlowKey } from '@/types/saarthi'

export default function App() {
  return (
    <SaarthiStateProvider>
      <SaarthiPrototype />
    </SaarthiStateProvider>
  )
}

function SaarthiPrototype() {
  const [activeFlow, setActiveFlow] = useState<FlowKey>('home')
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const [activeHistoryContextId, setActiveHistoryContextId] = useState<string | null>(null)
  const { selectedChallenge } = useSaarthiState()

  function handleFlowChange(flow: FlowKey) {
    setActiveHistoryId(null)
    setActiveFlow(flow)
  }

  function handleSelectHistory(id: string) {
    setActiveHistoryContextId(null)
    setActiveHistoryId(id)
  }

  return (
    <AppShell
      activeFlow={activeFlow}
      onFlowChange={handleFlowChange}
      selectedChallenge={selectedChallenge}
      selectedChallengeLabel={challengeData[selectedChallenge].label}
      activeHistoryId={activeHistoryId}
      onSelectHistory={handleSelectHistory}
      activeHistoryContextId={activeHistoryContextId}
    >
      <ChatWorkspace
        activeFlow={activeFlow}
        onFlowChange={handleFlowChange}
        activeHistoryId={activeHistoryId}
        onHistoryContextChange={setActiveHistoryContextId}
      />
    </AppShell>
  )
}
