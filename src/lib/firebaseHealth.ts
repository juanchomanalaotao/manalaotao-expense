import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  getFirebaseDb,
  getProjectId,
  permissionDeniedHelp,
  prepareAuthForFirestore,
} from './firebase'

export async function testFirebaseWrite(): Promise<{
  projectId: string
  uid: string
  tokenOk: boolean
}> {
  const user = await prepareAuthForFirestore()
  const token = await user.getIdToken()
  const tokenOk = token.length > 20

  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore hindi naka-init.')

  try {
    await setDoc(
      doc(db, '_ping', user.uid),
      { ok: true, checkedAt: serverTimestamp() },
      { merge: true },
    )
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: string }).code)
        : ''
    if (code === 'permission-denied') {
      throw new Error(
        `${permissionDeniedHelp()} ` +
          `(Naka-login ka na UID ${user.uid.slice(0, 8)}… — problema sa Rules / App Check / API key, hindi sa app code.)`,
      )
    }
    throw err
  }

  return { projectId: getProjectId(), uid: user.uid, tokenOk }
}
