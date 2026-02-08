# Memory Maintainer (Cron Job)

Automated curation of MEMORY.md — runs every 3 days, keeps long-term memory fresh and under control.

## What it does

1. **Reads** daily memory files from the last 3 days
2. **Extracts** lasting knowledge → adds to MEMORY.md
3. **Removes** outdated entries from MEMORY.md
4. **Checks** workspace file sizes → warns if limits exceeded

## Setup

Create an isolated cron job using the OpenClaw cron tool:

```json5
{
  name: "memory-maintainer",
  schedule: { kind: "cron", expr: "0 3 */3 * *", tz: "Your/Timezone" },
  sessionTarget: "isolated",
  payload: {
    kind: "agentTurn",
    message: "<see prompt.md>",
    timeoutSeconds: 180
  },
  delivery: { mode: "none" }
}
```

## Configuration

- **Schedule**: Every 3 days at 03:00 (adjustable)
- **Session**: Isolated (no context buildup between runs)
- **Delivery**: Silent by default (no output to chat)
- **Timeout**: 180 seconds (reads files + writes MEMORY.md)

## Why every 3 days?

- Days 1-2 are loaded as short-term memory at session start
- Day 3 would fall out of the short-term window
- The maintainer processes it before that happens → no gaps

## File size monitoring

The maintainer checks these limits and sends a warning via messaging if exceeded:

| File | Limit |
|------|-------|
| AGENTS.md | 4KB |
| SOUL.md | 2KB |
| TOOLS.md | 3KB |
| MEMORY.md | 10KB |

When a file exceeds its limit, the agent sends a warning to the user. The actual cleanup is done manually using the workspace-housekeeping skill.

## The prompt

See [prompt.md](prompt.md) for the full cron job prompt. Customize it for your setup (language, file paths, messaging channel).
