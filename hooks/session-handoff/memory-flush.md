# Memory Flush Configuration

> Part of the [Memory Management System](../README.md)

The memory flush runs as a **silent agent turn** before OpenClaw compacts the session. It's configured in `openclaw.json`, not as a separate hook or cron job.

## What it does

When the context window approaches its limit, OpenClaw triggers a flush turn before compacting. The agent writes durable state to disk so it survives compaction.

## Configuration

Add this to `agents.defaults.compaction` in your `openclaw.json`:

```json
{
  "compaction": {
    "mode": "safeguard",
    "memoryFlush": {
      "enabled": true,
      "prompt": "Context is about to be compacted.\n\n1. Write lasting facts/decisions to memory/YYYY-MM-DD.md\n2. Update SESSION-STATE.md with:\n   - ## Current Task\n   - ## Key Context\n   - ## Pending Actions\n   - ## Blockers\n\nReply NO_REPLY after writing.",
      "systemPrompt": "Session nearing compaction. Store durable memories and session state now."
    }
  }
}
```

## How it works

1. OpenClaw detects context approaching the soft threshold (~4000 tokens before compaction limit)
2. A **silent turn** is injected with the flush prompt
3. The agent writes to `memory/YYYY-MM-DD.md` and `SESSION-STATE.md`
4. The agent replies `NO_REPLY` (suppresses delivery to user)
5. OpenClaw proceeds with compaction

## Integration with Session Handoff

The memory flush and the session-handoff hook serve complementary roles:

| Trigger | Handler | Writes |
|---------|---------|--------|
| `/new` command | Session Handoff Hook | SESSION-STATE.md (LLM summary) |
| Pre-compaction | Memory Flush (config) | memory/daily + SESSION-STATE.md |
| Bootstrap | Session Handoff Hook | Injects SESSION-STATE.md |

## Customization

- **`prompt`**: The message sent to the agent. Customize for your file structure.
- **`systemPrompt`**: Extra system context for the flush turn.
- **`softThresholdTokens`** (optional, default 4000): How early before compaction the flush triggers.

## Note

The flush runs as a regular agent turn — the agent may not always follow the instructions perfectly (e.g., during complex conversations). The session-handoff hook provides a more reliable backup for `/new` events.
