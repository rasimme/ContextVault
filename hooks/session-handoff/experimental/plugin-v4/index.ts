/**
 * Session Handoff Plugin v4 (Experimental)
 * (formerly Simme Memory Plugin v4)
 * 
 * Automatic session context management with LLM summarization:
 * - On /new: LLM summarizes the session → saves to SESSION-STATE.md
 * - On before_compaction: LLM summarizes → updates SESSION-STATE.md
 * - On bootstrap: Injects SESSION-STATE.md into agent context
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const SESSION_STATE_FILE = 'SESSION-STATE.md';
const MAX_MESSAGES = 50;
const MAX_CHARS_PER_MESSAGE = 500;

// Plugin config interface
interface SimmeMemoryConfig {
  enabled?: boolean;
  model?: string;
  debug?: boolean;
}

// Logging helper
let debugEnabled = false;
function log(message: string, ...args: any[]) {
  console.log(`[simme-memory] ${message}`, ...args);
}
function debug(message: string, ...args: any[]) {
  if (debugEnabled) console.log(`[simme-memory:debug] ${message}`, ...args);
}

interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
}

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function extractTextContent(content: any): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((block: any) => block.type === 'text' && block.text)
      .map((block: any) => block.text)
      .join('\n');
  }
  return '';
}

async function readLastMessages(sessionFile: string, maxMessages: number): Promise<TranscriptMessage[]> {
  if (!fileExists(sessionFile)) return [];

  const messages: TranscriptMessage[] = [];
  
  try {
    const fileStream = fs.createReadStream(sessionFile);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'message' && entry.message) {
          const msg = entry.message;
          if (msg.role === 'user' || msg.role === 'assistant') {
            const text = extractTextContent(msg.content);
            if (text.trim()) {
              messages.push({
                role: msg.role,
                content: text.substring(0, MAX_CHARS_PER_MESSAGE)
              });
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    log('Error reading transcript:', err);
    return [];
  }

  return messages.slice(-maxMessages);
}

function formatConversationForPrompt(messages: TranscriptMessage[]): string {
  return messages.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  }).join('\n\n');
}

async function summarizeWithLLM(
  conversation: string, 
  config: any, 
  agentId: string,
  pluginConfig: SimmeMemoryConfig
): Promise<string | null> {
  const gatewayPort = config?.gateway?.port ?? 18789;
  const gatewayToken = config?.gateway?.auth?.token;
  const model = pluginConfig.model || 'anthropic/claude-haiku-4-5';
  
  if (!gatewayToken) {
    log('No gateway token available');
    return null;
  }

  const systemPrompt = `You are summarizing a conversation session. Create a concise SESSION-STATE.md that captures:

1. **Current Task** - What was being worked on
2. **Key Context** - Important facts, decisions, or discoveries  
3. **Pending Actions** - What still needs to be done
4. **Blockers** - Any issues or problems encountered

Keep it brief and actionable. Use bullet points. Focus on what the next session needs to know to continue effectively.

Format your response as markdown, starting with "## Current Task".`;

  const userPrompt = `Summarize this conversation into a SESSION-STATE.md:\n\n${conversation}`;
  const sessionKey = `agent:${agentId}:simme-memory-worker`;

  try {
    debug(`Calling LLM (${model})...`);
    const response = await fetch(`http://localhost:${gatewayPort}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`,
        'x-openclaw-session-key': sessionKey
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('LLM request failed:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (content) {
      debug('LLM summary generated');
      
      // Cleanup worker session
      try {
        await fetch(`http://localhost:${gatewayPort}/v1/gateway/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gatewayToken}`
          },
          body: JSON.stringify({
            method: 'sessions.delete',
            params: { key: sessionKey }
          })
        });
      } catch {}
      
      return content;
    }
  } catch (err) {
    log('LLM request error:', err);
  }

  return null;
}

function createFallbackContent(messages: TranscriptMessage[]): string {
  const formatted = messages.slice(-10).map(msg => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    return `### ${role}\n${msg.content}`;
  }).join('\n\n');

  return `## Recent Conversation (Fallback)

*LLM summarization failed. Showing last 10 messages.*

${formatted}`;
}

async function updateSessionState(
  workspace: string,
  sessionFile: string | undefined,
  sessionKey: string,
  config: any,
  pluginConfig: SimmeMemoryConfig,
  trigger: 'new' | 'compaction'
): Promise<boolean> {
  const sessionStatePath = path.join(workspace, SESSION_STATE_FILE);

  // Read messages
  let messages: TranscriptMessage[] = [];
  if (sessionFile && fileExists(sessionFile)) {
    messages = await readLastMessages(sessionFile, MAX_MESSAGES);
    debug(`Read ${messages.length} messages from ${sessionFile}`);
  }

  if (messages.length === 0) {
    debug('No messages to save');
    return false;
  }

  const conversation = formatConversationForPrompt(messages);
  const agentId = sessionKey.split(':')[1] || 'main';
  
  let summaryContent = await summarizeWithLLM(conversation, config, agentId, pluginConfig);
  
  if (!summaryContent) {
    log('Using fallback (no LLM)');
    summaryContent = createFallbackContent(messages);
  }

  const timestamp = new Date().toISOString();
  const triggerLabel = trigger === 'compaction' ? 'Pre-compaction update' : 'Session reset';
  
  const content = `# SESSION-STATE.md

> Previous session context. Continue where you left off.

*Last updated: ${timestamp}*
*Session: ${sessionKey}*
*Trigger: ${triggerLabel}*

---

${summaryContent}

---

*Auto-generated by simme-memory plugin v4*
`;

  try {
    fs.writeFileSync(sessionStatePath, content, 'utf-8');
    log(`Saved (${trigger}): ${sessionStatePath}`);
    return true;
  } catch (err) {
    log('Failed to save:', err);
    return false;
  }
}

function resolveWorkspaceDir(context: any): string | null {
  if (context.workspaceDir) return context.workspaceDir;
  
  const sessionEntry = context.previousSessionEntry || context.sessionEntry;
  if (sessionEntry?.systemPromptReport?.workspaceDir) {
    return sessionEntry.systemPromptReport.workspaceDir;
  }
  
  const cfg = context.cfg;
  if (cfg?.agents?.defaults?.workspace) return cfg.agents.defaults.workspace;
  if ((cfg as any)?.workspace?.dir) return (cfg as any).workspace.dir;
  
  return null;
}

function resolveSessionFile(context: any): string | undefined {
  const sessionEntry = context.previousSessionEntry || context.sessionEntry;
  return sessionEntry?.transcriptPath || sessionEntry?.sessionFile || context.sessionFile;
}

// ============================================================================
// PLUGIN EXPORT
// ============================================================================

export default function register(api: any) {
  const pluginConfig: SimmeMemoryConfig = api.config?.plugins?.entries?.['simme-memory']?.config || {};
  debugEnabled = pluginConfig.debug || false;
  
  log('Plugin loaded (v4)');
  debug('Config:', pluginConfig);

  // Register for command:new (session reset)
  api.registerHook(['command:new'], async (event: any) => {
    log('Triggered: command:new');
    
    const workspace = resolveWorkspaceDir(event.context);
    if (!workspace) {
      log('No workspace directory found');
      return;
    }

    const sessionFile = resolveSessionFile(event.context);
    const config = event.context.cfg;

    const saved = await updateSessionState(
      workspace,
      sessionFile,
      event.sessionKey,
      config,
      pluginConfig,
      'new'
    );

    if (saved) {
      event.messages.push('🧠 Session state saved');
    }
  });

  // Register for before_compaction (context about to be compressed)
  api.registerHook(['before_compaction'], async (event: any) => {
    log('Triggered: before_compaction');
    
    const workspace = resolveWorkspaceDir(event.context);
    if (!workspace) {
      log('No workspace directory found');
      return;
    }

    const sessionFile = resolveSessionFile(event.context);
    const config = event.context.cfg;

    await updateSessionState(
      workspace,
      sessionFile,
      event.sessionKey,
      config,
      pluginConfig,
      'compaction'
    );
    
    // Note: Don't push to event.messages for compaction - it's a silent operation
  });

  // Register for agent:bootstrap (session start - inject context)
  api.registerHook(['agent:bootstrap'], async (event: any) => {
    debug('Triggered: agent:bootstrap');
    
    const workspace = event.context.workspaceDir;
    if (!workspace) return;

    const sessionStatePath = path.join(workspace, SESSION_STATE_FILE);
    
    if (!fileExists(sessionStatePath)) {
      debug('No SESSION-STATE.md found');
      return;
    }

    const content = readFileSafe(sessionStatePath);
    if (!content?.trim()) return;

    if (Array.isArray(event.context.bootstrapFiles)) {
      event.context.bootstrapFiles.push({
        path: SESSION_STATE_FILE,
        content: content,
        virtual: true
      });
      log('Injected SESSION-STATE.md into bootstrap');
    }
  });

  log('Hooks registered: command:new, before_compaction, agent:bootstrap');
}
