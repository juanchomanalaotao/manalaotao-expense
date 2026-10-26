import { useMemo, useState } from 'react'
import { AddExpenseModal } from './components/AddExpenseModal'
import { HouseholdGate } from './components/HouseholdGate'
import { LoadingScreen } from './components/LoadingScreen'
import { SettingsPanel } from './components/SettingsPanel'
import { SetupWizard } from './components/SetupWizard'
import { ShareInviteModal } from './components/ShareInviteModal'
import { useSharedBudget } from './hooks/useSharedBudget'
import {
  categoryTotals,
  computeBudget,
  currentMonthKey,
  statusMessage,
  topCategoryTip,
} from './lib/budget'
import { CATEGORIES, categoryMeta } from './lib/categories'
import { filterExpensesByMonth, formatPHP } from './lib/storage'
import type { BudgetProfile, Expense } from './lib/types'
import './App.css'

type Tab = 'home' | 'history' | 'settings'

const RING_R = 42
const RING_C = 2 * Math.PI * RING_R

function statusLabel(status: 'ok' | 'caution' | 'over') {
  if (status === 'over') return 'Lampas budget'
  if (status === 'caution') return 'Mag-ingat'
  return 'Ayos pa'
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('fil-PH', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1))
}

function syncLabel(
  firebaseOn: boolean,
  status: string,
): { text: string; tone: 'live' | 'local' | 'warn' } {
  if (!firebaseOn) return { text: 'Local lang', tone: 'local' }
  if (status === 'synced') return { text: 'Live sync', tone: 'live' }
  if (status === 'error') return { text: 'Sync issue', tone: 'warn' }
  return { text: 'Sync…', tone: 'warn' }
}

