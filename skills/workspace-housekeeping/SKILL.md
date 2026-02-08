# Workspace Housekeeping Skill

Anleitung zum Aufräumen und Pflegen der Workspace MD-Files.
Wird geladen wenn der Memory Maintainer eine Warnung gibt oder ein manuelles Review ansteht.

---

## File-Architektur

| File | Zweck | Max Größe | Gepflegt durch |
|------|-------|-----------|---------------|
| AGENTS.md | WIE ich arbeite (Regeln, Verhalten) | 4KB | Manuell (Simeon + Agent) |
| SOUL.md | WER ich bin (Kern-Persönlichkeit) | 2KB | Selten, nur bei echter Evolution |
| USER.md | WEM ich helfe (Simeons Basics) | 1KB | Selten |
| IDENTITY.md | Quick-Steckbrief | 0.5KB | Selten |
| TOOLS.md | WAS ich kann (Tool-Übersicht) | 3KB | Bei neuen/entfernten Tools |
| MEMORY.md | WAS ich weiß (Long-term) | 10KB | Cron Job (memory-maintainer) |
| HEARTBEAT.md | Periodische Tasks | 1KB | Bei Bedarf |

## Was gehört wohin?

### AGENTS.md (Regeln & Verhalten)
✅ Rein:
- Sicherheitsregeln (Safety, No-Go Zones)
- Kommunikationsregeln (Group Chats, Platform-Formatting)
- Workflow-Anweisungen (Voice Messages, Progress Updates)
- File-Architektur Übersicht

❌ Raus (auslagern!):
- Technische Details → TOOLS.md oder Skill
- Projekt-Infos → MEMORY.md
- Tool-Befehle → TOOLS.md
- Persönlichkeit → SOUL.md
- Hardware/IPs → jeweiliger Skill

### SOUL.md (Persönlichkeit)
✅ Rein:
- Kern-Charakter (Ehrlichkeit, Humor, Loyalität, Ehrgeiz)
- Grundlegende Grenzen
- Sprache

❌ Raus:
- Verhaltensregeln → AGENTS.md
- Ton-nach-Kontext Tabellen → AGENTS.md
- Kommunikations-Tipps → AGENTS.md
- Wissen über Simeon → MEMORY.md

### TOOLS.md (Tool-Übersicht)
✅ Rein:
- Kurze Auflistung aller verfügbaren Tools mit Commands
- Quick-Reference für häufig genutzte Befehle
- Lampen-/Szenen-Namen die man im Alltag braucht

❌ Raus:
- Hardware-Details (IPs, Ports, MACs) → jeweiliger Skill
- Ausführliche Anleitungen → jeweiliger Skill
- Setup-Instruktionen → jeweiliger Skill

### MEMORY.md (Langzeitwissen)
✅ Rein:
- Fakten über Simeon (Präferenzen, Background, Interessen)
- Menschen und Beziehungen
- Aktive Projekte und deren Status
- Architektur-Entscheidungen
- Wichtige Learnings

❌ Raus:
- Tagesgeschäft → Daily Files
- Technische Debugging-Details → Daily Files
- Erledigte Einmal-Tasks → Daily Files
- Setup-Logs → Daily Files

## Aufräum-Prozess

### 1. Analyse
```
Lies die betroffene Datei komplett.
Prüfe die aktuelle Größe.
Identifiziere Einträge die nicht hierhin gehören.
```

### 2. Vorschlag
```
Zeige Simeon:
- Was rausfliegen soll (mit Begründung)
- Wohin es stattdessen gehört
- Neue Größe nach Aufräumen
```

### 3. Umsetzung (nur nach Bestätigung!)
```
Verschiebe Inhalte in die richtigen Files.
Kürze die Datei.
Prüfe dass keine Information verloren geht.
```

## Größen-Warnschwellen

| File | Gelb (Hinweis) | Rot (Aufräumen nötig) |
|------|---------------|----------------------|
| AGENTS.md | >3.5KB | >4KB |
| SOUL.md | >1.5KB | >2KB |
| TOOLS.md | >2.5KB | >3KB |
| MEMORY.md | >8KB | >10KB |

## Häufige Fehler

1. **"Pack ich schnell in AGENTS.md"** — Ist es eine Regel? Wenn nein → woanders hin
2. **Tool-Details in AGENTS.md** — Befehle, IPs, Configs → TOOLS.md oder Skill
3. **Projekt-Updates in AGENTS.md** — Status-Infos → MEMORY.md
4. **SOUL.md als Regelwerk** — Ton-Tabellen, Workflows → AGENTS.md
5. **MEMORY.md mit Setup-Logs** — Debugging-Details → bleiben in Daily Files

## Checkliste für Review

- [ ] AGENTS.md: Nur Regeln & Verhalten? Unter 4KB?
- [ ] SOUL.md: Nur Kern-Persönlichkeit? Unter 2KB?
- [ ] TOOLS.md: Nur Quick-Reference? Unter 3KB?
- [ ] MEMORY.md: Nur Langzeit-Fakten? Unter 10KB?
- [ ] Keine Duplikate zwischen den Files?
- [ ] Keine veralteten Einträge?
- [ ] Technische Details in Skills statt Workspace-Files?

---

*Erstellt: 2026-02-08*
*Diesen Skill laden wenn eine Housekeeping-Warnung kommt oder ein manuelles Review ansteht.*
