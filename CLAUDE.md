# CyberWeb -- CLAUDE.md

## Build Prerequisites

Before running or building, generate CyberChef config files:

```bash
node --import ./scripts/register-loader.mjs scripts/generate-config.mjs
```

The `register-loader.mjs` transforms CyberChef's deprecated `assert {type: "json"}` import syntax to `with {type: "json"}` for Node v22+.

This creates `OperationConfig.json`, `operations/index.mjs`, and `config/modules/*.mjs` inside `../CyberChef/src/core/config/`. Without these, the build will fail.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm test           # vitest run (unit tests)
npm run test:e2e   # playwright test (E2E)
npm run esolang    # CLI esolang interpreter (see below)
```

## Path Aliases

- `@` -> `src/`
- `@cyberchef` -> `../CyberChef/src/core/`

## Key Conventions

- **CSS variables** are defined in `src/styles/globals.css` `:root`. Use `var(--font-mono)` for monospace font stacks.
- **`buildDefaultArgs(opName, overrides?)`** in `src/utils/argDefaults.ts` is the single source of truth for resolving default argument values from operation metadata. Do not duplicate this logic.
- **Lazy loading** -- operation modules are loaded via dynamic `import()` on first execution, not at startup. Only metadata from `OperationConfig.json` is available synchronously.
- **Stores** -- `graphStore` (nodes/edges), `executionStore` (results/status), `uiStore` (selection/panels). All Zustand 5.

## Vite Patches

The `cyberchefPatches()` plugin in `vite.config.ts` handles three CyberChef dependencies that don't work in browser/Rollup:
- `chi-squared` -- uses `with(Math)` syntax; replaced with inlined ESM
- `zlibjs` -- IIFE modules registering on `this`; wrapped to export namespace
- GOST vendor modules -- illegally reassign import bindings; converted to mutable vars

## Debug Dump

Click the **Debug** button in the toolbar to copy an LLM-friendly text dump of the current graph state to the clipboard. The dump includes:

- Graph topology (edge connections)
- Each node in topological order: type, operation name, args, input sources
- Execution results: status, duration, output preview (300 chars), errors, fork results

You can also call `buildDebugDump(nodes, edges, results)` from `src/utils/debugExport.ts` programmatically.

When debugging a user's graph, ask them to click Debug and paste the dump. It gives you the full recipe, args, and partial I/O for every node.

## Esolang CLI Runner

`npm run esolang` runs esoteric language interpreters from the terminal with full output and memory dump — no browser needed. Use this to test and debug interpreters.

```bash
# Run Brainfuck with output + memory/tape hex dump
npm run esolang -- bf '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.'

# Auto-detect esolang from input (runs cipher identifier detectors)
npm run esolang -- detect '<code>'

# Other languages: ook, binaryfuck, blub, pikalang, reversefuck, spoon, cow, deadfish, whitespace, chicken
npm run esolang -- deadfish 'iiiiiiiisiiiiiiiiio'

# Read from file, provide stdin, set step limit
npm run esolang -- bf --file program.bf --stdin 'input' --steps 5000

# Pipe code via stdin
echo '+[]' | npm run esolang -- bf --steps 500

# List all available languages
npm run esolang -- list
```

Output includes: decoded output, escaped representation, execution stats (steps/time), memory hex dump with pointer position, and non-zero cell listing. For `detect` mode, shows all matching detectors with confidence scores and trial-execution results.

## What to Avoid

- Do not eagerly import operation modules -- always go through `OperationRegistry.loadOperation()`
- Do not add Node.js-only dependencies; this is a browser app
- Do not duplicate arg-resolution logic -- use `buildDefaultArgs()` from `src/utils/argDefaults.ts`
