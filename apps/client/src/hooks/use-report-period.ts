import { useLocalSearchParams, useRouter } from 'expo-router'
import type { FinanceSnapshot, MonthKey } from '@/types/finance'

export function useReportMonth({ months, latestMonth }: FinanceSnapshot) {
  const { thang } = useLocalSearchParams<{ thang?: string }>()
  const router = useRouter()
  const month = months.find((item) => item === thang) ?? latestMonth

  function setMonth(value: MonthKey) {
    router.setParams({ thang: value })
  }

  return [month, setMonth] as const
}
