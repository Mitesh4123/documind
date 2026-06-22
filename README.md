# DocuMind — Phase 1

AI document intelligence platform. Phase 1 covers: auth, file upload, PDF text extraction, and a dashboard to manage uploaded documents. Phase 2 will add chunking + embeddings + RAG chat.

## Project Structure
```
documind/
  backend/      Node.js + Express + MongoDB API
  frontend/     React (Vite) + Tailwind dashboard
```

## Prerequisites
- Node.js 18+
- MongoDB running locally (or a free MongoDB Atlas cluster)

## Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI and a real JWT_SECRET
npm run dev
```
Server runs on http://localhost:5000

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
App runs on http://localhost:5173

## What's working in Phase 1
- Register / login with JWT auth
- Upload a PDF (max 20MB)
- Backend extracts text + page count automatically on upload
- Dashboard lists your documents with status (uploaded → processing → ready/failed)
- Delete a document (removes file + DB record)

## API Endpoints
| Method | Route                     | Auth | Description                  |
|--------|---------------------------|------|-------------------------------|
| POST   | /api/auth/register        | No   | Create account                |
| POST   | /api/auth/login           | No   | Log in, get JWT               |
| POST   | /api/documents/upload     | Yes  | Upload a PDF (multipart)      |
| GET    | /api/documents            | Yes  | List your documents           |
| GET    | /api/documents/:id        | Yes  | Get one document (full text)  |
| DELETE | /api/documents/:id        | Yes  | Delete a document             |

## Next: Phase 2
- Chunk `extractedText` into ~500-token pieces with overlap
- Generate embeddings (Claude/OpenAI API) for each chunk
- Store vectors in a vector DB (Qdrant/Chroma/Pinecone)
- Build a `/api/documents/:id/ask` endpoint that retrieves relevant chunks and asks the LLM with citation-aware prompting
- Wire up a chat UI in the frontend
