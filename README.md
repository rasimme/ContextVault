# memory-kit

> **Templates for OpenClaw agent memory management.**

Reusable templates for automated memory curation and workspace hygiene. Designed as a starting point — clone, customize, done.

---

## What's inside

### 🧹 Memory Maintainer (`cron/memory-maintainer/`)

Cron job template that runs every 3 days to keep MEMORY.md fresh:
- Reads last 3 daily memory files
- Extracts lasting facts → MEMORY.md
- Removes outdated entries
- Warns if workspace files exceed size limits

Includes multi-agent setup (staggered schedules per agent).

→ [Setup guide](cron/memory-maintainer/README.md) · [Prompt template](cron/memory-maintainer/prompt.md)

### 📊 Workspace Housekeeping (`skills/workspace-housekeeping/`)

OpenClaw skill with file size limits, cleanup guidelines, and protected-section rules:

| File | Limit | Purpose |
|------|-------|---------|
| AGENTS.md | 4KB | How the agent works |
| SOUL.md | 2KB | Who the agent is |
| TOOLS.md | 3KB | What the agent can do |
| MEMORY.md | 10KB | What the agent knows |

→ [SKILL.md](skills/workspace-housekeeping/SKILL.md)

---

## What about Session Handoff / Memory Flush?

These are now **native OpenClaw features** (since 2026.3.x):

- **Session Handoff** → bundled `session-memory` hook (enable via `openclaw hooks enable session-memory`)
- **Memory Flush** → `compaction.memoryFlush` config in `openclaw.json`

Previously part of this repo (as ContextVault). Old code is in git history if needed.

---

## Usage

```bash
# Clone
git clone https://github.com/rasimme/memory-kit.git
cd memory-kit

# Install the skill
cp -r skills/workspace-housekeeping ~/.openclaw/skills/

# Set up the cron job
# Copy the prompt from cron/memory-maintainer/prompt.md
# Create via OpenClaw cron tool — see README in that folder
```

---

## License

MIT
