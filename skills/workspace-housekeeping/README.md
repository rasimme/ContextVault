# Workspace Housekeeping Skill

On-demand cleanup guide for workspace MD files. Loaded only when needed — zero token overhead in daily use.

## What it does

Provides structured rules for maintaining workspace files within size limits. The skill defines:

- **File size limits** and warning thresholds
- **What belongs where** (content routing between files)
- **Protected vs adjustable sections** (prevents accidental deletion of critical rules)
- **Language policy** (English for instructions, native language for personality/context)
- **Cleanup process** (analyze → propose → confirm → execute)

## When it's loaded

| Trigger | Source |
|---------|--------|
| Memory maintainer warns about file size | Cron job (automatic) |
| User requests a workspace review | Manual |
| Agent notices a file exceeding limits | Self-initiated |

The memory-maintainer cron job checks file sizes every 3 days. If any file exceeds its limit, it sends a warning to the user with a hint to load this skill.

## File size limits

| File | Purpose | Max Size |
|------|---------|----------|
| AGENTS.md | How the agent works | 4KB |
| SOUL.md | Core personality | 2KB |
| USER.md | User basics | 1KB |
| IDENTITY.md | Quick profile | 0.5KB |
| TOOLS.md | Tool reference | 3KB |
| MEMORY.md | Long-term knowledge | 10KB |
| HEARTBEAT.md | Periodic tasks | 1KB |

## Language policy

Models follow English instructions ~20-30% more accurately. The skill recommends:

- **English:** AGENTS.md, TOOLS.md (instructions the model must follow)
- **Native language:** SOUL.md, USER.md, IDENTITY.md, MEMORY.md (personality and context)

## Protected sections

Some sections in AGENTS.md are marked as **locked** — the housekeeper must never remove or weaken their intent:

- Response Style (brevity rules)
- Safety (security policies)
- No-Go Zones (isolation rules)
- Reminders (delivery config)

Other sections are **adjustable** and can be refined, shortened, or reorganized during cleanup.

## Installation

Copy the skill to your OpenClaw skills directory:

```bash
cp -r skills/workspace-housekeeping ~/.openclaw/skills/
```

The skill will appear in the agent's available skills list automatically.

## Integration with memory-maintainer

The memory-maintainer cron job handles the monitoring. When a file exceeds its limit, the warning message tells the agent to load this skill:

```
⚠️ Workspace Housekeeping: [FILE] is at [SIZE] (Limit: [LIMIT]).
Load skill workspace-housekeeping for cleanup instructions.
```

The agent then follows the skill's cleanup process: analyze, propose changes to the user, and execute only after confirmation.

## Key principle

**No information is deleted — it's moved.** Content that doesn't belong in one file gets relocated to the correct file (e.g., technical details from AGENTS.md → TOOLS.md, project info → MEMORY.md).
