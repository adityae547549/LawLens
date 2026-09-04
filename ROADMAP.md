# LawLens — Trust & Depth Roadmap

**Goal:** Transform LawLens from a "legal chatbot" into a trustworthy legal-research platform.

**Current State:** MVP with AI chat, search, bookmarks, admin panel. Backend on Render, frontend on Firebase.

**Audit Date:** September 4, 2026

---

## Current State Assessment

### What Works
- RAG pipeline with hybrid search (BM25 + TF-IDF + N-gram)
- 15 indexed legal acts (IPC, BNS, BNSS, BSA, Constitution, Contract Act, etc.)
- Knowledge graph with 594 nodes, 886 edges
- Synonym engine with 463 terms
- JWT auth with Google OAuth
- Admin panel with user/dataset/prompt management
- Docker + Render deployment
- Self-ping keepalive

### What's Broken or Missing

| Area | Status | Severity |
|------|--------|----------|
| Cosine similarity bug (dot product wrong) | `vecA * vecA` instead of `vecA * vecB` | Critical |
| Legal graph `query()` method missing | Retriever calls undefined method | Critical |
| JSON file database | No concurrent access, no indexing, full-file reads | Critical |
| Uploads ephemeral | Lost on every Render deploy | Critical |
| Citation accuracy | 30-32% (only string-match check) | High |
| Recall | 49% (nearly half of relevant results missed) | High |
| Hallucination rate | 13% | High |
| Inline citations not clickable | Decorative `[Source N]` tags | High |
| No neural reranker | Hand-crafted feature scorer | High |
| No answer-level evaluation | Only retrieval benchmarked, never generated answers | High |
| No version-aware legal data | Legal Time Machine exists but versions/ dir is empty | High |
| No subordinate legislation | Only Acts indexed, no Rules/Regulations/Circulars | High |
| Only 6 landmark cases | No High Court, tribunal, or case-law digests | High |
| In-memory rate limiter | Doesn't work across instances | Medium |
| No token refresh/revocation | Stolen JWT valid until expiry | Medium |
| No log rotation | Single growing log file | Medium |
| No uncaughtException handler | Process crashes without cleanup | Medium |

---

## Phase 1: Fix AI Claims + Retrieval Quality

**Priority:** Critical — foundational for everything else
**Timeline:** 1-2 weeks

### 1.1 Fix Cosine Similarity Bug
**File:** `backend/rag/embeddings.js:109`
```javascript
// BUG: dotProduct += vecA[i] * vecA[i]
// FIX: dotProduct += vecA[i] * vecB[i]
```
This single bug has been corrupting all similarity scores since day one.

### 1.2 Fix Legal Graph Query Method
**File:** `backend/knowledge/graph/legalKnowledgeGraph.js`
The `query()` method is called by `retriever.js` but doesn't exist in the graph class. Implement it or remove the dead code path.

### 1.3 Replace "Never Hallucinate" Language
**Files:** `backend/rag/promptEditor.js`, frontend UI
- Replace with: "LawLens retrieves answers from indexed legal documents. If relevant sources aren't found, it will say so."
- Add visible disclaimer: "This is AI-assisted research, not legal advice."

### 1.4 Add Confidence/Coverage Indicator
**Files:** `backend/rag/retriever.js`, `backend/rag/generator.js`
- Show per-answer: "Based on 5 sources (3 high-confidence, 2 medium)"
- Show when coverage is low: "Limited sources found for this question"

### 1.5 Make Citations Clickable + Show Source Passages
**Files:** `frontend/js/chat.js`, `backend/controllers/chatController.js`
- Inline `[Source N]` tags → clickable chips that open a popover/modal with the exact source passage
- Show: source text, act name, section number, trust level
- No page navigation needed — inline expansion

### 1.6 Run Benchmark, Record Baseline
Run the existing 10-query benchmark and record actual metrics as baseline.

---

## Phase 2: Upgrade Legal Knowledge Base

**Priority:** High — core value proposition
**Timeline:** 2-4 weeks

### 2.1 Expand Indexed Acts
**Current:** 15 acts
**Target:** 30+ acts

