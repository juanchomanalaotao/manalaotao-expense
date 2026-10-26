import { useState } from 'react'
import { testFirebaseWrite } from '../lib/household'
import '../App.css'

type Props = {
  onCreate: () => Promise<void>
  onJoin: (code: string) => Promise<void>
  busy: boolean
  projectId: string
  uid: string | null
}

export function HouseholdGate({
  onCreate,
  onJoin,
  busy,
  projectId,
  uid,
}: Props) {
  const [mode, setMode] = useState<'choose' | 'join'>('choose')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [testOk, setTestOk] = useState<string | null>(null)

  async function handleCreate() {
    setError(null)
    setTestOk(null)
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
    setTestOk(null)
    setLoading(true)
    try {
      await onJoin(code)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hindi makasali.')
    } finally {
      setLoading(false)
    }
  }

  async function handleTestFirebase() {
    setError(null)
    setTestOk(null)
    setLoading(true)
    try {
      const r = await testFirebaseWrite()
      setTestOk(`OK — project ${r.projectId}, user ${r.uid.slice(0, 8)}…`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test failed.')
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
            I-share sa asawa
          </h1>
        </div>

        <div className="setup-card">
          <div className="firebase-debug">
            <p className="hint">
              <strong>Project:</strong> {projectId || '(walang .env)'}
              <br />
              <strong>Login:</strong>{' '}
              {uid ? `Anonymous (${uid.slice(0, 8)}…)` : busy ? 'Kumokonekta…' : 'Hindi pa'}
            </p>
            <button
              type="button"
              className="btn ghost full"
              disabled={loading || busy}
              onClick={handleTestFirebase}
            >
              Subukan Firebase (test write)
            </button>
            {testOk && <p className="hint ok-text">{testOk}</p>}
            <p className="hint">
              Kung permission denied pa rin, buksan ang{' '}
              <strong>FIREBASE_FIX.md</strong> sa project folder (App Check + Rules
              Publish).
            </p>
          </div>

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
