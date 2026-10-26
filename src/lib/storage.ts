import type { AppData, BudgetProfile, Expense } from './types'

const STORAGE_KEY = 'daily-expense-home-budget-v1'

const defaultProfile: BudgetProfile = {
  monthlyIncome: 0,
  savingsPercent: 20,
  fixedCosts: [
    { id: 'rent', label: 'Upa / Bahay', amount: 0 },
    { id: 'utilities', label: 'Kuryente at tubig', amount: 0 },
  ],
  setupComplete: false,
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { profile: { ...defaultProfile }, expenses: [] }
    }
    const parsed = JSON.parse(raw) as AppData
    return {
      profile: { ...defaultProfile, ...parsed.profile },
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    }
  } catch {
    return { profile: { ...defaultProfile }, expenses: [] }
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function newId() {
  return crypto.randomUUID()
}

export function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatPHP(amount: number) {
  return new Intl.NumberFormat('fil-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function parseAmount(input: string): number {
  const n = Number(String(input).replace(/,/g, '').trim())
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function monthKey(dateStr: string) {
  return dateStr.slice(0, 7)
}

export function currentMonthKey() {
  return monthKey(todayISO())
}

export function filterExpensesByMonth(expenses: Expense[], key: string) {
  return expenses.filter((e) => monthKey(e.date) === key)
}
