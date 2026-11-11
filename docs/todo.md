# Valet Outstanding Tasks

This document lists active tasks.
Move completed tasks to `docs/completed.md`.

---

## 1. Component Modularity & Architecture (High Priority)

- [ ] **Modularize GathererSection:** Extract source creation form and suggested sources into dedicated subcomponents. Reduce `GathererSection.tsx` size and complexity.
- [ ] **Modularize Database Query Runner:** Extract raw database query tools and schema views into dedicated files.

---

## 2. Testing & Reliability

- [ ] **API Integration Tests:** Add automated integration tests for Express routes in `src/ui/routes/`. Verify error handling and status codes.
- [ ] **Feed Health Monitoring:** Track fetch failure counts, latency, and HTTP status codes in `sources`. Show unhealthy feeds clearly in the user interface.

---

## 3. Search & Retrieval Performance

- [ ] **SQLite Full-Text Search (FTS5):** Create an FTS5 virtual table for content items. Enable fast keyword searches across titles, raw text, and AI summaries.
- [ ] **Vector Index Optimization:** Add background cleanup for orphan embeddings in `content_embeddings`. Ensure vector entries match active content items.

---

## 4. Data Portability & Operations

- [ ] **OPML Import and Export:** Add OPML format support in `src/ui/routes/sources.ts`. Let users export and import their RSS feed collections.
- [ ] **Automated Database Backups:** Add an endpoint and scheduled routine for SQLite online backups. Export compressed database snapshots safely.