function App() {
  const {
    data,
    persist,
    syncStatus,
    syncError,
    firebaseOn,
    inviteCode,
    createHousehold,
    joinHousehold,
    leaveSharedBudget,
    authReady,
  } = useSharedBudget()

  const [tab, setTab] = useState<Tab>('home')
  const [modalOpen, setModalOpen] = useState(false)
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null)

  const snap = useMemo(
    () => computeBudget(data.profile, data.expenses),
    [data.profile, data.expenses],
  )

  const monthKey = currentMonthKey()
  const monthExpenses = useMemo(
    () =>
      filterExpensesByMonth(data.expenses, monthKey).sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [data.expenses, monthKey],
  )

  const totals = categoryTotals(monthExpenses)
  const topCat = topCategoryTip(data.expenses, monthKey)
  const topTip = topCat ? categoryMeta(topCat as Expense['category']).tip : null

  const sync = syncLabel(firebaseOn, syncStatus)

  function completeSetup(profile: BudgetProfile) {
    void persist({ ...data, profile })
  }

  function addExpense(expense: Expense) {
    void persist({ ...data, expenses: [expense, ...data.expenses] })
  }

  function deleteExpense(id: string) {
    void persist({
      ...data,
      expenses: data.expenses.filter((e) => e.id !== id),
    })
  }

  function saveProfile(profile: BudgetProfile) {
    void persist({ ...data, profile: { ...profile, setupComplete: true } })
  }

  function resetAll() {
    if (
      !confirm(
        'Sigurado ka? Mabubura ang local copy sa phone na ito. Ang cloud data ay mananatili kung naka-sync kayo.',
      )
    )
      return
    localStorage.removeItem('daily-expense-home-budget-v1')
    if (firebaseOn) leaveSharedBudget()
    window.location.reload()
  }

  if (firebaseOn && !authReady) {
    return <LoadingScreen message="Kumokonekta sa Firebase…" />
  }

  if (firebaseOn && syncStatus === 'need-household') {
    return (
      <HouseholdGate
        busy={!authReady}
        onCreate={async () => {
          const result = await createHousehold()
          setNewInviteCode(result.inviteCode)
        }}
        onJoin={async (code) => {
          await joinHousehold(code)
        }}
      />
    )
  }

  if (firebaseOn && syncStatus === 'loading') {
    return <LoadingScreen message="Kinukuha ang shared budget…" />
  }

  if (!data.profile.setupComplete || data.profile.monthlyIncome <= 0) {
    return (
      <div className="app-page">
        <div className="app-bg" aria-hidden />
        <SetupWizard profile={data.profile} onComplete={completeSetup} />
        {newInviteCode && (
          <ShareInviteModal
            code={newInviteCode}
            onClose={() => setNewInviteCode(null)}
          />
        )}
      </div>
    )
  }

  const ringOffset =
    RING_C - (Math.min(100, snap.percentUsed) / 100) * RING_C

  return (
    <div className="app-page">
      <div className="app-bg" aria-hidden />
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden>
              🏡
            </div>
            <div>
              <p className="eyebrow">Daily expense</p>
              <h1>Budget sa Bahay</h1>
            </div>
          </div>
          <div className="topbar-meta">
            <span className={`sync-badge ${sync.tone}`}>{sync.text}</span>
            <span className="month-chip">{formatMonthLabel(monthKey)}</span>
          </div>
        </header>

        {syncError && (
          <p className="sync-banner" role="status">
            {syncError}
          </p>
        )}

        {tab === 'home' && (
          <main className="main-grid">
            <section className={`hero-card ${snap.status}`}>
              <div className="hero-top">
                <p className="hero-label">Pwede gastusin ngayong araw</p>
                <span className="status-pill">{statusLabel(snap.status)}</span>
              </div>
              <div className="hero-body">
                <div className="hero-copy">
                  <p className="hero-amount">{formatPHP(snap.suggestedDaily)}</p>
                  <p className="hero-sub">
                    Natitira sa buwan:{' '}
                    <strong>{formatPHP(Math.max(0, snap.remaining))}</strong>
                    <br />
                    {snap.daysLeft} araw pa · {snap.dayOfMonth}/{snap.daysInMonth}
                  </p>
                </div>
                <div className="ring-wrap" aria-hidden>
                  <svg viewBox="0 0 100 100">
                    <circle className="ring-bg" cx="50" cy="50" r={RING_R} />
                    <circle
                      className="ring-fill"
                      cx="50"
                      cy="50"
                      r={RING_R}
                      strokeDasharray={RING_C}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <span className="ring-label">{snap.percentUsed}%</span>
                </div>
              </div>
              <div className="hero-progress">
                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, snap.percentUsed)}%` }}
                  />
                </div>
                <p className="progress-caption">
                  {formatPHP(snap.spentThisMonth)} /{' '}
                  {formatPHP(snap.monthlyBudget)} ng spending budget
                </p>
              </div>
            </section>

            <section className="stat-row">
              <article className="stat">
                <span className="stat-icon">☀️</span>
                <span className="stat-label">Gastos ngayon</span>
                <span className="stat-value">{formatPHP(snap.spentToday)}</span>
              </article>
              <article className="stat">
                <span className="stat-icon">🐷</span>
                <span className="stat-label">Ipon (plan)</span>
                <span className="stat-value">
                  {formatPHP(snap.savingsAmount)}
                </span>
              </article>
              <article className="stat">
                <span className="stat-icon">📌</span>
                <span className="stat-label">Fixed costs</span>
                <span className="stat-value">{formatPHP(snap.fixedTotal)}</span>
              </article>
            </section>

            <section className="tip-card">
              <div className="tip-head">
                <span>💡</span>
                <h2>Tip para mag-tipid</h2>
              </div>
              <p>{statusMessage(snap)}</p>
              {topTip && (
                <p className="tip-extra">
                  <strong>Pinakamalaking kategorya ngayong buwan:</strong>{' '}
                  {topTip}
                </p>
              )}
            </section>

            {totals.length > 0 && (
              <section className="panel">
                <h2>Saan napupunta ang pera</h2>
                <ul className="breakdown">
                  {totals.map(([cat, amount]) => {
                    const meta = categoryMeta(cat as Expense['category'])
                    const pct = snap.spentThisMonth
                      ? Math.round((amount / snap.spentThisMonth) * 100)
                      : 0
                    return (
                      <li key={cat}>
                        <div className="breakdown-head">
                          <span>
                            {meta.emoji} {meta.label}
                          </span>
                          <span>
                            {formatPHP(amount)} · {pct}%
                          </span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            <section className="panel">
              <div className="panel-head">
                <h2>Kamakailang gastos</h2>
                <span className="muted">{monthExpenses.length} item</span>
              </div>
              {monthExpenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p className="empty">
                    Wala pang gastos ngayong buwan. Pindutin ang button sa baba
                    kapag may binili ka.
                  </p>
                </div>
              ) : (
                <ul className="expense-list">
                  {monthExpenses.slice(0, 8).map((e) => {
                    const meta = categoryMeta(e.category)
                    return (
                      <li key={e.id} className="expense-item">
                        <div className="expense-icon">{meta.emoji}</div>
                        <div className="expense-body">
                          <p className="expense-title">
                            {e.note || meta.label}
                          </p>
                          <p className="expense-meta">
                            {e.date} · {meta.label.split(' / ')[0]}
                          </p>
                        </div>
                        <div className="expense-right">
                          <span className="expense-amount">
                            {formatPHP(e.amount)}
                          </span>
                          <button
                            type="button"
                            className="text-btn danger"
                            onClick={() => deleteExpense(e.id)}
                          >
                            Burahin
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </main>
        )}

        {tab === 'history' && (
          <main className="panel history">
            <h2>Lahat ng gastos ({monthKey})</h2>
            {monthExpenses.length === 0 ? (
              <p className="empty">Walang record para sa buwang ito.</p>
            ) : (
              <ul className="expense-list">
                {monthExpenses.map((e) => {
                  const meta = categoryMeta(e.category)
                  return (
                    <li key={e.id} className="expense-item">
                      <div className="expense-icon">{meta.emoji}</div>
                      <div className="expense-body">
                        <p className="expense-title">{e.note || meta.label}</p>
                        <p className="expense-meta">
                          {e.date} · {meta.label}
                        </p>
                      </div>
                      <div className="expense-right">
                        <span className="expense-amount">
                          {formatPHP(e.amount)}
                        </span>
                        <button
                          type="button"
                          className="text-btn danger"
                          onClick={() => deleteExpense(e.id)}
                        >
                          Burahin
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="muted footnote">
              Kategorya: {CATEGORIES.map((c) => c.emoji).join(' ')}
            </p>
          </main>
        )}

        {tab === 'settings' && (
          <SettingsPanel
            profile={data.profile}
            onSave={saveProfile}
            onReset={resetAll}
            firebaseOn={firebaseOn}
            inviteCode={inviteCode}
            onLeaveShared={firebaseOn ? leaveSharedBudget : undefined}
          />
        )}

        <button
          type="button"
          className="fab"
          aria-label="Magdagdag ng gastos"
          onClick={() => setModalOpen(true)}
        >
          +
        </button>

        <nav className="bottom-nav" aria-label="Main">
          <button
            type="button"
            className={tab === 'home' ? 'active' : ''}
            onClick={() => setTab('home')}
          >
            <span className="nav-icon">🏠</span>
            Home
          </button>
          <button
            type="button"
            className={tab === 'history' ? 'active' : ''}
            onClick={() => setTab('history')}
          >
            <span className="nav-icon">📋</span>
            History
          </button>
          <button
            type="button"
            className={tab === 'settings' ? 'active' : ''}
            onClick={() => setTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            Settings
          </button>
        </nav>

        <AddExpenseModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={addExpense}
        />

        {newInviteCode && (
          <ShareInviteModal
            code={newInviteCode}
            onClose={() => setNewInviteCode(null)}
          />
        )}
      </div>
    </div>
  )
}

export default App
