import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { FinanceRepository, FinanceSnapshot } from '@/types/finance'

type FinanceState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: FinanceSnapshot }
  | { status: 'error' }

const FinanceContext = createContext<(FinanceState & { retry: () => void }) | null>(null)

export function FinanceProvider({ children, repository }: { children: ReactNode; repository: FinanceRepository }) {
  const [state, setState] = useState<FinanceState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    repository.getSnapshot(controller.signal).then(
      (snapshot) => {
        if (!controller.signal.aborted) setState({ status: 'ready', snapshot })
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      },
    )
    return () => controller.abort()
  }, [repository, attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((value) => value + 1)
  }

  return <FinanceContext.Provider value={{ ...state, retry }}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) throw new Error('FinanceProvider is required')
  return context
}
