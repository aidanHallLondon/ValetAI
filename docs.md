# Valet Documentation Index

Valet is a local intelligence hub for unified-memory hardware. It strictly separates retrieval (text-embedding-bge-m3) and reasoning (mlabonne_qwen3-14b) through a shared SQLite WAL database.

## Architecture Summary

PM2 runs three isolated processes on a shared SQLite database:

- **`gatherer` (`src/gatherer`):** One-shot cron job runs every 15 minutes. It fetches data and writes `pending` rows.
- **`agent` (`src/agent`):** Continuous worker polls SQLite. It creates embeddings, retrieves plain text, and runs LLM reasoning.
- **`ui` (`src/ui`):** Continuous Express API and React dashboard. It displays data and triggers gatherer runs.

## Documentation Map

Keep all documentation files, including `docs/todo.md` and `docs/completed.md`, up to date at all times.
Read these documents only when you work on the target subsystem:

| Document | Topic | When to Read |
| :--- | :--- | :--- |
| [`docs/rules.md`](docs/rules.md) | ASD-STE100 writing, engineering, UX design, and Atomic 5-layer naming parity rules | Read before writing code, docstrings, or UI components. |
| [`docs/todo.md`](docs/todo.md) | Active outstanding tasks and backlog | Read before starting new work or picking tasks. |
| [`docs/completed.md`](docs/completed.md) | Archive of finished project tasks | Read when reviewing completed milestones. |
| [`docs/agents.md`](docs/agents.md) | Six AI agents, prompt configurations, and versioning | Read when tuning agent prompts or modifying bot behaviors. |
| [`docs/context.md`](docs/context.md) | Full project context and tech stack | Read when learning system components and project goals. |
| [`docs/architecture.md`](docs/architecture.md) | PM2 process boundaries, SQLite WAL, and RAG bridge | Read when modifying processes, concurrency, or data pipeline. |