Missing high-value acts:
- Indian Contract Act (already have data, verify completeness)
- Transfer of Property Act
- Specific Relief Act
- Limitation Act
- Hindu Marriage Act
- Muslim Personal Law
- Industrial Disputes Act
- Shops and Establishments Acts (sample state)
- Indian Stamp Act
- Arbitration and Conciliation Act

### 2.2 Add Subordinate Legislation
**Currently missing entirely.** Add:
- CPC Rules
- CrPC/BNSS Rules
- Evidence Act/BSA Rules
- State-specific rules (sample)

### 2.3 Make Data Version-Aware
**Files:** `backend/knowledge/legalKnowledgeOS.js`, `backend/knowledge/legalTimeMachine.js`

The infrastructure exists but is unused. Activate it:
- Add `effectiveDate` and `repealedDate` to each section
- Populate `data/versions/` with amendment history
- Enable Legal Time Machine: "What was the law on date X?"
- Track: Act enacted → amended by → replaced by → struck down

### 2.4 Add Amendment-Level History Per Act
**Currently:** Only Constitutional Amendments (86 entries)
**Need:** Per-act amendment tracking
- IPC Section 302 amended by XYZ Act of 1991
- Consumer Protection Act 2019 replaced Consumer Protection Act 1986
- Section 66A IT Act struck down by Shreya Singhal (2015)

### 2.5 Ingest from India Code API
**Source:** `indiacode.nic.in` (already registered in source tracker)
- Pull current text of all central acts
- Track amendments and updates
- Scheduled sync (daily/weekly)

### 2.6 Structure Constitution as JSON
**Currently:** PDF only (`constitution_of_india.pdf`)
**Need:** Article-by-article JSON with:
- Article number, title, full text
- Parts (III, IV, etc.)
- Amendments affecting each article
- Landmark cases interpreting each article

---

## Phase 3: Add Case-Law Intelligence

**Priority:** High — highest-value new feature
**Timeline:** 3-4 weeks

### 3.1 Build Case-Law Database
**Currently:** Only 6 landmark Supreme Court cases
**Need:**

| Source | Coverage |
|--------|----------|
| Supreme Court judgments | 500+ landmark cases |
| High Court judgments | 100+ per major HC |
| Constitutional bench decisions | All available |
| Overruled/REFERRED cases | Track lineage |

### 3.2 Case-Law Search Endpoint
```
GET /api/cases/search?q=anticipatory+bail
→ {
    provision: "Section 438 CrPC / Section 482 BNSS",
    cases: [
      {
        name: "Arnesh Kumar v. State of Bihar (2014)",
        court: "Supreme Court",
        date: "2014-07-04",
        holding: "No arrest without Magistrate's approval under 438",
        citations: 2847,
        status: "good law"
      },
      ...
    ],
    interpretation: "SC has read Section 438 narrowly...",
    conflicts: [],
    sources: [...]
  }
```

### 3.3 Case Relationship Graph
Track:
- `FOLLOWED_BY` — later cases following this precedent
- `DISTINGUISHED_BY` — cases that distinguished this
- `OVERRULED_BY` — cases that overruled this
- `REFERRED_TO` — cited in later decisions
- `APPEALED_FROM` — appellate history

### 3.4 Legal Research Workflow for Case Law
User asks: "What is the current position on anticipatory bail?"

Response should include:
1. Current provision (Section 438 CrPC / Section 482 BNSS)
2. Key Supreme Court interpretations
3. Conditions laid down by courts
4. Conflicting High Court views (if any)
5. Recent developments
6. Source links (Indian Kanoon, SC website)

---

## Phase 4: Make Citations Exceptional

**Priority:** High — differentiation feature
**Timeline:** 2-3 weeks

### 4.1 Structured Citation Display
Every AI response should show:

```
Answer
...

Sources (3)
├── Article 21 — Constitution of India
│   Why this source matters: Fundamental right to life and personal liberty
│   Open source →
├── Section 35 — Bharatiya Nyaya Sanhita 2023
│   Why this source matters: Defines punishment for murder
│   Open source →
└── Maneka Gandhi v. Union of India (1978)
    Why this source matters: Expanded scope of Article 21
    Open source →
```

