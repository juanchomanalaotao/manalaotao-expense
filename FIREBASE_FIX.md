# Ayusin ang "Missing or insufficient permissions"

Project mo: **budget-4d09f**

Kung **pati "Subukan Firebase"** ay permission denied, gawin **lahat** ng steps na ito.

---

## Step A — Firestore Rules (Publish talaga)

1. [Firebase Console](https://console.firebase.google.com/) → **budget-4d09f**
2. **Build → Firestore Database**
3. Kung wala pang database: **Create database** → location (hal. asia-southeast1) → **Production mode**
4. Tab **Rules** → delete lahat → paste mula sa `firestore.rules` sa project:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish** — dapat may **Last published** timestamp.

### Diagnostic (optional, 2 minuto)

Kung ayaw pa rin, i-publish muna ang `firestore.rules.test-open` (`if true`), subukan ang app, then ibalik ang `firestore.rules` at Publish.

| Test open rules | Result |
|-----------------|--------|
| Gumana | Rules/auth setup ang issue — gamitin ang `firestore.rules` + Anonymous |
| Ayaw pa rin | App Check o API key (Steps B–C) |

---

## Step B — Anonymous Authentication

1. **Build → Authentication**
2. Kung first time: **Get started**
3. **Sign-in method** → **Anonymous** → **Enable** → Save

Sa app dapat: **Login: Anonymous (xxxxxxxx…)**

---

## Step C — App Check (madalas ito ang hidden cause)

1. **Build → App Check**
2. Hanapin **Cloud Firestore**
3. Kung **Enforced** → i-set sa **Unenforced** (Off) habang dev

Walang App Check sa app = permission denied kapag enforced.

---

## Step D — Google Cloud API key

1. [Google Cloud Console](https://console.cloud.google.com/) → project **budget-4d09f**
2. **APIs & Services → Enabled APIs** — dapat enabled:
   - **Cloud Firestore API**
   - **Identity Toolkit API**
3. **APIs & Services → Credentials** → API key (Firebase Web)
4. **API restrictions**: either **Don't restrict** (test) o kasama ang **Cloud Firestore API**

---

## Step E — Local app

```bash
# stop server, then:
npm run dev
```

Hard refresh: **Cmd+Shift+R**

`.env` dapat:

- `VITE_FIREBASE_PROJECT_ID=budget-4d09f`
- Walang quotes sa API key (OK na sa project mo)

---

## Success

- **Subukan Firebase** → OK
- **Gumawa ng shared budget** → walang error
- Firestore **Data** tab → may `_ping` at `households`
