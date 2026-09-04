# LawLens

**AI-Powered Legal Research Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange.svg)](https://firebase.google.com/)

LawLens is a production-ready, AI-powered legal research platform that uses Retrieval-Augmented Generation (RAG) to provide accurate, sourced answers from Indian legal documents.

**Live Frontend:** [lawlens.web.app](https://lawlens.web.app)

---

## Features

- **AI Chat** — Natural language legal research with source citations
- **Constitution Viewer** — Browse, search, and explore legal articles
- **Document Upload** — PDF, DOCX, TXT, JSON, and Markdown support
- **Semantic Search** — Hybrid keyword + semantic search across all documents
- **User Accounts** — JWT authentication, profiles, and preferences
- **Bookmarks** — Save and organize important legal articles
- **History** — Track conversations and searches
- **Admin Panel** — Manage users, datasets, prompts, and system settings
- **Dark/Light Mode** — Professional theme support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Backend | Node.js, Express.js |
| AI | Groq API (Llama 3.3 70B) |
| RAG | Custom vector store with TF-IDF embeddings |
| Database | JSON file-based storage |
| Auth | JWT + bcrypt |
| Hosting | Firebase (frontend), Docker (backend) |
| CI/CD | Render (backend deployment) |

## Project Structure

```
LawLens/
├── frontend/                 # Static frontend (Firebase Hosting)
│   ├── *.html                # Page routes
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client-side modules
│   └── firebase.json         # Firebase config
├── backend/                  # Express API server
│   ├── server.js             # Entry point
│   ├── routes/               # API routes
│   ├── controllers/          # Route handlers
│   ├── middleware/            # Auth, upload, rate limiting
│   ├── rag/                  # RAG pipeline (embeddings, retrieval, generation)
│   ├── knowledge/            # Legal knowledge OS
│   ├── database/             # JSON file storage
│   ├── data/                 # Legal documents
│   └── uploads/              # User uploads
├── Dockerfile                # Backend container
├── docker-compose.yml        # Local orchestration
├── render.yaml               # Render deployment config
└── .env.example              # Environment template
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional)
- Groq API key — [Get one here](https://console.groq.com)

### Local Development

```bash
# Clone
git clone https://github.com/adityae547549/LawLens.git
cd LawLens

# Backend setup
cd backend
cp .env.example .env    # Add your GROQ_API_KEY and JWT_SECRET
npm install
npm run rebuild-vector  # Build vector DB from legal docs
npm start               # Server runs on http://localhost:3000

# Frontend — open frontend/index.html in browser
# Or serve with any static server
```

### Docker

```bash
docker-compose up -d --build
# Frontend: open frontend/index.html
# Backend: http://localhost:3000
```

### Deploy to Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo — Render auto-detects `render.yaml`
4. Add env var: `GROQ_API_KEY`
5. Deploy

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message |
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/chat/conversations/:id` | Get conversation |
| DELETE | `/api/chat/conversations/:id` | Delete conversation |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Search documents |
| GET | `/api/search/suggestions` | Get suggestions |
| GET | `/api/search/recent` | Recent searches |

### Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles/:id` | Get article |
| GET | `/api/articles/:id/related` | Related articles |
| GET | `/api/articles/:id/explain` | AI explanation |

### Bookmarks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks` | List bookmarks |
| POST | `/api/bookmarks` | Add bookmark |
| DELETE | `/api/bookmarks/:id` | Remove bookmark |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/rebuild-vector` | Rebuild vector DB |
| GET | `/api/admin/prompt` | Get system prompt |
| PUT | `/api/admin/prompt` | Update system prompt |

## AI Behavior

- **Never hallucinates** — Only uses retrieved context
- **Never invents laws** — Strictly from legal documents
- **Always cites sources** — Every answer references documents
- **Explains simply** — Legal concepts in plain language
- **No legal advice** — Never provides personalized legal counsel

## Security

- bcrypt password hashing (12 rounds)
- JWT with configurable expiration
- Rate limiting on all endpoints
- File upload validation (type + size)
- Helmet security headers
- CORS origin whitelist
- Admin role-based access control
- Path traversal protection

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key for AI |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `NODE_ENV` | No | `production` or `development` |
| `PORT` | No | Server port (default: 3000) |
| `CORS_ORIGIN` | No | Allowed origins (default: `*`) |
| `DB_PATH` | No | Database directory |
| `UPLOAD_DIR` | No | Upload directory |

## License

MIT © Aditya Parmar
