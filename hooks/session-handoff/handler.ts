/**
 * Session Handoff Hook v1.1.0
 * (formerly Simme Memory v3)
 * 
 * Automatic session context management with LLM summarization:
 * - On /new: LLM summarizes the session → saves to SESSION-STATE.md
 * - On bootstrap: Injects SESSION-STATE.md into agent context
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const SESSION_STATE_FILE = 'SESSION-STATE.md';
const MAX_MESSAGES = 50; // Read more messages for better summary
const MAX_CHARS_PER_MESSAGE = 500;

interface HookEvent {
  type: 'command' | 'agent' | 'session' | 'gateway';
  action: string;
  sessionKey: string;
  timestamp: Date;
  messages: string[];
  context: {
    workspaceDir?: string;
    sessionEntry?: any;
    previousSessionEntry?: any;  // Available on command:new - has transcriptPath
    sessionId?: string;
    sessionFile?: string;
    bootstrapFiles?: Array<{
      path: string;
      content: string;
      virtual?: boolean;
    }>;
    cfg?: any;
  };
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
        // OpenClaw transcript format: {type: "message", message: {role, content}}
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
    console.error('[simme-memory] Error reading transcript:', err);
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

/**
 * Call LLM via Gateway's /v1/chat/completions endpoint
 * Uses a fixed session key to avoid creating new sessions each time
 */
