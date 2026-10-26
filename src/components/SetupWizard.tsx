import { useState } from 'react'
import type { BudgetProfile, FixedCost } from '../lib/types'
import { newId, parseAmount } from '../lib/storage'
import '../App.css'

type Props = {
  profile: BudgetProfile
  onComplete: (profile: BudgetProfile) => void
}

export function SetupWizard({ profile, onComplete }: Props) {
  const [income, setIncome] = useState(
    profile.monthlyIncome ? String(profile.monthlyIncome) : '',
  )
  const [savings, setSavings] = useState(String(profile.savingsPercent || 20))
  const [fixed, setFixed] = useState<FixedCost[]>(profile.fixedCosts)

  function updateFixed(id: string, patch: Partial<FixedCost>) {
    setFixed((list) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function addFixed() {
    setFixed((list) => [
      ...list,
      { id: newId(), label: 'Iba pang bayarin', amount: 0 },
    ])
  }

  function removeFixed(id: string) {
    setFixed((list) => list.filter((item) => item.id !== id))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const monthlyIncome = parseAmount(income)
    if (monthlyIncome <= 0) return
    onComplete({
      monthlyIncome,
      savingsPercent: Math.min(50, Math.max(0, parseAmount(savings))),
      fixedCosts: fixed.map((f) => ({
        ...f,
        amount: f.amount,
        label: f.label.trim() || 'Bayarin',
      })),
      setupComplete: true,
    })
  }

  return (
    <div className="setup">
      <div className="setup-hero">
        <div className="setup-hero-icon" aria-hidden>
          🏡
        </div>
        <p className="eyebrow">Home budget</p>
        <h1 style={{ margin: '0.25rem 0 0', fontWeight: 800, letterSpacing: '-0.03em' }}>
          Budget sa Bahay
        </h1>
      </div>
      <div className="setup-card">
        <h2 className="setup-card-title">I-set muna ang kita</h2>
        <p className="lead">
          Ilagay ang buwanang kita at mga siguradong bayarin. Ang natira ay
          hahatiin sa araw para alam mo kung magkano ang pwede mong gastusin
          araw-araw — para mas madaling mag-tipid.
        </p>

        <form onSubmit={submit} className="setup-form">
          <label className="field">
            <span>Buwanang kita (neto, hal. sweldo)</span>
            <div className="input-prefix">
              <span>₱</span>
              <input
                type="number"
                min={0}
                step={100}
                required
                placeholder="35000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </div>
          </label>

          <label className="field">
            <span>Ipon bawat buwan (% ng kita)</span>
            <div className="input-suffix">
              <input
                type="number"
                min={0}
                max={50}
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
              />
              <span>%</span>
            </div>
            <small className="hint">
              Karaniwan 10–20%. Mas mataas = mas maliit ang araw-araw na gastos.
            </small>
          </label>

          <div className="field-group">
            <div className="field-group-head">
              <span>Fixed costs (bayarin bawat buwan)</span>
              <button type="button" className="text-btn" onClick={addFixed}>
                + Dagdag
              </button>
            </div>
            {fixed.map((item) => (
              <div key={item.id} className="fixed-row">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) =>
                    updateFixed(item.id, { label: e.target.value })
                  }
                  placeholder="Hal. upa, internet"
                />
                <div className="input-prefix compact">
                  <span>₱</span>
                  <input
                    type="number"
                    min={0}
                    value={item.amount || ''}
                    onChange={(e) =>
                      updateFixed(item.id, {
                        amount: parseAmount(e.target.value),
                      })
                    }
                  />
                </div>
                {fixed.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Alisin"
                    onClick={() => removeFixed(item.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="submit" className="btn primary full">
            Simulan ang tracking
          </button>
        </form>
      </div>
    </div>
  )
}
