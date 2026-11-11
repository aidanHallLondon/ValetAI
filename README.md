# Valet AI

Valet is a private AI news and intelligence reader.
It runs completely on your own computer.
It reads RSS feeds, finds connections between articles, and generates structured summaries.
Your data never leaves your machine.
You pay zero API fees and need no cloud accounts.
Valet works best on Apple Silicon Macs (M1/M2/M3/M4) or computers with 16 GB+ RAM.

---

## Cheatsheet

### Quickstart when installed

1. `npm start`
2. Open `http://localhost:3001` in your browser.
3. Check that Valet is not paused and has sources.

### Using coding agents

Use @docs/ in your prompt to make sure your agent reads the documentation file and the rules in the /docs/ folder.

### Install & Setup (details below)

1. Clone the repository. Install LM Studio and get an LLM and an Embedding model.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3001` in your browser.

See the Daily Commands section below and the `docs/` directory for detailed documentation.

---

## Why Local AI?

Most AI news tools send your reading history to third-party servers.
Valet keeps everything private on your desk:
- **Zero Cloud Costs:** You do not need OpenAI or Anthropic API keys.
- **Total Privacy:** All articles, notes, and browsing data stay in a local SQLite file.
- **Fast Search:** Local vector search finds related stories across your entire reading library.

---

## 1. What You Need (Prerequisites)

Before starting, make sure you have:

### 1. Modern Computer
- Apple Silicon Mac (M1, M2, M3, or M4 with 16 GB+ RAM recommended), or
- Linux / Windows PC with 16 GB+ RAM.

### 2. Node.js and npm
Valet requires Node.js version 20 or newer.
Installing Node.js automatically installs `npm`:
- **macOS:** Download the LTS installer from [nodejs.org](https://nodejs.org) or run `brew install node`.
- **Windows / Linux:** Download the LTS installer from [nodejs.org](https://nodejs.org).
- **Verify:** Run `node -v` and `npm -v` in your terminal to confirm installation.

### 3. Local Model Runner (LM Studio)
Valet connects to local inference servers.
Download the free LM Studio application from [lmstudio.ai](https://lmstudio.ai).

---

## 2. Setting Up Your AI Models

Valet works out of the box with LM Studio.
It also supports Ollama, vLLM, or any OpenAI-compatible server.

### Default Models in LM Studio
Open LM Studio, search for these two models, and download them:

1. **Search Model (Embedding):**
   - Search for: `text-embedding-bge-m3`
   - Download it. Valet uses this to find related articles.
2. **Thinking Model (LLM):**
   - Search for: `mlabonne_qwen3-14b-abliterated` (or any Qwen 2.5 / Llama 3 model).
   - Download a `Q4_K_M` or similar quantized version.
   - abliterated models will never refuse to answer a prompt but may be less stable than models with guardrails.

### Start the Server in LM Studio
1. Click the **Local Server** tab (the double-arrow icon on the left).
2. Select your downloaded models.
3. Click **Start Server**.
4. The server runs at `http://localhost:1234`.

---

## 3. Installation Guide

Setting up Valet takes two minutes:

### Step 1: Open the Project Folder
Open your terminal and navigate to the project directory:
```bash
cd ValetAI
```

### Step 2: Install Dependencies
Run the installation command:
```bash
npm install
```
This single command automatically installs all required dependencies.
It configures database drivers, React components, and icon generators automatically.
You do not need to install extra build tools manually.

---

## 4. Starting Valet

Start the application with one command:

```bash
npm start
```

This starts all background services:
- **Web Interface:** Serves your dashboard at `http://localhost:3001`.
- **AI Agent:** Reads new articles and creates AI summaries in the background.
- **Feed Gatherer:** Checks your RSS feeds every 15 minutes.

---

## 5. Using Different Models or Server URLs

You do not have to use default models or port 1234.
You can customize servers and models directly in the web interface:

### Change Server URL in the Dashboard
1. Open `http://localhost:3001` in your browser.
2. Click **Settings** in the top navigation bar.
3. Select the **Thinking** tab.
4. Enter your custom server URL in the **LLM Server URL** field.
5. Valet saves your change immediately.

Examples of alternate URLs:
- **Ollama:** `http://localhost:11434/v1`
- **Remote / LAN Server:** `http://192.168.1.50:1234/v1`
- **Custom Port:** `http://localhost:8080/v1`

You can also set the URL via environment variable:
```bash
LM_STUDIO_BASE_URL="http://localhost:1234/v1" npm start
```

### Use Different Models
Valet requires two model capabilities:
1. **Embedding Model (Search):**
   - Recommended: `text-embedding-bge-m3`.
   - Compatible options: `nomic-embed-text`, `all-MiniLM-L6-v2`, or any embedding model.
2. **Reasoning Model (Summarization & Extraction):**
   - Recommended: `mlabonne_qwen3-14b-abliterated`.
   - Compatible options: `Qwen 2.5`, `Llama 3.1`, `Mistral 7B`, `Gemma 2`, or `DeepSeek-R1`.

In **Settings > Thinking**, pick any loaded model from the dropdown.
You can also assign different models to different agent bots.

---

## 6. Using the App

Open your browser and visit:

```text
http://localhost:3001
```

You will see:
- **Intelligence Feed:** A clean stream of articles ranked by relevance.
- **Editorial Reader:** Full-page reading with key takeaways and entity tags.
- **Command Center:** Add RSS feeds, explore topics, and tweak AI prompts.

---

## 7. Daily Commands

Control the app from your terminal with these simple commands:

| Command | What It Does |
| :--- | :--- |
| `npm start` | Starts all background services. |
| `npm run status` | Shows memory usage and running status. |
| `npm stop` | Stops all background services. |
| `npm run restart` | Restarts all background services. |
| `npm run dev` | Runs the web server directly in your terminal. |

---

## 8. Troubleshooting

### Problem: Articles do not show AI summaries
- Check if LM Studio or your local inference server is running.
- Ensure the server is started at the URL configured in Settings.
- Verify that your embedding model is loaded.

### Problem: Port 3001 is already in use
- Stop any old process with `npm stop`.
- Start again with `npm start`.

---

## 9. Exploring the Code and Architecture

Want to learn how Valet works under the hood?
Read our technical documentation in `docs/`:

- [`docs/architecture.md`](docs/architecture.md): Database design and process boundaries.
- [`docs/rules.md`](docs/rules.md): Code standards and design token rules.
- [`docs/agents.md`](docs/agents.md): How each of the six AI agents functions.
- [`docs/todo.md`](docs/todo.md): Active tasks and planned improvements.
- [`docs/completed.md`](docs/completed.md): Log of completed features and optimizations.
