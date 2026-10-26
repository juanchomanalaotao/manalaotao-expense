import type { BudgetProfile, BudgetSnapshot, Expense } from './types'
import { currentMonthKey, filterExpensesByMonth, todayISO } from './storage'

export function computeBudget(
  profile: BudgetProfile,
  expenses: Expense[],
  refDate = new Date(),
): BudgetSnapshot {
  const fixedTotal = profile.fixedCosts.reduce((s, c) => s + c.amount, 0)
  const savingsAmount = Math.round(
    (profile.monthlyIncome * profile.savingsPercent) / 100,
  )
  const monthlyBudget = Math.max(
    0,
    profile.monthlyIncome - fixedTotal - savingsAmount,
  )

  const monthKey = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`
  const monthExpenses = filterExpensesByMonth(expenses, monthKey)
  const spentThisMonth = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const remaining = monthlyBudget - spentThisMonth

  const daysInMonth = new Date(
    refDate.getFullYear(),
    refDate.getMonth() + 1,
    0,
  ).getDate()
  const dayOfMonth = refDate.getDate()
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1)
  const suggestedDaily = Math.max(0, Math.round(remaining / daysLeft))

  const today = todayISO()
  const spentToday = expenses
    .filter((e) => e.date === today)
    .reduce((s, e) => s + e.amount, 0)

  const percentUsed =
    monthlyBudget > 0
      ? Math.min(100, Math.round((spentThisMonth / monthlyBudget) * 100))
      : 0

  let status: BudgetSnapshot['status'] = 'ok'
  if (remaining < 0 || percentUsed >= 100) status = 'over'
  else if (percentUsed >= 75 || spentToday > suggestedDaily * 1.2)
    status = 'caution'

  return {
    monthlyBudget,
    fixedTotal,
    savingsAmount,
    spentThisMonth,
    remaining,
    daysInMonth,
    dayOfMonth,
    daysLeft,
    suggestedDaily,
    spentToday,
    percentUsed,
    status,
  }
}

export function categoryTotals(expenses: Expense[]) {
  const map = new Map<string, number>()
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

export function topCategoryTip(expenses: Expense[], monthKey: string) {
  const month = filterExpensesByMonth(expenses, monthKey)
  const totals = categoryTotals(month)
  return totals[0]?.[0] ?? null
}

export function statusMessage(snap: BudgetSnapshot): string {
  if (snap.status === 'over') {
    return 'Lampas ka na sa budget ngayong buwan. Itigil muna ang hindi kailangan at subukan mag-luto sa bahay.'
  }
  if (snap.spentToday > snap.suggestedDaily && snap.suggestedDaily > 0) {
    return `Gastos mo ngayon (${formatShort(snap.spentToday)}) ay mas mataas sa suggested na ${formatShort(snap.suggestedDaily)} para sa araw na ito.`
  }
  if (snap.status === 'caution') {
    return 'Malapit ka na sa limit ng buwan. Mag-ingat sa maliliit na gastos — mabilis silang magdagdag.'
  }
  if (snap.remaining > 0 && snap.suggestedDaily > 0) {
    return `OK pa ang budget. Pwede kang gumastos ng hanggang ${formatShort(snap.suggestedDaily)} ngayong araw para hindi maubos agad.`
  }
  return 'I-set ang kita at fixed costs para makita ang araw-araw na allowance mo.'
}

function formatShort(n: number) {
  return `₱${n.toLocaleString('fil-PH')}`
}

export { currentMonthKey }
