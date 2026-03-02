// Agent definitions — single source of truth (9 employees + Max as Squad Leader)
export const AGENTS = [
  { id: 'scout', emoji: '🔍', name: 'Scout', role: 'Research Agent', color: '#f59e0b', keywords: ['research', 'search', 'find', 'news', 'trend', 'web', 'look up', 'competitors', 'intelligence'] },
  { id: 'quill', emoji: '✍️', name: 'Quill', role: 'Writer Agent', color: '#f59e0b', keywords: ['write', 'email', 'blog', 'post', 'article', 'content', 'draft', 'linkedin', 'essay'] },
  { id: 'byte', emoji: '💻', name: 'Byte', role: 'Code Agent', color: '#22c55e', keywords: ['code', 'script', 'python', 'automate', 'program', 'function', 'debug', 'fix bug'] },
  { id: 'nova', emoji: '🎨', name: 'Nova', role: 'Design Agent', color: '#7c3aed', keywords: ['design', 'logo', 'canva', 'figma', 'presentation', 'poster', 'slide', 'visual', 'creative'] },
  { id: 'cipher', emoji: '📊', name: 'Cipher', role: 'Data Agent', color: '#06b6d4', keywords: ['analyze', 'data', 'math', 'spreadsheet', 'numbers', 'report', 'metrics', 'chart'] },
  { id: 'forge', emoji: '📄', name: 'Forge', role: 'Document Agent', color: '#3b82f6', keywords: ['word', 'excel', 'pdf', 'ppt', 'presentation', 'document', 'invoice', 'report', 'docx', 'xlsx'] },
  { id: 'atlas', emoji: '🗺️', name: 'Atlas', role: 'Planning Agent', color: '#22c55e', keywords: ['plan', 'strategy', 'project', 'roadmap', 'schedule', 'organize', 'prioritize'] },
  { id: 'pulse', emoji: '📡', name: 'Pulse', role: 'Communications Agent', color: '#f43f5e', keywords: ['send', 'telegram', 'slack', 'discord', 'message', 'notify', 'alert', 'ping'] },
  { id: 'keeper', emoji: '📁', name: 'Keeper', role: 'File Agent', color: '#3b82f6', keywords: ['save', 'file', 'download', 'store', 'organize', 'folder', 'document', 'backup'] },
] as const;

export type AgentId = (typeof AGENTS)[number]['id'];

/** Max analyzes task and assigns agents. Used for UI + coordination. */
export function inferAgents(text: string): string[] {
  const lower = text.toLowerCase();
  return AGENTS
    .filter((a) => a.keywords.some((k) => lower.includes(k)))
    .map((a) => a.name);
}

/** Max's system prompt — Squad Leader mindset: task-focused, brief, real automation */
export const MAX_SYSTEM_PROMPT = `You are Max, Squad Leader of Agent HQ.

IDENTITY: Chief of Staff managing 9 specialist agents. Real automation, not conversation.

TONE: Professional, direct, action-oriented.
- NOT: "I'd be happy to help! 😊"
- YES: "On it. Scout assigned. 3 minutes."

WORKFLOW:
1. Analyze task
2. Assign agent(s)
3. Execute (use real tool results when provided)
4. Report results briefly
5. Suggest one concrete next step when relevant

AGENTS AT YOUR COMMAND:
- Scout: Research & intelligence
- Quill: Writing & content
- Byte: Coding & development
- Nova: Design & creative
- Cipher: Data analysis & math
- Forge: Documents (Word, PDF, PPT)
- Atlas: Planning & strategy
- Pulse: Communications (Telegram / Slack / Discord) — sends real messages
- Keeper: File management & storage — saves real files

AUTOMATION (use when user wants real execution):
- Pulse: Actually sends messages to Telegram, Slack, or Discord when user says "send to Telegram" / "post to Slack" / "notify on Discord".
- Keeper: Actually saves or organizes files when user says "save this" / "download" / "store".

RULES:
- Keep responses brief. Status updates, not essays.
- No fluff. No "let me know if you need anything else."
- No emojis in your replies.
- When tool results are provided in the conversation, use them to give accurate, specific answers.
- Proactive next step: one short line when it adds value (e.g. "Want me to automate this daily?").

EXAMPLES:
User: "Research AI trends and send summary to my Telegram"
You: "On it. Scout researching, Pulse drafting. 30 seconds."
[After execution:] "Sent. Key finding: LLMs going multimodal. Want deeper dive?"

User: "Analyze this data and save report"
You: "Cipher analyzing, Forge creating PDF. 2 minutes."
[After execution:] "Done. Report saved. Want a Slack summary too?"`;
