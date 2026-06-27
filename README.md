# LawLens

**AI-Powered Legal Research Platform**

LawLens is a production-ready, AI-powered legal research application that uses Retrieval-Augmented Generation (RAG) to provide accurate, sourced answers from legal documents. Built with Node.js, Express, and Groq AI.

## Features

- **AI Chat** - Natural language legal research with source citations
- **Constitution Viewer** - Browse, search, and explore legal articles
- **Document Upload** - Upload PDF, DOCX, TXT, JSON, and Markdown files
- **Semantic Search** - Hybrid keyword + semantic search across all documents
- **User Accounts** - JWT authentication, profiles, and preferences
- **Bookmarks** - Save and organize important legal articles
- **History** - Track conversations and searches
- **Admin Panel** - Manage users, datasets, prompts, and system settings
- **Dark/Light Mode** - Professional theme support

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **AI**: Groq API (Llama 3.3 70B)
- **RAG**: Custom vector store with TF-IDF style embeddings
- **Database**: JSON file-based storage
- **Auth**: JWT with bcrypt password hashing

## Project Structure

```
LawLens/
├── frontend/
│   ├── index.html          # Landing page
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── dashboard.html      # User dashboard
│   ├── chat.html           # AI chat interface
│   ├── search.html         # Document search
│   ├── bookmarks.html      # Saved articles
│   ├── history.html        # Activity history
│   ├── article.html        # Article viewer
│   ├── profile.html        # User profile
│   ├── settings.html       # User settings
│   ├── admin.html          # Admin panel
│   ├── 404.html            # Not found page
│   ├── css/
│   │   ├── style.css       # Main styles + dark/light mode
│   │   ├── auth.css        # Authentication styles
│   │   ├── chat.css        # Chat interface styles
│   │   ├── dashboard.css   # Dashboard styles
│   │   └── admin.css       # Admin panel styles
│   └── js/
│       ├── utils.js        # Utility functions
│       ├── app.js          # Main application logic
│       ├── auth.js         # Authentication handling
│       ├── chat.js         # Chat functionality
│       ├── search.js       # Search functionality
│       ├── dashboard.js    # Dashboard logic
│       ├── profile.js      # Profile management
│       ├── settings.js     # Settings management
│       ├── admin.js        # Admin panel logic
│       ├── bookmarks.js    # Bookmarks management
│       ├── history.js      # History viewing
│       └── article.js      # Article viewer logic
├── backend/
│   ├── server.js           # Express server entry point
│   ├── package.json        # Dependencies
│   ├── .env.example        # Environment variables template
│   ├── routes/             # API route definitions
│   ├── controllers/        # Route handlers
│   ├── middleware/          # Auth, upload, rate limiter
│   ├── rag/                # RAG pipeline components
│   │   ├── embeddings.js   # Text embedding generation
│   │   ├── vectorStore.js  # Vector database management
│   │   ├── documentProcessor.js # Document parsing & chunking
│   │   ├── retriever.js    # Document retrieval logic
│   │   ├── generator.js    # Groq AI integration
│   │   └── promptEditor.js # System prompt management
│   ├── database/           # JSON file-based storage
│   ├── data/               # Legal documents directory
│   ├── uploads/            # Uploaded files directory
│   ├── vector/             # Vector index storage
│   └── scripts/
│       └── rebuildVector.js # Vector DB rebuild script
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+ 
- A Groq API key (get one at https://console.groq.com)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lawlense.git
   cd lawlense
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your `GROQ_API_KEY` and a secure `JWT_SECRET`.

4. Add legal documents:
   Place your legal documents (PDF, DOCX, TXT, JSON, MD) in `backend/data/`

5. Build the vector database:
   ```bash
   npm run rebuild-vector
   ```

6. Start the server:
   ```bash
   npm start
   ```

7. Access the application at `http://localhost:3000`

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/profile` | Get user profile (auth required) |
| PUT | `/api/auth/profile` | Update user profile (auth required) |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send a chat message (optional auth) |
| GET | `/api/chat/conversations` | List conversations (auth required) |
| GET | `/api/chat/conversations/:id` | Get conversation details |
| DELETE | `/api/chat/conversations/:id` | Delete conversation |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Search documents |
| GET | `/api/search/suggestions?query=` | Get search suggestions |
| GET | `/api/search/recent` | Recent searches (auth required) |
| DELETE | `/api/search/clear` | Clear search history |

### Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload document (auth required) |
| GET | `/api/upload/status` | Upload status |

### Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles/:id` | Get article by ID |
| GET | `/api/articles/:id/related` | Get related articles |
| GET | `/api/articles/:id/explain` | Get AI explanation |

### Bookmarks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks` | List bookmarks (auth required) |
| POST | `/api/bookmarks` | Add bookmark |
| PUT | `/api/bookmarks/:id` | Update bookmark |
| DELETE | `/api/bookmarks/:id` | Remove bookmark |

### History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | Get user history (auth required) |
| DELETE | `/api/history/clear` | Clear all history |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Admin stats (admin only) |
| GET | `/api/admin/users` | List users |
| DELETE | `/api/admin/users/:id` | Delete user |
| POST | `/api/admin/rebuild-vector` | Rebuild vector DB |
| GET | `/api/admin/logs` | View server logs |
| GET | `/api/admin/metrics` | API metrics |
| GET | `/api/admin/prompt` | Get system prompt |
| PUT | `/api/admin/prompt` | Update system prompt |
| POST | `/api/admin/prompt/reset` | Reset prompt to default |
| POST | `/api/admin/upload-dataset` | Upload dataset |

## AI Rules

LawLens enforces strict AI behavior:

- **Never hallucinate** - AI never answers from memory
- **Never invent laws** - Only uses retrieved context
- **Always cite sources** - Every answer references legal documents
- **Explain simply** - Legal concepts in plain language
- **No legal advice** - Personalized advice is never given

If the AI cannot find relevant information in the legal database, it responds: "I couldn't find relevant information in the current legal database."

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- Rate limiting on all API endpoints
- File upload validation (type and size limits)
- Helmet security headers
- Environment variables for sensitive config
- Admin endpoints protected by role-based access

## Development

```bash
# Start in watch mode (auto-restart on changes)
npm run dev

# Rebuild vector database
npm run rebuild-vector
```

## Adding Legal Documents

1. Place files in `backend/data/`
2. Run `npm run rebuild-vector`
3. The system automatically reads, chunks, and indexes all documents

Supported formats: PDF, TXT, DOCX, JSON, Markdown

## Docker Support

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Then build and run:
```bash
docker build -t lawlense .
docker run -p 3000:3000 lawlense
```

## License

MIT
