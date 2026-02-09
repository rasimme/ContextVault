# Session Handoff Hook

> **v1.0.0**

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

## Current Task
What the agent was working on

## Key Context
Important context for the current task

## Pending Actions
What still needs to be done

## Blockers
What's blocking progress
```

## Setup

1. Copy this hook to `~/.openclaw/hooks/session-handoff/`
2. Enable in your OpenClaw config:

```json5
{
  hooks: {
    internal: {
      enabled: true,
      entries: {
        "session-handoff": { enabled: true }
      }
    }
  }
}
```

3. The hook uses a lightweight model (Haiku-class) for summarization (~$0.001 per call)

## How it works

- Uses a fixed worker session key to avoid context buildup
- Resolves workspace directory from agent config
- Writes SESSION-STATE.md to the agent's workspace root
- The file is automatically picked up as workspace context by OpenClaw
