import type { MonthKey } from '@/types/finance'

const number = new Intl.NumberFormat('vi-VN')
const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 })

export function formatVnd(amountVnd: number) {
  return `${number.format(amountVnd)} ₫`
}

export function formatPercent(value: number) {
  return percent.format(value)
}

export function formatMonth(month: MonthKey) {
  const [year, monthNumber] = month.split('-')
  return `Tháng ${Number(monthNumber)}, ${year}`
}

export function shortMonth(month: MonthKey) {
  return `T${Number(month.split('-')[1])}`
}

export function formatDate(date: string) {
  return date.split('-').reverse().join('/')
}
