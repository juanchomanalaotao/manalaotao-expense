export type ExpenseCategory =
  | 'pagkain'
  | 'ulam'
  | 'transport'
  | 'bills'
  | 'health'
  | 'kids'
  | 'home'
  | 'libangan'
  | 'iba'

export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  note: string
  date: string // YYYY-MM-DD
  createdAt: string
}

export interface FixedCost {
  id: string
  label: string
  amount: number
}

export interface BudgetProfile {
  monthlyIncome: number
  savingsPercent: number
  fixedCosts: FixedCost[]
  setupComplete: boolean
}

export interface AppData {
  profile: BudgetProfile
  expenses: Expense[]
}

export interface BudgetSnapshot {
  monthlyBudget: number
  fixedTotal: number
  savingsAmount: number
  spentThisMonth: number
  remaining: number
  daysInMonth: number
  dayOfMonth: number
  daysLeft: number
  suggestedDaily: number
  spentToday: number
  percentUsed: number
  status: 'ok' | 'caution' | 'over'
}
