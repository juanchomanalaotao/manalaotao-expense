import { useState } from 'react'
import { CATEGORIES } from '../lib/categories'
import type { Expense, ExpenseCategory } from '../lib/types'
import { newId, parseAmount, todayISO } from '../lib/storage'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (expense: Expense) => void
}

export function AddExpenseModal({ open, onClose, onSave }: Props) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('pagkain')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())

  if (!open) return null

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseAmount(amount)
    if (value <= 0) return
    onSave({
      id: newId(),
      amount: value,
      category,
      note: note.trim(),
      date,
      createdAt: new Date().toISOString(),
    })
    setAmount('')
    setNote('')
    setDate(todayISO())
    setCategory('pagkain')
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-labelledby="add-expense-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" aria-hidden />
        <header className="modal-head">
          <h2 id="add-expense-title">Bagong gastos</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </header>
        <form onSubmit={submit} className="modal-form">
          <label className="field">
            <span>Halaga</span>
            <div className="input-prefix">
              <span>₱</span>
              <input
                type="number"
                min={0}
                step={1}
                required
                autoFocus
                placeholder="150"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </label>

          <label className="field">
            <span>Petsa</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <fieldset className="category-grid">
            <legend>Kategorya</legend>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`cat-chip ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                <span>{c.emoji}</span>
                <span>{c.label.split(' / ')[0]}</span>
              </button>
            ))}
          </fieldset>

          <label className="field">
            <span>Nota (opsyonal)</span>
            <input
              type="text"
              placeholder="Hal. bigas, pamasahe"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <button type="submit" className="btn primary full">
            Idagdag
          </button>
        </form>
      </div>
    </div>
  )
}
