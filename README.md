# Memory Management for OpenClaw

> **v1.1.0** — A structured approach to persistent memory in OpenClaw.

Keeping your agent's knowledge organized, maintained, and efficient over time.

### Components

| Component | Type | Description |
|-----------|------|-------------|
| Session Handoff | Hook | Session context persistence across /new and compaction |
| Memory Maintainer | Cron | Automated MEMORY.md curation every 3 days |
| Workspace Housekeeping | Skill | File size monitoring + cleanup guide |
| Workspace File Guide | Docs | What belongs where (AGENTS.md, SOUL.md, etc.) |

## The Challenge

OpenClaw already provides solid memory primitives: daily memory files, long-term memory (MEMORY.md), semantic search via `memory_search`, and automatic memory flush before compaction. These work well out of the box.

But over time, a pattern emerges:
- **File bloat**: AGENTS.md grows from 3KB to 14KB because it's the easiest place to dump info
- **Misplaced information**: Technical details end up in personality files, project status in rule files
- **Unmaintained long-term memory**: MEMORY.md either doesn't exist or becomes stale
- **Lost context between sessions**: Important decisions from weeks ago fade into forgotten daily files

This project provides three extensions that help OpenClaw manage itself better.

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

No day is lost: Days 1-2 are in short-term, Day 3 gets processed by the maintainer before falling out of the short-term window.

## Components

### 1. Session Handoff (Hook)

Bridges the gap between sessions. When you run `/new` or context gets compacted, the active task context is summarized and saved to SESSION-STATE.md. The next session picks it up automatically.

**What it does:**
- `command:new` → LLM summarizes current session → saves SESSION-STATE.md
- `agent:bootstrap` → injects SESSION-STATE.md into new session context
- Memory flush → updates SESSION-STATE.md before compaction

See [hooks/session-handoff/](hooks/session-handoff/) for setup instructions.

### 2. Memory Maintainer (Cron Job)

Automated curation of MEMORY.md. Runs every 3 days, reads recent daily files, extracts lasting knowledge, and removes outdated entries.

**What it does:**
- Reads daily files from the last 3 days
- Updates MEMORY.md with new long-term facts (people, preferences, projects, decisions)
- Removes completed projects, outdated info, redundant entries
- Checks workspace file sizes and warns if limits are exceeded
- Keeps MEMORY.md under 10KB

**What belongs in MEMORY.md:**
- Facts about the user (preferences, people, interests)
- Active projects and their status
- Architecture decisions
- Relationships and people

**What stays in daily files:**
- Debugging sessions
- One-off completed tasks
- Setup instructions
- Step-by-step logs

See [cron/memory-maintainer/](cron/memory-maintainer/) for the full prompt and setup.

### 3. Workspace Housekeeping (Skill)

A skill containing the knowledge about what belongs where. Loaded only when cleanup is needed — zero token overhead in daily use.

**Recommended file size limits:**

| File | Purpose | Max Size |
|------|---------|----------|
| AGENTS.md | How the agent works (rules, behavior) | 4KB |
| SOUL.md | Who the agent is (core personality) | 2KB |
| USER.md | Who the user is (basics) | 1KB |
| IDENTITY.md | Quick profile card | 0.5KB |
| TOOLS.md | What tools are available | 3KB |
| MEMORY.md | What the agent knows (long-term) | 10KB |
| HEARTBEAT.md | Periodic task checklist | 1KB |

**The golden rule:** If information doesn't belong in a file, move it to where it does:
- Technical details → TOOLS.md or respective skill
- Project info → MEMORY.md
- Personality → SOUL.md
- Hardware configs → respective skill
- Daily events → daily memory files

See [skills/workspace-housekeeping/](skills/workspace-housekeeping/) for the full skill.

## The Self-Maintaining Loop

```
Daily: Memory flush saves context before compaction (native OpenClaw)
  ↓
Every 3 days: Memory maintainer curates MEMORY.md + checks file sizes
  ↓
When needed: File size warning → load housekeeping skill → review → clean up
```

The user stays in control: the maintainer curates autonomously, but housekeeping changes are always proposed and confirmed before execution.

## Workspace File Guide

Quick reference for what belongs where:

**AGENTS.md** — Operating manual. Rules, safety, workflows. NOT project details, NOT tool configs. **Write in English** (better instruction adherence).

**SOUL.md** — Core personality. Character traits, values, boundaries. NOT behavior rules, NOT communication tips. **Write in your native language** (personality lives in its language).

**TOOLS.md** — Quick reference for available tools. Short commands, NOT detailed hardware configs (those go in skills). **Write in English.**

**MEMORY.md** — Curated long-term knowledge. People, preferences, projects, decisions. NOT daily logs, NOT debugging details. **Write in your native language.**

### Language Policy

Models follow English instructions ~20-30% better than non-English. Recommendation:
- **English:** AGENTS.md, TOOLS.md (instructions the model must follow)
- **Native language:** SOUL.md, USER.md, IDENTITY.md, MEMORY.md (personality and context)
- **Agent replies:** In the user's language (configured in SOUL.md or AGENTS.md)

### Protected Sections

The housekeeping skill defines which sections in AGENTS.md are **locked** (never remove) vs **adjustable** (can be refined). This prevents cleanup from accidentally removing critical rules like safety policies or response style guidelines. See the [housekeeping skill](skills/workspace-housekeeping/SKILL.md) for details.

## Setup

1. Copy `hooks/session-handoff/` to `~/.openclaw/hooks/`
2. Copy `skills/workspace-housekeeping/` to your workspace `skills/` directory
3. Enable the hook in your OpenClaw config (see hook README)
4. Set up the memory-maintainer cron job (see cron README)
5. Create your MEMORY.md if it doesn't exist
6. Add a housekeeping reference to your AGENTS.md

## Changelog

### v1.1.0 (2026-02-09)
- Housekeeping skill rewritten in English (better model instruction adherence)
- Added language policy: English for instruction files, native language for personality/context
- Added protected vs adjustable sections (prevents accidental deletion of critical rules)
- Added response style guidance (brevity rules to reduce token usage)
- Memory maintainer now references housekeeping skill in warnings
- Cron warning message updated with skill load hint

### v1.0.0 (2026-02-08)
- Initial release
- 3-layer memory model (short-term → long-term → archive)
- Memory maintainer cron job (every 3 days, automated MEMORY.md curation)
- Workspace housekeeping skill with file size monitoring
- Session handoff hook (renamed from simme-memory v3.1.0)
- Workspace file guide (AGENTS.md, SOUL.md, TOOLS.md, MEMORY.md sizing and content rules)

## License

MIT
