# OpenClaw Memory Management

[![GitHub](https://img.shields.io/badge/GitHub-openclaw--memory-blue?logo=github)](https://github.com/rasimme/openclaw-memory)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v1.1.0-orange.svg)](https://github.com/rasimme/openclaw-memory/releases)

> **Advanced memory management system for OpenClaw agents.**

Structured approach to persistent memory with session handoff, automated curation, and workspace housekeeping.

---

## Features

- 🔄 **Session Persistence** — Context survives `/new`, compaction, and gateway restarts
- 🧹 **Automated Curation** — Memory Maintainer runs every 3 days to keep MEMORY.md fresh
- 📊 **Workspace Monitoring** — File size tracking with cleanup guidance
- 💾 **Memory Flush Integration** — Pre-compaction state persistence
- 🎯 **Zero Maintenance** — Self-maintaining via hooks and cron jobs

---

## Quick Start

```bash
# 1. Clone into your OpenClaw workspace
cd ~/.openclaw/workspace
git clone https://github.com/rasimme/openclaw-memory.git memory-system

# 2. Install components
# Session Handoff Hook
cp memory-system/hooks/session-handoff/session-handoff.mjs hooks/

# Memory Maintainer Cron
# (Use cron tool via OpenClaw CLI or add via gateway config)

# Workspace Housekeeping Skill
cp -r memory-system/skills/workspace-housekeeping ~/.openclaw/skills/

# 3. Configure Memory Flush (optional)
# Add to your ~/.openclaw/openclaw.json:

{
  "memoryFlush": {
    "enabled": true,
    "prompt": "...\n\nIf ACTIVE-PROJECT.md has a project: Update PROJECT.md with session progress. Write SESSION-STATE.md with recovery context."
  }
}

# 4. Restart gateway
openclaw gateway restart
```

---

## Related Projects

- **[openclaw-project-mode](https://github.com/rasimme/openclaw-project-mode)** — Project management with Kanban dashboard (uses memory system for session persistence)
- **[openclaw-skills](https://github.com/rasimme/openclaw-skills)** — Collection of OpenClaw skills and plugins

---

## The Challenge

OpenClaw already provides solid memory primitives: daily memory files, long-term memory (MEMORY.md), semantic search via `memory_search`, and automatic memory flush before compaction. These work well out of the box.

But over time, a pattern emerges:
- **File bloat**: AGENTS.md grows from 3KB to 14KB because it's the easiest place to dump info
- **Misplaced information**: Technical details end up in personality files, project status in rule files
- **Unmaintained long-term memory**: MEMORY.md either doesn't exist or becomes stale
- **Lost context between sessions**: Important decisions from weeks ago fade into forgotten daily files

This system provides three extensions that help OpenClaw manage itself better.

---

## Architecture

### The 3-Layer Memory Model

```
Layer 1: Short-Term (automatic)
├─ Today + yesterday daily files → loaded at session start
├─ SESSION-STATE.md → session handoff hook on /new
└─ Memory Flush → writes to daily file before compaction

Layer 2: Long-Term (cron, every 3 days)
├─ Memory Maintainer reads recent daily files
├─ Important facts → MEMORY.md (max 10KB)
└─ Outdated entries → removed from MEMORY.md

Layer 3: Archive (on-demand)
├─ memory_search → semantically searches ALL memory files
└─ Old daily files remain as searchable archive
```

**No day is lost**: Days 1-2 are in short-term, Day 3 gets processed by the maintainer before falling out of the short-term window.

---

## Components

### 1. Session Handoff Hook

**Hook:** `hooks/session-handoff/session-handoff.mjs`

Preserves active task context when you start a new session (`/new` command or session compaction).

**What it does:**
- Runs on `/new` command
- Writes `SESSION-STATE.md` with current task context
- Agent reads SESSION-STATE.md on next session start
- Restores context seamlessly

**Integration with Project Mode:**
If you use [openclaw-project-mode](https://github.com/rasimme/openclaw-project-mode), the hook writes project-aware context (active tasks, decisions, next steps).

---

### 2. Memory Flush Integration

**Config:** `memoryFlush.prompt` in `openclaw.json`

OpenClaw runs memory flush **before compaction** to prevent context loss. This system extends it with project-aware state persistence.

**Extended Memory Flush Prompt:**

```
Write to today's daily memory file (memory/YYYY-MM-DD.md):

1. **Key facts** about today (decisions, new info, people, preferences)
2. **Unfinished tasks** (1-2 sentences each, no copy-paste from workspace files)
3. **Important context** that should survive compaction

READ ACTIVE-PROJECT.md. If a project is active:
4. Update PROJECT.md with session progress
5. Write SESSION-STATE.md with recovery context (Read PROJECT-RULES.md + PROJECT.md on restart)

Then: NO_REPLY
```

This ensures both general memory AND project context survive compaction.

---

### 3. Memory Maintainer (Cron)

**Cron Job:** Runs every 3 days at 03:00

**What it does:**
1. Reads the last 3 days of daily memory files
2. Extracts important long-term facts
3. Updates MEMORY.md (removes stale entries, adds new relevant info)
4. Keeps MEMORY.md under 10KB (soft limit)

**What belongs in MEMORY.md:**
- ✅ New facts about the user (preferences, relationships, interests)
- ✅ New projects or status changes
- ✅ Important architecture decisions
- ✅ Changed habits or workflows

**What does NOT belong:**
- ❌ Debugging sessions
- ❌ One-time tasks that are done
- ❌ Step-by-step logs
- ❌ Setup instructions (stay in daily files, findable via memory_search)

---

### 4. Workspace Housekeeping (Skill)

**Skill:** `workspace-housekeeping`

Monitors workspace file sizes and provides cleanup guidance.

**Limits:**
- AGENTS.md: 4KB
- SOUL.md: 2KB
- TOOLS.md: 3KB
- MEMORY.md: 10KB

**When a file exceeds its limit:**
- Agent sends Telegram/Discord warning
- Loads workspace-housekeeping skill
- Provides cleanup guide with:
  - Language policy (English for instructions, German for personality)
  - Protected sections (what to keep)
  - What can be refactored or removed

**Manual usage:**
```
Agent, load the workspace-housekeeping skill and help me clean up AGENTS.md
```

---

## File Size Limits (Why?)

| File | Limit | Reason |
|------|-------|--------|
| AGENTS.md | 4KB | Instructions - needs to be fast to parse, concise |
| SOUL.md | 2KB | Personality - short, memorable, impactful |
| TOOLS.md | 3KB | Reference - quick lookup, not a tutorial |
| MEMORY.md | 10KB | Long-term facts - curated, not a diary |

**Exceeding limits causes:**
- Slower session starts (more tokens to process)
- Instruction drift (agent skims instead of reading carefully)
- Higher costs (every session loads these files)
- Reduced effectiveness (signal-to-noise ratio drops)

---

## Usage Patterns

### Daily Work (Automatic)

- Work normally
- Session Handoff preserves context on `/new`
- Memory Flush saves to daily file before compaction
- **You do nothing!**

### Every 3 Days (Automatic)

- Memory Maintainer runs at 03:00
- Reads last 3 days of memory
- Updates MEMORY.md
- **You do nothing!**

### When Warned (Manual)

- Agent warns: "⚠️ AGENTS.md is 5KB (limit: 4KB)"
- You say: "Load workspace-housekeeping and help me clean up"
- Agent provides structured cleanup guidance
- You review and apply changes

---

## Integration with Project Mode

If you use [openclaw-project-mode](https://github.com/rasimme/openclaw-project-mode), this system enhances it:

**Session Handoff:**
- Writes PROJECT.md updates before `/new`
- Writes SESSION-STATE.md with project recovery context

**Memory Flush:**
- Updates PROJECT.md before compaction
- Writes SESSION-STATE.md reminder to reload project

**Memory Maintainer:**
- Extracts project milestones into MEMORY.md
- Removes completed project references when project is archived

**Together:** Project context survives sessions, compaction, and gateway restarts.

---

## Changelog

### v1.1.0 (2026-02-14)
- Memory Flush integration documented
- SESSION-STATE.md format standardized
- Project-aware memory persistence

### v1.0.0 (2026-02-09)
- Initial release
- Session Handoff Hook
- Memory Maintainer Cron
- Workspace Housekeeping Skill

---

## Philosophy

- 🎯 **Simplicity** — Extend OpenClaw's existing memory primitives, don't replace them
- 💰 **Low cost** — Haiku for cron jobs, minimal token overhead
- 🔒 **Privacy** — Everything runs locally via your Gateway
- ⚡ **Automatic** — Self-maintaining where possible, human-in-the-loop where it matters

---

## License

MIT
