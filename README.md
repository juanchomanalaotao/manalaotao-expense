# Budget sa Bahay — Daily Expense

**Daily expense tracker** para sa home budget — may **Firebase sync** para pareho kayo ng asawa ng budget at gastos sa dalawang phone.

## Features

- Budget base sa buwanang kita, fixed costs, at target ipon
- **Daily allowance** — alam mo magkano pwede gastusin ngayong araw
- **Shared budget** — 6-digit invite code, real-time sync sa Firestore

## Paano patakbuhin (local)

```bash
npm install --legacy-peer-deps
npm run dev
```

Walang `.env`? Gagana pa rin sa **localStorage** lang (isang device).

## Firebase setup (para mag-sync kayo ng asawa)

### 1. Gumawa ng Firebase project

1. [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. **Build → Firestore Database** → Create database (production mode OK muna)
3. **Build → Authentication** → **Sign-in method** → i-enable ang **Anonymous**
4. **Project settings → General** → **Your apps** → Web (`</>`) → kopyahin ang config

### 2. `.env` sa project

```bash
cp .env.example .env
```

Ilagay ang values mula sa Firebase web config (`apiKey`, `authDomain`, `projectId`, `appId`, `messagingSenderId`).

Restart ang dev server pagkatapos mag-save ng `.env`.

### 3. Firestore rules

Sa Firebase Console → Firestore → **Rules**, i-paste ang laman ng `firestore.rules`, o i-deploy gamit ang Firebase CLI.

### 4. Gamitin ng mag-asawa

| Ikaw (una) | Asawa |
|------------|--------|
| Buksan app → **Gumawa ng shared budget** | **May code na ako** |
| Kopyahin ang **6-digit code** (Settings din pwede) | Ilagay ang code |
| Mag-setup ng kita | Automatic sync — parehong data |

Kapag nagdagdag ng gastos ang isa, makikita ng isa pag **Live sync** sa header.

## Logic

- **Spending budget** = Kita − Fixed costs − (Kita × % ipon)
- **Daily allowance** = Natitirang budget ÷ araw na natitira sa buwan

## Build

```bash
npm run build
npm run preview
```

**Note:** Huwag i-commit ang `.env` — naka-gitignore na.

## Deploy sa Vercel

### Paraan 1 — GitHub (recommended)

1. **I-push ang project sa GitHub** (private repo OK).
2. [vercel.com](https://vercel.com) → **Add New → Project** → import ang repo.
3. Vercel auto-detect **Vite**. Huwag baguhin kung ganito:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables** → idagdag (copy mula sa local `.env`):

   | Name | Halaga |
   |------|--------|
   | `VITE_FIREBASE_API_KEY` | … |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `budget-4d09f.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `budget-4d09f` |
   | `VITE_FIREBASE_APP_ID` | … |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `329317043165` |

   Lagyan ng check ang **Production** (at **Preview** kung gusto mo).

5. **Deploy**. Makakakuha ka ng URL tulad ng `https://daily-expense-xxx.vercel.app`.

6. **Firebase — authorized domain** (kailangan para gumana ang login sa live site):
   - Firebase Console → **Authentication** → **Settings** → **Authorized domains**
   - **Add domain** → ilagay ang Vercel URL (hal. `daily-expense-xxx.vercel.app`)
   - Naka-list na dapat ang `localhost`; idagdag ang custom domain kung mayroon.

7. Buksan ang Vercel URL sa phone ng asawa — parehong **invite code** flow.

### Paraan 2 — Vercel CLI

```bash
npm i -g vercel
cd /path/to/daily-expense
vercel login
vercel
# sundin ang prompts; unang deploy = preview

vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID

vercel --prod
```

Pagkatapos, i-add ang production URL sa Firebase **Authorized domains**.

### Paalala

- Ang `VITE_*` variables ay **naka-bake sa build** — kapag nagbago ang `.env`, **Redeploy** sa Vercel.
- Huwag i-upload ang `.env` sa GitHub; gamitin lang ang Vercel Environment Variables.
- May `vercel.json` at `.npmrc` na ang project para stable ang install/build sa Vercel.
