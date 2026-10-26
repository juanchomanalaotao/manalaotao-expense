import { FirebaseError } from 'firebase/app'
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import type { AppData, BudgetProfile } from './types'
import {
  getFirebaseDb,
  permissionDeniedHelp,
  prepareAuthForFirestore,
} from './firebase'
import { testFirebaseWrite } from './firebaseHealth'
import { loadData, newId } from './storage'

const HOUSEHOLD_ID_KEY = 'daily-expense-household-id'
const INVITE_CODE_KEY = 'daily-expense-invite-code'

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export interface HouseholdRecord {
  profile: BudgetProfile
  expenses: AppData['expenses']
  inviteCode: string
  memberIds: string[]
}

function toFirestoreSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function mapFirestoreError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === 'permission-denied') return permissionDeniedHelp()
    if (err.code === 'unauthenticated') {
      return 'Hindi naka-sign in. I-enable ang Anonymous Auth sa Firebase Console.'
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'May error sa Firebase.'
}

async function enrichPermissionError(err: unknown): Promise<Error> {
  if (err instanceof FirebaseError && err.code === 'permission-denied') {
    try {
      await testFirebaseWrite()
    } catch (inner) {
      return inner instanceof Error ? inner : new Error(permissionDeniedHelp())
    }
    return new Error(
      `${permissionDeniedHelp()} (Kakaibang error — basahin ang FIREBASE_FIX.md sa project.)`,
    )
  }
  return new Error(mapFirestoreError(err))
}

function defaultProfile(): BudgetProfile {
  return {
    monthlyIncome: 0,
    savingsPercent: 20,
    fixedCosts: [
      { id: 'rent', label: 'Upa / Bahay', amount: 0 },
      { id: 'utilities', label: 'Kuryente at tubig', amount: 0 },
    ],
    setupComplete: false,
  }
}

function parseHousehold(data: Record<string, unknown>): HouseholdRecord {
  const profile = (data.profile as BudgetProfile) ?? defaultProfile()
  const expenses = Array.isArray(data.expenses) ? data.expenses : []
  const inviteCode = String(data.inviteCode ?? '')
  const memberIds = Array.isArray(data.memberIds)
    ? (data.memberIds as string[])
    : []
  return { profile, expenses, inviteCode, memberIds }
}

export function getStoredHouseholdId() {
  return localStorage.getItem(HOUSEHOLD_ID_KEY)
}

export function getStoredInviteCode() {
  return localStorage.getItem(INVITE_CODE_KEY)
}

export function clearHouseholdSession() {
  localStorage.removeItem(HOUSEHOLD_ID_KEY)
  localStorage.removeItem(INVITE_CODE_KEY)
}

function storeHouseholdSession(householdId: string, inviteCode: string) {
  localStorage.setItem(HOUSEHOLD_ID_KEY, householdId)
  localStorage.setItem(INVITE_CODE_KEY, inviteCode)
}

function generateInviteCode() {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)]
  }
  return code
}

export async function createHousehold(
  seed: AppData = loadData(),
): Promise<{ householdId: string; inviteCode: string }> {
  const firestore = getFirebaseDb()
  if (!firestore) throw new Error('Firebase hindi naka-configure.')

  const user = await prepareAuthForFirestore()
  const uid = user.uid

  const householdId = newId()
  const inviteCode = generateInviteCode()
  const safeSeed = toFirestoreSafe(seed)

  const batch = writeBatch(firestore)
  const householdRef = doc(firestore, 'households', householdId)

  batch.set(householdRef, {
    profile: safeSeed.profile,
    expenses: safeSeed.expenses,
    inviteCode,
    memberIds: [uid],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  batch.set(doc(firestore, 'inviteCodes', inviteCode), {
    householdId,
    createdAt: serverTimestamp(),
  })

  try {
    await batch.commit()
  } catch (err) {
    throw await enrichPermissionError(err)
  }

  storeHouseholdSession(householdId, inviteCode)
  return { householdId, inviteCode }
}

export async function joinHousehold(
  rawCode: string,
): Promise<{ householdId: string; inviteCode: string }> {
  const firestore = getFirebaseDb()
  if (!firestore) throw new Error('Firebase hindi naka-configure.')

  const user = await prepareAuthForFirestore()
  const uid = user.uid

  const inviteCode = rawCode.trim().toUpperCase().replace(/\s/g, '')
  if (inviteCode.length !== 6) {
    throw new Error('Ang code ay dapat 6 na character.')
  }

  try {
    const codeSnap = await getDoc(doc(firestore, 'inviteCodes', inviteCode))
    if (!codeSnap.exists()) {
      throw new Error('Hindi mahanap ang code. I-check spelling o gumawa ng bago.')
    }

    const householdId = String(codeSnap.data().householdId ?? '')
    if (!householdId) throw new Error('Invalid invite code.')

    const householdRef = doc(firestore, 'households', householdId)
    const householdSnap = await getDoc(householdRef)
    if (!householdSnap.exists()) {
      throw new Error('Wala na ang shared budget na ito.')
    }

    const members = householdSnap.data().memberIds as string[] | undefined
    if (!members?.includes(uid)) {
      await updateDoc(householdRef, {
        memberIds: arrayUnion(uid),
        updatedAt: serverTimestamp(),
      })
    }

    storeHouseholdSession(householdId, inviteCode)
    return { householdId, inviteCode }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Ang code')) throw err
    if (err instanceof Error && err.message.startsWith('Hindi mahanap')) throw err
    if (err instanceof Error && err.message.startsWith('Wala na')) throw err
    throw await enrichPermissionError(err)
  }
}

export async function saveHouseholdData(householdId: string, data: AppData) {
  const firestore = getFirebaseDb()
  if (!firestore) return

  const user = await prepareAuthForFirestore()
  const safe = toFirestoreSafe(data)

  try {
    await updateDoc(doc(firestore, 'households', householdId), {
      profile: safe.profile,
      expenses: safe.expenses,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    })
  } catch (err) {
    throw await enrichPermissionError(err)
  }
}

export function subscribeHousehold(
  householdId: string,
  onData: (data: AppData, meta: { inviteCode: string }) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const firestore = getFirebaseDb()
  if (!firestore) {
    onError('Firebase hindi available.')
    return () => {}
  }

  void prepareAuthForFirestore().catch(() => {
    /* listener will surface auth errors */
  })

  return onSnapshot(
    doc(firestore, 'households', householdId),
    (snap) => {
      if (!snap.exists()) {
        onError('Na-delete o nawala ang shared budget.')
        return
      }
      const parsed = parseHousehold(snap.data())
      onData(
        { profile: parsed.profile, expenses: parsed.expenses },
        { inviteCode: parsed.inviteCode },
      )
    },
    (err) => onError(mapFirestoreError(err)),
  )
}

export { testFirebaseWrite } from './firebaseHealth'
