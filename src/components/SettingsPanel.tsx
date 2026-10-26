import { useState } from 'react'
import type { BudgetProfile, FixedCost } from '../lib/types'
import { newId, parseAmount } from '../lib/storage'

type Props = {
  profile: BudgetProfile
  onSave: (profile: BudgetProfile) => void
  onReset: () => void
  firebaseOn?: boolean
  inviteCode?: string | null
  onLeaveShared?: () => void
}

export function SettingsPanel({
  profile,
  onSave,
  onReset,
  firebaseOn,
  inviteCode,
  onLeaveShared,
}: Props) {
  const [income, setIncome] = useState(String(profile.monthlyIncome))
  const [savings, setSavings] = useState(String(profile.savingsPercent))
  const [fixed, setFixed] = useState<FixedCost[]>(profile.fixedCosts)

  function updateFixed(id: string, patch: Partial<FixedCost>) {
    setFixed((list) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      ...profile,
      monthlyIncome: parseAmount(income),
      savingsPercent: Math.min(50, Math.max(0, parseAmount(savings))),
      fixedCosts: fixed,
    })
  }

  return (
    <section className="panel settings-stack">
      {firebaseOn && inviteCode && (
        <div className="share-block">
          <h2>Shared sa asawa</h2>
          <p className="muted">
            I-send ang code na ito para makapag-log din siya ng gastos. Real-time
            sync sa Firebase.
          </p>
          <div className="invite-code-display small">{inviteCode}</div>
          <button
            type="button"
            className="btn ghost full"
            onClick={() => navigator.clipboard.writeText(inviteCode)}
          >
            Kopyahin invite code
          </button>
          {onLeaveShared && (
            <button
              type="button"
              className="text-btn center-btn"
              onClick={() => {
                if (
                  confirm(
                    'Aalis ka sa shared budget sa phone na ito. Hindi mabubura ang cloud data.',
                  )
                ) {
                  onLeaveShared()
                  window.location.reload()
                }
              }}
            >
              Umalis sa shared budget
            </button>
          )}
        </div>
      )}

      {firebaseOn && !inviteCode && (
        <p className="muted">Walang invite code — bumalik sa shared setup.</p>
      )}

      {!firebaseOn && (
        <p className="sync-banner local">
          Naka-local lang ang data. Lagyan ng Firebase config (.env) para mag-sync
          kayo ng asawa.
        </p>
      )}

      <h2>Budget settings</h2>
      <p className="muted">
        I-update kapag nagbago ang sweldo o bayarin. Ang daily allowance ay
        awtomatikong maa-adjust.
      </p>
      <form onSubmit={submit} className="settings-form">
        <label className="field">
          <span>Buwanang kita</span>
          <div className="input-prefix">
            <span>₱</span>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
          </div>
        </label>
        <label className="field">
          <span>Target ipon (%)</span>
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
        </label>
        <div className="field-group">
          <span className="label">Fixed costs</span>
          {fixed.map((item) => (
            <div key={item.id} className="fixed-row">
              <input
                type="text"
                value={item.label}
                onChange={(e) =>
                  updateFixed(item.id, { label: e.target.value })
                }
              />
              <div className="input-prefix compact">
                <span>₱</span>
                <input
                  type="number"
                  value={item.amount || ''}
                  onChange={(e) =>
                    updateFixed(item.id, {
                      amount: parseAmount(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-btn"
            onClick={() =>
              setFixed((l) => [
                ...l,
                { id: newId(), label: 'Bayarin', amount: 0 },
              ])
            }
          >
            + Dagdag na bayarin
          </button>
        </div>
        <button type="submit" className="btn primary">
          I-save
        </button>
      </form>
      <div className="danger-zone">
        <p>Burahin lahat ng data sa browser na ito?</p>
        <button type="button" className="btn ghost danger" onClick={onReset}>
          Reset app
        </button>
      </div>
    </section>
  )
}
