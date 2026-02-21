# CyberWeb

A visual, graph-based interface for [CyberChef](https://github.com/gchq/CyberChef) operations. Build data-processing pipelines by connecting nodes on a canvas — input flows through operations and out to output nodes, all in the browser.

## Features

- **461 CyberChef operations** loaded on demand with lazy imports
- **37+ classical cipher operations** (Vigenere, Playfair, Hill, ADFGVX, etc.)
- **13 esoteric language interpreters** (Brainfuck, Ook!, Whitespace, JSFuck, etc.)
- **29 backend tool operations** — CLI tools (hashcat, john, binwalk, steghide, ffmpeg, tesseract, yara, etc.) via WebSocket backend server
- **Manual-run operations** — heavy tools (hashcat, john, aircrack-ng) require explicit trigger
- **Hash Extract** — auto-detects file type and routes to the right \*2john extractor
- **Cipher Identifier** — detects classical ciphers, encodings, and esolangs
- **Visual node graph** powered by React Flow — drag, connect, rearrange
- **Magic auto-detection** on leaf nodes — suggests likely decodings
- **Command palette** (Cmd+K / Ctrl+K) for quick operation search
- **URL state serialization** — share graphs via URL hash
- **Auto-run** mode — re-executes on every change
- **IO Probe pane** — inspect input/output with hex view, syntax highlighting, image preview
- **Fork/Merge** — split data, process branches, recombine
- **Mobile responsive** — works on tablets and phones

## Quick Start

CyberChef must be cloned alongside this repo:

```
cyberchefx/
  CyberChef/       # upstream CyberChef
  cyberweb/        # this project
```

```bash
# 1. Install CyberChef dependencies
cd ../CyberChef && npm install

# 2. Install CyberWeb dependencies
cd ../cyberweb && npm install

# 3. Generate CyberChef config files (required before first build)
node --import ./scripts/register-loader.mjs scripts/generate-config.mjs

# 4. Start dev server
npm run dev
```

## Backend Server

The backend server is **optional** — all 461 browser-based operations work without it. The server enables CLI tool operations (binwalk, hashcat, steghide, etc.) that need native binaries.

```bash
npx tsx scripts/backend-server.ts
```

The server spawns PTY processes for each tool invocation and streams output to the browser via WebSocket on port 3141. Tools must be installed on the host system.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run esolang` | CLI esolang interpreter with memory dump |
| `npx tsx scripts/backend-server.ts` | Start backend tool server (WS on :3141) |

Production builds require extra memory:

```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

## Architecture

```
┌─────────────┐  ┌──────────────────────────┐  ┌───────────┐
│  Operation   │  │       Flow Canvas        │  │   Probe   │
│   Palette    │  │  (React Flow + nodes)    │  │   Pane    │
│  (sidebar)   │  │                          │  │  (IO)     │
└─────────────┘  └──────────────────────────┘  └───────────┘
                          │
              ┌───────────┴───────────┐
              │     Zustand Stores    │
              │  graph · execution ·  │
              │     ui · crib         │
              └───────────┬───────────┘
                          │
              ┌───────────┴───────────┐
              │  Web Worker / Engine  │
              │  TopologicalSort →    │
              │  NodeExecutor →       │
              │  OperationAdapter     │
              └─────┬───────────┬─────┘
                    │           │
    ┌───────────────┴──┐  ┌────┴──────────────┐
    │  CyberChef Core  │  │  Backend Server   │
    │ (lazy-loaded ops)│  │  (WS on :3141)    │
    └──────────────────┘  │  PTY → CLI tools  │
                          └───────────────────┘
```

- **Stores** (Zustand 5): `graphStore` (nodes/edges/undo), `executionStore` (results/status/magic), `uiStore` (selection/panels), `cribStore` (cribs/secrets)
- **Execution**: Graph is topologically sorted, then nodes execute level-by-level with `Promise.all()` parallelism. Operations lazy-load via dynamic `import()`.
- **Custom ops**: Extend CyberChef with `CustomOperation` base class in `src/custom-ops/`. Self-register via `registerCustomOp()`.

## Tech Stack

React 18 · TypeScript · Vite 6 · React Flow 12 · Zustand 5 · CodeMirror 6 · highlight.js · dagre · node-pty · Vitest · Playwright

## Project Structure

```
src/
  adapter/          # CyberChef bridge (Registry, Adapter, DishBridge)
  components/       # React components (Nodes, Canvas, Sidebar, Toolbar, Modals)
  custom-ops/       # Custom operations (ciphers, esolangs, shared libs)
    backend/        # 29 backend tool operation definitions
  engine/           # Execution engine (GraphEngine, NodeExecutor, MagicEngine)
  hooks/            # React hooks (execution, layout, URL state, shortcuts)
  store/            # Zustand stores
  styles/           # CSS (globals.css, nodes.css)
  utils/            # Utilities (clipboard, serialization, search, encoding)
  worker/           # Web Worker (graph execution, backend WS client)
```
