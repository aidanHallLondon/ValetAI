# Valet AI Agents

Valet uses six specialized AI agents.
Each agent executes a distinct stage in the intelligence pipeline.
Users can edit every agent prompt in the UI.

---

## 1. Agent Overview

| Agent | Purpose | UI Tab |
| :--- | :--- | :--- |
| **Scout** | Filters low-relevance articles fast | `agent-scout` |
| **Reader** | Generates structured analysis and summaries | `agent-analyst` |
| **Organiser** | Groups related articles into story threads | `agent-clusterer` |
| **Curator** | Organizes the library into knowledge shelves | `agent-curator` |
| **Assistant** | Synthesizes user preferences into master directives | `agent-assistant` |
| **Supervisor** | Audits prompt quality and flags errors | `agent-auditor` |

---

## 2. Agent Details and Editable Prompts

### Scout (Fast Gatekeeper)
- **Role:** Evaluates incoming content before full processing.
- **Action:** Discards clickbait and irrelevant topics early.
- **Editable Prompts:** `scoutSystemPrompt`, `scoutPromptTemplate`.
- **Threshold:** Users configure the minimum relevance score (0-100).
- **Output:** JSON object with pass boolean, score, and reason.

### Reader (Intelligence Analyst)
- **Role:** Reads primary articles and related vector context.
- **Action:** Synthesizes key facts, entities, and action items.
- **Editable Prompts:** `systemPrompt`, `relevanceRubric`, `promptTemplate`.
- **Output:** Zod-validated JSON matching `ProcessedAnalysisSchema`.

### Organiser (Story Weaver)
- **Role:** Compares new articles against active stories.
- **Action:** Merges matching articles or creates new stories.
- **Editable Prompts:** `clustererSystemPrompt`, `clustererPromptTemplate`.
- **Matching Logic:** Combines BGE-M3 cosine vector similarity and entity overlap.

### Curator (Knowledge Ontologist)
- **Role:** Scans all completed articles in SQLite.
- **Action:** Groups articles into macro category shelves.
- **Editable Prompts:** `curatorSystemPrompt`.
- **Output:** Curated shelves with top entities and sample articles.

### Assistant (Executive Guidance)
- **Role:** Learns user reading habits, upvotes, and explicit notes.
- **Action:** Generates a unified master guidance directive for downstream bots.
- **Editable Prompts:** `userPreferencesNotes` (About Me), `assistantSystemPrompt`, `assistantPromptTemplate`.
- **Output:** JSON containing master directive, focus areas, and excluded topics.

### Supervisor (Prompt Quality Guardian)
- **Role:** Inspects prompts and user preferences for errors.
- **Action:** Identifies unfilled template tags and contradictions.
- **Editable Prompts:** `promptAuditorSystemPrompt`, `assistantSupervisorPrompt`.
- **Tooling:** Includes a live prompt sandbox editor for immediate testing.

---

## 3. Prompt Versioning and Storage

- **Database Storage:** Active prompts persist in the SQLite `settings` table.
- **Deterministic Hashing:** Valet hashes each prompt text with SHA-256.
- **Version Tracking:** The `prompt_versions` table stores incremental tags (`v1`, `v2`, `v3`).
- **Audit Trace:** Every content row records `last_prompt`, `last_response`, and stage timings.
- **Reset Safety:** Every prompt editor provides a reset button to restore default settings.