async function summarizeWithLLM(conversation: string, config: any, agentId: string): Promise<string | null> {
  const gatewayPort = config?.gateway?.port ?? 18789;
  const gatewayToken = config?.gateway?.auth?.token;
  
  if (!gatewayToken) {
    console.warn('[simme-memory] No gateway token available');
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

  // Use a fixed session key per agent to reuse the same session (avoids session buildup)
  const sessionKey = `agent:${agentId}:simme-memory-worker`;

  try {
    const response = await fetch(`http://localhost:${gatewayPort}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`,
        'x-openclaw-session-key': sessionKey
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5', // Fast and cheap
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[simme-memory] LLM request failed:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (content) {
      console.log('[simme-memory] LLM summary generated');
      
      // Clean up worker session by directly editing sessions.json
      try {
        const homeDir = process.env.HOME || '/home/jetson';
        const sessionsPath = path.join(homeDir, '.openclaw', 'agents', agentId, 'sessions', 'sessions.json');
        if (fileExists(sessionsPath)) {
          const sessionsData = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
          if (sessionsData[sessionKey]) {
            delete sessionsData[sessionKey];
            fs.writeFileSync(sessionsPath, JSON.stringify(sessionsData, null, 2));
            console.log('[simme-memory] Worker session cleaned up');
          }
        }
      } catch (cleanupErr) {
        console.warn('[simme-memory] Session cleanup failed:', cleanupErr);
      }
      
      return content;
    }
  } catch (err) {
    console.error('[simme-memory] LLM request error:', err);
  }

  return null;
}

/**
 * Fallback: Just save recent messages without LLM
 */
function createFallbackContent(messages: TranscriptMessage[]): string {
  const formatted = messages.slice(-10).map(msg => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    return `### ${role}\n${msg.content}`;
  }).join('\n\n');

  return `## Recent Conversation (Fallback)

*LLM summarization failed. Showing last 10 messages.*

${formatted}`;
}

/**
 * Resolve workspace directory from event context or config
 */
function resolveWorkspaceDir(event: HookEvent): string | null {
  // Try direct context first
  if (event.context.workspaceDir) {
    return event.context.workspaceDir;
  }
  
  // Try sessionEntry's systemPromptReport (has correct workspace for the agent)
  const sessionEntry = event.context.previousSessionEntry || event.context.sessionEntry;
  if (sessionEntry?.systemPromptReport?.workspaceDir) {
    return sessionEntry.systemPromptReport.workspaceDir;
  }
  
  // Fallback: resolve from cfg (OpenClaw doesn't pass workspaceDir for command:new)
  const cfg = event.context.cfg;
  if (cfg?.agents?.defaults?.workspace) {
    return cfg.agents.defaults.workspace;
  }
  
  // Last resort: check for workspace.dir path
  if ((cfg as any)?.workspace?.dir) {
    return (cfg as any).workspace.dir;
  }
  
  return null;
}

/**
 * Handle session end (command:new)
 */
async function handleSessionEnd(event: HookEvent): Promise<void> {
  const workspace = resolveWorkspaceDir(event);
  const config = event.context.cfg;
  
  if (!workspace) {
    console.warn('[simme-memory] No workspace directory (not in context or cfg)');
    return;
  }
  
  // Try to find session file from sessionEntry or previousSessionEntry
  const sessionEntry = event.context.previousSessionEntry || event.context.sessionEntry;
  // Note: sessionEntry uses 'sessionFile' property, not 'transcriptPath'
  const sessionFile = sessionEntry?.transcriptPath || sessionEntry?.sessionFile || event.context.sessionFile;

  console.log('[simme-memory] Processing session end...');
  console.log(`[simme-memory] sessionFile: ${sessionFile}`);
  console.log(`[simme-memory] sessionEntry:`, sessionEntry);
  console.log(`[simme-memory] fileExists: ${sessionFile ? fileExists(sessionFile) : 'N/A'}`);

  const sessionStatePath = path.join(workspace, SESSION_STATE_FILE);

  // Read messages from transcript
  let messages: TranscriptMessage[] = [];
  if (sessionFile && fileExists(sessionFile)) {
    messages = await readLastMessages(sessionFile, MAX_MESSAGES);
    console.log(`[simme-memory] Read ${messages.length} messages`);
  }

  if (messages.length === 0) {
    console.log('[simme-memory] No messages to save');
    return;
  }

  // Format conversation for LLM
  const conversation = formatConversationForPrompt(messages);
  
  // Extract agentId from sessionKey (format: agent:<agentId>:<suffix>)
  const agentId = event.sessionKey.split(':')[1] || 'main';
  
  // Try LLM summarization
  let summaryContent = await summarizeWithLLM(conversation, config, agentId);
  
  // Fallback if LLM fails
  if (!summaryContent) {
    console.log('[simme-memory] Using fallback (no LLM)');
    summaryContent = createFallbackContent(messages);
  }

  // Build final SESSION-STATE.md
  const timestamp = new Date().toISOString();
  const content = `# SESSION-STATE.md

> Previous session context. Continue where you left off.

*Last updated: ${timestamp}*
*Session: ${event.sessionKey}*

---

${summaryContent}

---

*Auto-generated by simme-memory hook*
`;

  // Write SESSION-STATE.md
  try {
    fs.writeFileSync(sessionStatePath, content, 'utf-8');
    console.log(`[simme-memory] Saved: ${sessionStatePath}`);
    event.messages.push(`🧠 Session summarized and saved`);
  } catch (err) {
    console.error('[simme-memory] Failed to save:', err);
  }
}

/**
 * Handle session start (agent:bootstrap)
 */
async function handleSessionStart(event: HookEvent): Promise<void> {
  const workspace = event.context.workspaceDir;
  if (!workspace) return;

  const sessionStatePath = path.join(workspace, SESSION_STATE_FILE);
  
  if (!fileExists(sessionStatePath)) return;

  const content = readFileSafe(sessionStatePath);
  if (!content?.trim()) return;

  // Inject SESSION-STATE.md
  if (Array.isArray(event.context.bootstrapFiles)) {
    event.context.bootstrapFiles.push({
      path: SESSION_STATE_FILE,
      content: content,
      virtual: true
    });
    console.log('[simme-memory] Injected SESSION-STATE.md');
  }
}

const handler = async (event: HookEvent): Promise<void> => {
  if (event.type === 'command' && event.action === 'new') {
    await handleSessionEnd(event);
    return;
  }

  if (event.type === 'agent' && event.action === 'bootstrap') {
    await handleSessionStart(event);
    return;
  }
};

export default handler;
