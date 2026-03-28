# Memory Maintainer — Cron Job Prompt

Template for automated MEMORY.md curation. Create one cron job per agent workspace.

## Setup

Each agent with its own workspace needs a separate cron job:

```bash
# Example: Create via OpenClaw cron tool or CLI
# Adjust: agentId, workspace path, notification target, file size limits
```

### Multi-Agent Example

| Agent | Schedule | Workspace |
|-------|----------|-----------|
| main | `0 3 */3 * *` | `~/.openclaw/workspace/` |
| design-agent | `0 3 1,4,7,10,13,16,19,22,25,28 * *` | `~/.openclaw/workspace-design/` |
| dev-agent | `0 3 2,5,8,11,14,17,20,23,26,29 * *` | `~/.openclaw/workspace-dev/` |

Stagger schedules so agents don't run simultaneously.

---

## Prompt Template

Use this as `payload.message` in your cron job. Replace `{AGENT_NAME}`, `{NOTIFY_CHANNEL}`, `{NOTIFY_TARGET}`, and adjust file size limits per workspace.

```
You are the Memory Maintainer.

## Task 1: Curate MEMORY.md
1. Read the daily memory files from the last 3 days (memory/YYYY-MM-DD.md). Calculate dates based on today.
2. Read the current MEMORY.md
3. Update MEMORY.md based on new information

### What belongs in MEMORY.md (long-term relevant):
- New facts about the user (preferences, people, interests)
- New projects or status changes to existing projects
- Important architecture decisions
- New relationships or people
- Changed habits or preferences

### What does NOT belong in MEMORY.md:
- Debugging sessions and technical details
- One-off completed tasks
- Daily business without long-term value
- Setup instructions (stay in daily files, findable via memory_search)
- Step-by-step logs

### What can be removed:
- Completed or permanently parked projects → update status or remove
- Outdated information that has changed
- Overly granular details
- Redundant entries

### Rules:
- MEMORY.md MUST stay under 10KB (soft limit)
- At >8KB: summarize and clean up more aggressively
- Maintain existing structure and sections
- Write concisely — every line must add value
- Update the "Last updated" date at the bottom
- If nothing relevant happened in the last 3 days: only update date, don't force changes

## Task 2: Check workspace file sizes
Check file sizes of AGENTS.md, SOUL.md, TOOLS.md, and MEMORY.md.

Warn thresholds:
- AGENTS.md: warn if >4KB
- SOUL.md: warn if >2KB
- TOOLS.md: warn if >3KB
- MEMORY.md: warn if >10KB

If ANY file exceeds its limit:
Send a warning via message tool (channel: {NOTIFY_CHANNEL}, to: {NOTIFY_TARGET}):
"⚠️ Workspace Housekeeping ({AGENT_NAME}): [FILE] has grown to [SIZE] (limit: [LIMIT]). Review recommended."

If all files are under their limits: Do not send a message.

## Output
Brief summary of what you changed in MEMORY.md (max 3 lines). If no changes: just confirm.
```

---

## Recommended Cron Settings

```json
{
  "name": "memory-maintainer",
  "schedule": { "kind": "cron", "expr": "0 3 */3 * *", "tz": "Europe/Amsterdam" },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "... (prompt above with placeholders filled) ...",
    "timeoutSeconds": 180,
    "lightContext": true
  },
  "delivery": { "mode": "none" }
}
```

- `lightContext: true` — reduces token overhead (cron doesn't need full conversation history)
- `delivery: none` — silent unless file size warning triggers
- `timeoutSeconds: 180` — 3 min is plenty for memory curation