### 4.2 Source Quality Indicators
For each source, show:
- Trust level (Official / Verified / Community)
- Freshness (last updated date)
- Relevance score (why this chunk was retrieved)
- Coverage indicator (how well this source answers the question)

### 4.3 Audit Trail
Users should be able to:
- Click any claim in the answer → see exact source passage
- See if source is currently in force or struck down
- See amendment history of cited provision
- Export citations in standard legal format

### 4.4 Citation Verification (Post-Hoc)
After the LLM generates an answer:
- Parse all `[Source N]` references
- Verify each referenced source actually exists in the retrieved context
- Flag if LLM cites something not in the sources
- Show warning: "Some claims could not be verified against retrieved sources"

---

## Phase 5: Productionize Backend

**Priority:** High — required for real users
**Timeline:** 2-3 weeks

### 5.1 Database Migration
**From:** JSON file-based (`database/*.json`)
**To:** PostgreSQL (or SQLite for simplicity)

Tables needed:
- `users` (id, name, email, password_hash, role, preferences, created_at)
- `conversations` (id, user_id, title, created_at, updated_at)
- `messages` (id, conversation_id, role, content, sources, confidence, created_at)
- `bookmarks` (id, user_id, article_id, title, url, created_at)
- `documents` (id, user_id, filename, type, size, status, created_at)
- `search_history` (id, user_id, query, results_count, created_at)
- `feedback` (id, message_id, type, reason, created_at)
- `settings` (key, value, updated_at)
- `audit_log` (id, action, user_id, details, ip, created_at)

Migration path: Write a one-time script that reads all JSON files and inserts into PostgreSQL.

### 5.2 File Upload Persistence
**From:** Local disk (`backend/uploads/`)
**To:** Cloud object storage (S3, GCS, or Cloudinary)

Options:
- **Cloudinary** — free tier, image/video optimization
- **AWS S3** — industry standard, pay-per-use
- **Backblaze B2** — cheapest, S3-compatible

### 5.3 Logging & Monitoring
**From:** Custom `fs.appendFileSync` logger
**To:** Structured logging with rotation

- Replace with Winston or Pino
- Add request ID correlation
- Ship logs to external service (Render logs, or free tier of: Papertrail, Logtail)
- Add error rate alerting

