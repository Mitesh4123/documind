# DocuMind — AI Document Intelligence Platform

DocuMind lets you upload PDF documents and chat with them using AI. Ask questions, get cited answers, generate summaries, and search across multiple documents at once.

Built with a full RAG (Retrieval-Augmented Generation) pipeline — documents are chunked, embedded, and stored in a vector database so answers are always grounded in your actual content, not hallucinated.

---

## Features

- **Upload & Extract** — Upload any text-based PDF; text is extracted and indexed automatically
- **Chat with Documents** — Ask questions in natural language; answers cite the exact source chunks
- **Auto Summarize** — Generate a concise summary of any document in one click
- **View PDF** — Open the original PDF in a new tab; clicking a citation jumps directly to that page
- **Cross-Document Search** — Ask a question across all your uploaded documents simultaneously
- **Grounded answers** — The model only answers from your document content; says "I don't know" when the answer isn't there

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas) |
| Vector DB | Pinecone |
| Embeddings | OpenAI `text-embedding-3-small` |
| Chat / Q&A | OpenAI `gpt-4o-mini` |
| PDF Parsing | pdf-parse |
| Auth | JWT + bcrypt |
| Deployment | Render (backend), Vercel (frontend) |

---

## Architecture

```
User uploads PDF
       │
       ▼
Backend extracts text (pdf-parse)
       │
       ▼
Text chunked into ~350-word page-aware segments
       │
       ▼
Each chunk embedded via OpenAI API (1536 dimensions)
       │
       ▼
Vectors stored in Pinecone (namespaced per document)
       │
       ▼
User asks a question
       │
       ▼
Question embedded → top-5 similar chunks retrieved from Pinecone
       │
       ▼
Chunks + question sent to GPT-4o-mini with citation-grounded prompt
       │
       ▼
Answer returned with [Chunk N] citations → click to jump to PDF page
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- OpenAI API key (with billing enabled)
- Pinecone account (free tier, index dimension: 1536, metric: cosine)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `backend/.env` with the following:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret_string
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=documind
```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, get JWT |
| POST | `/api/documents/upload` | Yes | Upload a PDF |
| GET | `/api/documents` | Yes | List your documents |
| GET | `/api/documents/:id` | Yes | Get document details |
| GET | `/api/documents/:id/file` | Yes | Stream raw PDF |
| POST | `/api/documents/:id/ask` | Yes | Ask a question about one document |
| GET | `/api/documents/:id/chat-history` | Yes | Get chat history |
| GET | `/api/documents/:id/summary` | Yes | Generate/get document summary |
| POST | `/api/documents/ask-all` | Yes | Search across all documents |
| DELETE | `/api/documents/:id` | Yes | Delete a document |

---

## Project Structure

```
documind/
├── backend/
│   ├── models/          # Mongoose schemas (User, Document, ChatMessage)
│   ├── routes/          # Express routes (auth, documents)
│   ├── middleware/       # JWT auth middleware
│   └── utils/           # PDF extraction, chunking, embeddings, Pinecone, OpenAI
└── frontend/
    └── src/
        ├── pages/       # Dashboard, DocumentChat, Login, Register
        ├── components/  # UploadBox, DocumentList, MultiDocSearch, PdfViewer
        └── api/         # Axios client with JWT interceptor
```

---

## Author

**Mitesh Thummar** — [GitHub](https://github.com/Mitesh4123) · [LinkedIn](https://www.linkedin.com/in/mitesh-thummar-840827262/)