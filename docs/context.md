# Project Context

Valet is a local intelligence hub for unified-memory hardware. It strictly separates retrieval (text-embedding-bge-m3) and reasoning (mlabonne_qwen3-14b) through a shared SQLite WAL database.

## Technology Stack

- **Runtime:** Node.js and TypeScript run all backend code.
- **Database:** SQLite with Write-Ahead Logging (WAL) stores all data.
- **Vector Search:** The `sqlite-vec` extension stores and queries embeddings.
- **Inference:** LM Studio serves local models at `http://localhost:1234/v1`.
- **Embeddings:** `text-embedding-bge-m3` creates dense vector embeddings.
- **Reasoning:** `mlabonne_qwen3-14b` analyzes data and generates structured output.
- **Frontend:** React 19, Vite, and Express provide the user interface.
- **Process Manager:** PM2 manages and monitors all system processes.

## Three-Process Architecture

PM2 manages three separate processes that share the SQLite database.

1. **Gatherer Process (`src/gatherer`):**
   - A PM2 cron job runs this process every 15 minutes.
   - It fetches external data from active sources.
   - It inserts new items with `pending` status into SQLite.
   - It stops and exits after each run.

2. **Agent Process (`src/agent`):**
   - This continuous process polls SQLite for `pending` items.
   - It generates vector embeddings with LM Studio.
   - It performs vector search to find relevant context.
   - It injects plain text into the reasoning model.
   - It saves structured results and marks items `completed`.

3. **UI Process (`src/ui`):**
   - This continuous process serves the Express API and React dashboard.
   - Users view data and manage sources through the interface.
   - It triggers immediate gatherer runs when users add new sources.

