import { useState } from 'react'
import '../App.css'

type Props = {
  onCreate: () => Promise<void>
  onJoin: (code: string) => Promise<void>
  busy: boolean
}

export function HouseholdGate({ onCreate, onJoin, busy }: Props) {
  const [mode, setMode] = useState<'choose' | 'join'>('choose')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setError(null)
    setLoading(true)
    try {
      await onCreate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'May error sa pag-gawa.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onJoin(code)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hindi makasali.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-page">
      <div className="app-bg" aria-hidden />
      <div className="setup">
        <div className="setup-hero">
          <div className="setup-hero-icon" aria-hidden>
            👫
          </div>
          <p className="eyebrow">Firebase sync</p>
          <h1
            style={{
              margin: '0.25rem 0 0',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            Share your Budget with your Partner
          </h1>
        </div>

        <div className="setup-card">
          {mode === 'choose' ? (
            <>
              <h2 className="setup-card-title">Parehong budget, dalawang phone</h2>
              <p className="lead">
                Ang isa sa inyo ang gagawa ng shared budget at magbibigay ng code.
                Ang isa naman ay sasali gamit ang code na iyon.
              </p>
              {error && <p className="form-error">{error}</p>}
              <button
                type="button"
                className="btn primary full"
                disabled={loading || busy}
                onClick={handleCreate}
              >
                {loading ? 'Ginagawa…' : 'Gumawa ng shared budget ( ako )'}
              </button>
              <button
                type="button"
                className="btn ghost full"
                disabled={loading || busy}
                onClick={() => setMode('join')}
              >
                May code na ako — sasali ako
              </button>
            </>
          ) : (
            <form onSubmit={handleJoin}>
              <h2 className="setup-card-title">Ilagay ang 6-digit code</h2>
              <p className="lead">Galing sa asawa mo na gumawa ng shared budget.</p>
              <label className="field">
                <span>Invite code</span>
                <input
                  type="text"
                  maxLength={6}
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="Hal. K7M2P4"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button
                type="submit"
                className="btn primary full"
                disabled={loading || busy || code.length < 6}
              >
                {loading ? 'Sumasali…' : 'Sumali sa budget'}
              </button>
              <button
                type="button"
                className="text-btn center-btn"
                onClick={() => {
                  setMode('choose')
                  setError(null)
                }}
              >
                ← Bumalik
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
