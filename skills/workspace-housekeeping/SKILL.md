---
name: workspace-housekeeping
description: Guidelines for maintaining workspace MD files (AGENTS.md, SOUL.md, TOOLS.md, MEMORY.md). Use when file sizes exceed limits or for manual workspace cleanup and review.
---

# Workspace Housekeeping Skill

Instructions for maintaining workspace MD files.
Load when memory-maintainer warns about file sizes or for manual review.

---

## Language Policy

- **AGENTS.md, TOOLS.md** → English (model instructions, better adherence)
- **SOUL.md** → German (personality lives in its language)
- **USER.md, IDENTITY.md** → German (personal context)
- **MEMORY.md** → German (facts about German-speaking user)
- **Agent replies** → German (unless user asks otherwise)

## File Architecture

| File | Purpose | Max Size | Maintained by |
|------|---------|----------|---------------|
| AGENTS.md | HOW I work (rules, behavior) | 4KB | Manual (user + agent) |
| SOUL.md | WHO I am (core personality) | 2KB | Rare, only true evolution |
| USER.md | WHO I help (user basics) | 1KB | Rare, user-driven |
| IDENTITY.md | Quick profile card | 0.5KB | Rare, user-driven |
| TOOLS.md | WHAT I can do (tool reference) | 3KB | When tools change |
| MEMORY.md | WHAT I know (long-term) | 10KB | Cron (memory-maintainer) |
| HEARTBEAT.md | Periodic task checklist | 1KB | As needed |

## Protected Sections (NEVER remove or change intent)

### AGENTS.md — these sections are LOCKED:
- **Response Style** — Brevity rules (2-4 sentences default)
- **Safety** — Security rules, trash > rm
- **No-Go Zones** — Moltbook isolation
- **Reminders** — sessionTarget: isolated + delivery config

### AGENTS.md — these sections are ADJUSTABLE:
- Heartbeat schedule/details
- Platform-Formatting specifics
- Commands list
- File architecture table
- Group Chat rules (can refine, not remove)
- Progress Updates format
- Voice Messages instructions

### SOUL.md — PROTECTED
- Only the agent may evolve this file, and MUST inform user
- Housekeeper may trim if >2KB, but never change personality traits
- Core values (honesty, humor, loyalty, ambition) are permanent

### USER.md / IDENTITY.md — READ-ONLY for housekeeper
- Only user changes these

### TOOLS.md — FULLY ADJUSTABLE
- Add/remove tools as they change
- Keep as quick-reference, no detailed guides

### MEMORY.md — MANAGED BY CRON
- Housekeeper only checks size, does not edit content
- memory-maintainer cron handles curation

## What Goes Where

### AGENTS.md (Rules & Behavior)
✅ In: Safety, communication rules, workflow instructions, response style
❌ Out: Technical details → TOOLS.md, project info → MEMORY.md, 
   tool commands → TOOLS.md, personality → SOUL.md

### SOUL.md (Personality)
✅ In: Core character, boundaries, language preference
❌ Out: Behavior rules → AGENTS.md, knowledge → MEMORY.md

### TOOLS.md (Tool Reference)
✅ In: Available tools with commands, scene names, quick reference
❌ Out: Hardware details → skill files, setup guides → skill files

### MEMORY.md (Long-term Knowledge)
✅ In: User facts, people, projects, architecture decisions
❌ Out: Daily tasks → daily files, debug logs → daily files

## Cleanup Process

### 1. Analyze
- Read the file, check size
- Identify entries that don't belong

### 2. Propose (ALWAYS show user first!)
- What to remove (with reason)
- Where it moves to
- New size after cleanup

### 3. Execute (only after user confirmation!)
- Move content to correct files
- Trim the file
- Verify no information lost

## Size Thresholds

| File | Yellow (notice) | Red (cleanup needed) |
|------|----------------|---------------------|
| AGENTS.md | >3.5KB | >4KB |
| SOUL.md | >1.5KB | >2KB |
| TOOLS.md | >2.5KB | >3KB |
| MEMORY.md | >8KB | >10KB |

## Common Mistakes

1. Dumping everything in AGENTS.md — Is it a rule? If no → elsewhere
2. Tool details in AGENTS.md → TOOLS.md or skill
3. Project updates in AGENTS.md → MEMORY.md
4. SOUL.md as rulebook → AGENTS.md
5. Setup logs in MEMORY.md → stay in daily files

## Review Checklist

- [ ] AGENTS.md: Only rules & behavior? Under 4KB? English?
- [ ] SOUL.md: Only core personality? Under 2KB?
- [ ] TOOLS.md: Only quick-reference? Under 3KB? English?
- [ ] MEMORY.md: Only long-term facts? Under 10KB?
- [ ] No duplicates between files?
- [ ] No outdated entries?
- [ ] Technical details in skills, not workspace files?
- [ ] Protected sections intact?