### 5.4 Rate Limiting
**From:** In-memory `MemoryStore`
**To:** Redis-backed (or Render's built-in)

- Shared state across instances
- Per-user limits for authenticated users
- Separate limits for anonymous vs. authenticated

### 5.5 Secret Management
- Fix JWT_SECRET to be persistent (already done — set in .env)
- Add refresh tokens (short-lived access + long-lived refresh)
- Token revocation via blacklist

### 5.6 Automated Deploys
- GitHub Actions CI/CD
- Run tests before deploy
- Auto-deploy to Render on push to main
- Staging environment for testing

### 5.7 Backups
- Daily database backups
- Weekly full backup (DB + uploads)
- Test restore process

---

## Phase 6: Build Evaluation System

**Priority:** Medium — enables quality iteration
**Timeline:** 1-2 weeks

### 6.1 Unified Benchmark Suite
**Merge** the 3 existing benchmark implementations into one:

| Component | Current | Target |
|-----------|---------|--------|
| Questions | 10 (knowledge) + 33 (standalone) + 200 (retrieval-only) | 100+ with expected answers |
| Evaluation | Retrieval only | End-to-end (retrieval + generation + citation) |
| Metrics | Precision, Recall, F1, Citation Accuracy | + Answer Correctness, Legal Accuracy, Hallucination Detection |
| Persistence | Frozen JSON history | Database with trend tracking |

### 6.2 Question Bank
Build a curated set of 100+ questions:

| Category | Count | Difficulty |
|----------|-------|------------|
| Constitutional Law | 15 | Easy/Hard |
| Criminal Law (BNS/BNSS) | 20 | Easy/Medium/Hard |
| Civil Law | 15 | Easy/Medium/Hard |
| Corporate Law | 10 | Medium/Hard |
| Tax Law | 10 | Medium |
| Consumer Law | 10 | Easy/Medium |
| RTI | 5 | Easy |
| Hallucination Tests | 15 | Adversarial |

Each question has:
```json
{
  "id": "q-001",
  "query": "What is the punishment for murder under BNS?",
  "category": "criminal-law",
  "difficulty": "easy",
  "expectedActs": ["Bharatiya Nyaya Sanhita"],
  "expectedSections": ["103"],
  "expectedKeywords": ["death", "life imprisonment", "7 years"],
  "expectedSources": ["bns.json"],
  "expectedAnswerContains": ["Section 103", "punishment", "death or life imprisonment"],
  "hallucinationCheck": ["should NOT mention IPC 302 as current law"]
}
```

### 6.3 Evaluation Metrics

| Metric | How Measured |
|--------|-------------|
| **Retrieval Precision** | Fraction of retrieved chunks that are relevant |
| **Retrieval Recall** | Fraction of expected chunks found |
| **Answer Correctness** | Semantic similarity to expected answer (LLM-as-judge) |
| **Citation Accuracy** | Fraction of cited sources that actually support the claim |
| **Legal Accuracy** | Whether the legal proposition stated is correct |
| **Hallucination Rate** | Fraction of claims not supported by any source |
| **Grounding Quality** | Whether answer references specific provisions |
| **Latency** | End-to-end response time |

### 6.4 Legal AI Quality Score
Composite score: `0.3 * Retrieval + 0.3 * Answer + 0.2 * Citation + 0.2 * Legal Accuracy`

Track over time. Set minimum threshold for deployment.

### 6.5 CI Integration
- Run benchmark on every PR that touches RAG/retrieval/prompt code
- Block deployment if score drops below threshold
- Generate comparison report (before vs. after)

---

## Phase 7: Research Workspace (Post-Trust)

**Priority:** Medium — killer workflow feature
**Timeline:** 3-4 weeks
**Depends on:** Phases 1-5 complete

### 7.1 Workspace Model
A user can:
- Create a research workspace (e.g., "Anticipatory Bail Research")
- Collect sources into the workspace
- Ask follow-up questions within the workspace context
- Compare provisions side-by-side
- Annotate findings
- Generate a cited research brief

### 7.2 Features
- **Source Collection:** Save retrieved chunks to a workspace
- **Follow-up Context:** Ask questions with workspace context loaded
- **Comparison View:** Side-by-side comparison of legal provisions
- **Annotations:** Add notes to sources
- **Research Brief Generator:** Export a formatted document with citations
- **Collaboration:** Share workspaces with other users

### 7.3 Data Model
```
Workspace {
  id, userId, title, description, createdAt
  sources: [{ sourceId, text, annotation, addedAt }]
  conversations: [{ conversationId, title }]
  brief: { content, generatedAt }
}
```

---

## Implementation Order

```
Phase 1 (Week 1-2)     → Fix bugs, improve retrieval quality
Phase 5 (Week 2-3)     → Database migration, production infra
Phase 2 (Week 3-5)     → Expand knowledge base
Phase 4 (Week 4-6)     → Citation UX
Phase 6 (Week 5-6)     → Evaluation system
Phase 3 (Week 6-8)     → Case-law intelligence
Phase 7 (Week 8-10)    → Research workspace
```

**Rationale:** Fix foundation first (bugs + infra), then expand data, then build trust features, then add intelligence, then workflow.

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Citation Accuracy | 30% | 80%+ |
| Recall | 49% | 75%+ |
| Hallucination Rate | 13% | <5% |
| Indexed Acts | 15 | 30+ |
| Landmark Cases | 6 | 500+ |
| Benchmark Questions | 10 | 100+ |
| Response Latency | ~875ms | <2s (acceptable for quality) |
| Database | JSON files | PostgreSQL |
| Uploads | Local disk | Cloud storage |

---

## Technical Debt to Fix First

1. **Cosine similarity bug** (`embeddings.js:109`) — corrupts all search results
2. **Legal graph `query()` missing** — causes runtime errors
3. **JSON database** — blocks multi-user production
4. **Ephemeral uploads** — files lost on deploy
5. **In-memory rate limiter** — ineffective at scale
6. **No uncaughtException handler** — process crashes without cleanup

---

*This roadmap transforms LawLens from "ask a legal chatbot" to "do your legal research here."*
