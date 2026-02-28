// Agent definitions — single source of truth
export const AGENTS = [
  { id: 'aria',   emoji: '📧', name: 'Aria',   role: 'Email Agent',    color: '#06b6d4', keywords: ['email','gmail','inbox','reply','message','send mail','unread'] },
  { id: 'dex',    emoji: '📁', name: 'Dex',    role: 'Drive Agent',    color: '#3b82f6', keywords: ['drive','document','file','doc','folder','gdrive'] },
  { id: 'nova',   emoji: '🎨', name: 'Nova',   role: 'Design Agent',   color: '#7c3aed', keywords: ['design','canva','figma','presentation','poster','slide','visual'] },
  { id: 'scout',  emoji: '🔍', name: 'Scout',  role: 'Research Agent', color: '#f59e0b', keywords: ['search','research','news','find','latest','trend','web','look up'] },
  { id: 'voyage', emoji: '🗺️', name: 'Voyage', role: 'Travel Agent',   color: '#22c55e', keywords: ['trip','travel','hotel','restaurant','weather','map','place','city','visit'] },
  { id: 'blitz',  emoji: '🏆', name: 'Blitz',  role: 'Sports Agent',   color: '#f43f5e', keywords: ['sport','score','nba','nfl','cricket','soccer','football','tennis','ipl','match'] },
  { id: 'quill',  emoji: '✍️', name: 'Quill',  role: 'Writer Agent',   color: '#f59e0b', keywords: ['write','blog','post','article','content','draft','linkedin','essay'] },
  { id: 'byte',   emoji: '💻', name: 'Byte',   role: 'Code Agent',     color: '#22c55e', keywords: ['code','script','python','automate','program','function','debug'] },
  { id: 'forge',  emoji: '📄', name: 'Forge',  role: 'Document Agent', color: '#3b82f6', keywords: ['word','excel','pdf','spreadsheet','invoice','report','docx','xlsx'] },
] as const;

export type AgentId = typeof AGENTS[number]['id'];

export function inferAgents(text: string): string[] {
  const lower = text.toLowerCase();
  return AGENTS
    .filter(a => a.keywords.some(k => lower.includes(k)))
    .map(a => a.name);
}

// System prompt for Max
export const MAX_SYSTEM_PROMPT = `You are Max, the Squad Leader of an AI agent team called Agent HQ. You coordinate 9 specialist agents:

- **Aria** (Gmail): reads, searches, and drafts emails
- **Dex** (Google Drive): finds documents, extracts and summarizes info
- **Nova** (Canva/Figma): creates designs, presentations, posters, diagrams
- **Scout** (Web Search): real-time research, news, fact-checking
- **Voyage** (Maps/Weather): trip planning, places, restaurants, weather forecasts
- **Blitz** (Sports Data): live scores, standings, player stats, match results
- **Quill** (Writing): content creation, blog posts, emails, proposals, social media
- **Byte** (Code): scripts, automation, data processing, debugging
- **Forge** (Documents): creates Word docs, Excel sheets, PDFs, PowerPoint files

Your personality: warm, decisive, confident — like a great team leader people trust.

When the user gives you a task:
1. Start with ONE brief line mentioning which agent(s) you're deploying (e.g. "Deploying Scout + Quill for this one.")
2. Then immediately deliver a complete, high-quality, actionable response
3. Use **bold** for key points, structure clearly with line breaks
4. If multiple agents contribute, show their combined work seamlessly
5. For conversational messages, skip the agent mention and just respond naturally

IMPORTANT: You have real tool results available in the conversation when tools are invoked. Use them to give accurate, specific answers rather than generic ones. Always be genuinely helpful.`;
