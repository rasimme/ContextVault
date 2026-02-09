# Session Handoff Hook

> **v1.1.0** (formerly "Simme Memory" v3.0.0)

Preserves active session context across `/new` commands and compaction events.

## What it does

When a session ends (via `/new`) or gets compacted, the hook asks an LLM to summarize the current session into a structured SESSION-STATE.md file. When a new session starts, this file is injected into the context so the agent can continue where it left off.

### Events handled

| Event | Action |
|-------|--------|
| `command:new` | Summarize current session → write SESSION-STATE.md |
| `agent:bootstrap` | Inject SESSION-STATE.md into new session |
| Memory flush | Update SESSION-STATE.md before compaction |

### SESSION-STATE.md format

```markdown
# SESSION-STATE.md

> Previous session context. Continue where you left off.

## Current Task
## Key Context
## Pending Actions
## Blockers
```

## Installation

1. Copy the hook to your OpenClaw hooks directory:

```bash
cp -r hooks/session-handoff ~/.openclaw/hooks/
```

2. Enable in your OpenClaw config (`openclaw.json`):

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-handoff": {
          "enabled": true
        }
      }
    }
  }
}
```

3. The hook compiles `handler.ts` → `handler.js` automatically on first run.

## Files

| File | Purpose |
|------|---------|
| `handler.ts` | Hook source code (TypeScript) |
| `HOOK.md` | Hook metadata for OpenClaw |
| `package.json` | Dependencies |
| `templates/` | SESSION-STATE.md template |
| `experimental/` | Experimental features |

## Part of

[Memory Management for OpenClaw](../../README.md) — 3-layer memory architecture.
