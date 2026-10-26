import { onAuthStateChanged } from 'firebase/auth'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ensureSignedIn,
  getFirebaseAuth,
  getProjectId,
  isFirebaseConfigured,
  permissionDeniedHelp,
} from '../lib/firebase'
import {
  clearHouseholdSession,
  createHousehold,
  getStoredHouseholdId,
  getStoredInviteCode,
  joinHousehold,
  saveHouseholdData,
  subscribeHousehold,
} from '../lib/household'
import { loadData, saveData } from '../lib/storage'
import type { AppData } from '../lib/types'

export type SyncStatus =
  | 'loading'
  | 'local-only'
  | 'need-household'
  | 'synced'
  | 'error'

export function useSharedBudget() {
  const firebaseOn = isFirebaseConfigured()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    firebaseOn ? 'loading' : 'local-only',
  )
  const [uid, setUid] = useState<string | null>(null)
  const [householdId, setHouseholdId] = useState<string | null>(() =>
    firebaseOn ? getStoredHouseholdId() : null,
  )
  const [inviteCode, setInviteCode] = useState<string | null>(() =>
    firebaseOn ? getStoredInviteCode() : null,
  )
  const [data, setData] = useState<AppData>(() => loadData())
  const [syncError, setSyncError] = useState<string | null>(null)
  const writingRef = useRef(false)

  useEffect(() => {
    if (!firebaseOn) return

    const auth = getFirebaseAuth()
    if (!auth) {
      setSyncStatus('local-only')
      return
    }

    let cancelled = false

    ensureSignedIn()
      .then((user) => {
        if (!cancelled) setUid(user.uid)
      })
      .catch(() => {
        if (!cancelled) {
          setSyncError(
            'Hindi makapag-sign in. Firebase Console → Authentication → Anonymous → Enable.',
          )
          setSyncStatus('error')
        }
      })

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid)
    })

    return () => {
      cancelled = true
      unsubAuth()
    }
  }, [firebaseOn])

  useEffect(() => {
    if (!firebaseOn || !uid) return

    if (!householdId) {
      setSyncStatus('need-household')
      return
    }

    setSyncStatus('loading')
    const unsub = subscribeHousehold(
      householdId,
      (remote, meta) => {
        if (writingRef.current) return
        setData(remote)
        saveData(remote)
        setInviteCode(meta.inviteCode)
        setSyncError(null)
        setSyncStatus('synced')
      },
      (message) => {
        setSyncError(message)
        setSyncStatus('error')
      },
    )

    return () => unsub()
  }, [firebaseOn, uid, householdId])

  const persist = useCallback(
    async (next: AppData) => {
      setData(next)
      saveData(next)

      if (!firebaseOn || !householdId) return

      writingRef.current = true
      try {
        await saveHouseholdData(householdId, next)
        setSyncError(null)
        setSyncStatus('synced')
      } catch (err) {
        setSyncError(
          err instanceof Error ? err.message : permissionDeniedHelp(),
        )
        setSyncStatus('error')
      } finally {
        writingRef.current = false
      }
    },
    [firebaseOn, householdId],
  )

  const handleCreateHousehold = useCallback(async () => {
    await ensureSignedIn()
    const result = await createHousehold(loadData())
    setHouseholdId(result.householdId)
    setInviteCode(result.inviteCode)
    setSyncStatus('loading')
    setSyncError(null)
    return result
  }, [])

  const handleJoinHousehold = useCallback(async (code: string) => {
    await ensureSignedIn()
    const result = await joinHousehold(code)
    setHouseholdId(result.householdId)
    setInviteCode(result.inviteCode)
    setSyncStatus('loading')
    setSyncError(null)
    return result
  }, [])

  const leaveSharedBudget = useCallback(() => {
    clearHouseholdSession()
    setHouseholdId(null)
    setInviteCode(null)
    if (firebaseOn) setSyncStatus('need-household')
  }, [firebaseOn])

  return {
    data,
    persist,
    syncStatus,
    syncError,
    firebaseOn,
    firebaseProjectId: getProjectId(),
    inviteCode,
    householdId,
    uid,
    createHousehold: handleCreateHousehold,
    joinHousehold: handleJoinHousehold,
    leaveSharedBudget,
    authReady: !firebaseOn || uid !== null,
  }
}
