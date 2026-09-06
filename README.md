# LawLens

**AI-Powered Legal Research Platform for Indian Law**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Hosting-orange.svg)](https://firebase.google.com/)

LawLens is a web application for researching Indian law. It uses Retrieval-Augmented Generation (RAG) to answer questions with responses grounded in a curated corpus of legal documents, and every answer carries source citations.

**Live Frontend:** [lawlens.web.app](https://lawlens.web.app)
**Backend API:** `https://lawlens-p15c.onrender.com` (Render — currently suspended)

---

## Features

- **AI Chat** — Natural-language legal research with per-fact source citations and citation checks
- **Search** — Hybrid keyword + semantic search (local corpus) with optional web mode
- **Constitution Viewer** — Browse and explore the Constitution of India
- **Timeline** — Landmark Supreme Court cases
- **Document Upload** — PDF, DOCX, TXT, JSON, and Markdown; per-account library
- **Bookmarks, History, Workspaces** — Per-account research data
- **Admin Panel** — Users, datasets, vector rebuild, system prompt, logs, analytics
- **Multilingual** — Rebut in the same language the user writes in (23 Indian languages)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+), Firebase Hosting |
| Backend | Node.js, Express.js |
| AI | Groq API (Llama 3.3 70B) |
| RAG | Custom vector store with TF-IDF embeddings + reranker |
| Authentication | Firebase Authentication (ID token verification server-side) |
| Data store | Cloud Firestore (primary) or JSON file engine (local dev) |
| Storage | Firebase Storage (planned) / local disk uploads |
| CI | GitHub Actions (`npm test`, frontend checks) |

## Project Structure

```
LawLens/
├── frontend/                 # Static frontend (Firebase Hosting)
│   ├── *.html                # Page routes
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client-side modules
│   ├── sw.js                 # Service worker
│   └── firebase.json         # Hosting config + security headers
├── backend/                  # Express API server
│   ├── server.js             # Entry point
│   ├── routes/               # API routes
│   ├── controllers/          # Route handlers
│   ├── middleware/            # Auth (Firebase), upload, rate limiting
│   ├── rag/                  # RAG pipeline (embeddings, retrieval, generation)
│   ├── knowledge/            # Legal knowledge OS (admin-only API)
│   ├── database/             # db.js engine selector + engines
│   ├── data/                 # Legal documents (vector corpus)
│   └── uploads/              # User uploads (local engine)
├── firestore.rules           # Firestore security rules
├── storage.rules             # Firebase Storage security rules
├── Dockerfile                # Backend container
├── docker-compose.yml        # Local orchestration
├── render.yaml               # Render deployment config
└── backend/.env.example      # Environment template
```

## Quick Start

### Prerequisites

- Node.js 20+
- A Google Cloud / Firebase project
- GROQ API key — [console.groq.com](https://console.groq.com)

### Backend (local)

```bash
cd backend
cp .env.example .env
# Fill in GROQ_API_KEY plus the Firebase project values.
# Firebase auth requires a service account:
#   Firebase Console → Project Settings → Service Accounts → Generate new private key
#   Paste the whole JSON as FIREBASE_SERVICE_ACCOUNT (single line, escaped).
npm install          # also rebuilds the vector index from backend/data
npm test             # run the test suite
npm run rebuild-vector
npm start            # http://localhost:3000
```

Without `FIREBASE_SERVICE_ACCOUNT`, the server runs in JSON-storage mode and
auth endpoints return `AUTH_UNAVAILABLE` (no Google auth). Set
`DB_ENGINE=json` to force the JSON engine even when Firebase credentials exist.

### Frontend (local)

Open `frontend/index.html` in a browser. Requests to `/api` proxy to
`localhost:3000` when running on `localhost`.

## Authentication (Firebase-first)

- The frontend signs the user in with the Firebase JS SDK (`google`, Google popup).
- It sends the resulting ID token as `Authorization: Bearer <idToken>` to
  `/api/auth/login` (and `/register`, `/google`).
- The backend verifies the token with the Firebase Admin SDK
  (`admin.auth().verifyIdToken`) — **no passwords, no JWTs, no client-trusted
  roles.** The Firebase UID is the stable identity (`req.user.id`).
- Role (e.g. `admin`) is read server-side from the user record only.

## Admin bootstrap

```bash
cd backend
# Get your UID from Firebase Console → Authentication → Users.
# Then (once) set in backend/.env:
ADMIN_FIREBASE_UID=your-firebase-uid
ADMIN_EMAIL=you@example.com
npm run seed
```

## Firestore

The backend prefers Cloud Firestore when Firebase Admin is initialized. The
JSON engine is the zero-config fallback and interfaces are identical, so
controllers do not switch code paths.

```bash
# One-time migration from JSON files in backend/database/*.json:
cd backend
npm run migrate
```

### Deploy rules (Firebase CLI)

```bash
firebase deploy --only firestore:rules     # uses ./firestore.rules
firebase deploy --only storage             # uses ./storage.rules
```

Rules are locked down by default: per-user documents are owner-only, admin
collections have no client access, and the server uses the Admin SDK (which
bypasses rules). See `firebase.json`, `firestore.rules`, `storage.rules`.

## Tests

```bash
cd backend && npm test
```

Covers: validation schemas, embeddings (cosine similarity), reranker ordering,
citation helpers, retriever context formatting, vector store hybrid search,
provider factory, repositories, and the knowledge graph. CI runs the same
suite via `.github/workflows/ci.yml` and verifies SEO one-ways in the frontend.

## Deployment

### Frontend (Firebase Hosting)

```bash
cd frontend
firebase deploy --only hosting:lawlens
```

2 Valid targets exist: `lawlens` and `lawlens-f0ebc` (see `frontend/.firebaserc`).
Both rewrite all routes to `index.html` and serve the service worker with
`no-cache`.

### Backend (Render)

`render.yaml` defines the service. **The production backend is currently
suspended** (HTTP 503) — resume it in the Render dashboard and set these env
vars in Render:

- `GROQ_API_KEY` — sync secret
- `FIREBASE_SERVICE_ACCOUNT` — sync secret (full service-account JSON)
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
  `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`

> Note: the free Render tier is re-suspended when provisions are exhausted.
> The frontend hard-codes `https://lawlens-p15c.onrender.com/api` for
> non-localhost — update `frontend/js/utils.js` `API_BASE` if the URL changes.

## Security

- Firebase ID token verification on every protected route (no JWTs/bcrypt)
- Admin-only `/api/knowledge/*` and `/api/admin/*` endpoints
- Authenticated `/api/upload/*`; per-account document ownership checks
- CORS origin whitelist; Helmet security headers
- Rate limiting; file type + size validation; sanitized filenames
- Locked-down Firestore & Storage rules; `noindex` on all auth-gated pages
- `sw.js` never caches `/api/` traffic; static assets cached briefly

## Environment Variables

See `backend/.env.example`. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key for AI |
| `FIREBASE_SERVICE_ACCOUNT` | For auth | Full service-account JSON (single quoted line) |
| `FIREBASE_*` | Yes (client) | Firebase client config, served at `/api/config/firebase` |
| `ADMIN_FIREBASE_UID` | For admin | UID of the admin user (used by `npm run seed`) |
| `CORS_ORIGIN` | No | Comma-separated allowed origins |
| `DB_ENGINE` | No | Force `json` engine in local dev |
| `PORT` / `VECTOR_DB_PATH` / `UPLOAD_DIR` / `DB_PATH` | No | Runtime tuning |

## Accuracy & Limitations

LawLens is a research aid, **not legal advice**. The corpus is a curated
subset of official texts, answers are AI-generated, and multilingual output is
AI-translated. Always verify against primary sources — India Code
(indiacode.nic.in), official gazettes, or the courts.

## License

MIT © Aditya Parmar