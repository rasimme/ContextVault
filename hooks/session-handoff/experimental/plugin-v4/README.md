# Simme Memory Plugin v4 (Experimental)

⚠️ **This plugin registers a `before_compaction` hook that OpenClaw doesn't currently trigger.**

## Status

| Hook | Status |
|------|--------|
| `command:new` | ✅ Works |
| `agent:bootstrap` | ✅ Works |
| `before_compaction` | ❌ Not triggered by OpenClaw |

## Why Experimental?

OpenClaw's Plugin SDK defines `before_compaction` as a valid hook type, but the compaction pipeline doesn't call it yet. This plugin is "future-ready" - it will work automatically once OpenClaw wires up the hook.

## Current Workaround

Use the Memory Flush prompt instead (see main README).

## Installation (when OpenClaw supports before_compaction)

```bash
cp -r . ~/.openclaw/extensions/simme-memory/
openclaw gateway restart
```

## Files

- `index.ts` - Plugin implementation
- `openclaw.plugin.json` - Plugin manifest
- `package.json` - NPM metadata
