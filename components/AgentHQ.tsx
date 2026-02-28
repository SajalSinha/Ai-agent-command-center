'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AGENTS } from '@/lib/agents'
import styles from './AgentHQ.module.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentsUsed?: string[]
  timestamp: Date
  hasRealData?: boolean
}

type AgentStatus = 'idle' | 'working' | 'done'

const QUICK_ACTIONS = [
  { label: '📧 Check emails', prompt: "Check my unread emails and tell me what's urgent" },
  { label: '🗺️ Plan a trip', prompt: 'Plan a 2-day weekend trip to Goa for 2 people' },
  { label: '📊 Research + Slides', prompt: 'Research latest AI agent trends and summarize key points' },
  { label: '📁 Search Drive', prompt: 'Search my Google Drive for any project plans or reports' },
  { label: '✍️ Write content', prompt: 'Write a LinkedIn post about the future of AI agents in daily life' },
  { label: '🏆 Sports update', prompt: 'What are the latest Premier League scores and standings?' },
]

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
}

export default function AgentHQ() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({})
  const [activityLog, setActivityLog] = useState<Array<{ text: string; type: string }>>([
    { text: 'All agents online', type: 'green' },
    { text: 'Max ready for commands', type: 'purple' },
  ])
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [authNotice, setAuthNotice] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Check auth status from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const auth = params.get('auth')
    if (auth === 'success') {
      setIsGoogleConnected(true)
      setAuthNotice('✅ Google account connected! Aria & Dex are now active.')
      window.history.replaceState({}, '', '/')
    } else if (auth === 'error') {
      setAuthNotice('❌ Google auth failed. Please try again.')
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const addActivity = useCallback((text: string, type = '') => {
    setActivityLog(prev => [{ text, type }, ...prev].slice(0, 15))
  }, [])

  const setAgentStatus = useCallback((names: string[], status: AgentStatus) => {
    const update: Record<string, AgentStatus> = {}
    names.forEach(name => {
      const agent = AGENTS.find(a => a.name === name)
      if (agent) update[agent.id] = status
    })
    setAgentStatuses(prev => ({ ...prev, ...update }))
  }, [])

  const sendMessage = useCallback(async (text?: string) => {
    const userText = (text || input).trim()
    if (!userText || isLoading) return

    setInput('')
    setIsLoading(true)

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])

    // Optimistic agent activation
    const lowerText = userText.toLowerCase()
    const possibleAgents: string[] = []
    if (/email|gmail|inbox/.test(lowerText)) possibleAgents.push('Aria')
    if (/drive|document|file/.test(lowerText)) possibleAgents.push('Dex')
    if (/design|canva|figma|slide/.test(lowerText)) possibleAgents.push('Nova')
    if (/search|research|news|latest/.test(lowerText)) possibleAgents.push('Scout')
    if (/trip|travel|weather|map/.test(lowerText)) possibleAgents.push('Voyage')
    if (/sport|score|cricket|football|nba/.test(lowerText)) possibleAgents.push('Blitz')
    if (/write|blog|post|draft/.test(lowerText)) possibleAgents.push('Quill')
    if (/code|script|python|automat/.test(lowerText)) possibleAgents.push('Byte')
    if (/word|excel|pdf|report/.test(lowerText)) possibleAgents.push('Forge')
    if (!possibleAgents.length) possibleAgents.push('Scout', 'Quill')

    setAgentStatus(possibleAgents, 'working')
    possibleAgents.forEach(name => addActivity(`${name} activated`, 'purple'))

    try {
      // Build conversation history (last 10 messages)
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, userMessage: userText }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        agentsUsed: data.agentsUsed || possibleAgents,
        timestamp: new Date(),
        hasRealData: data.hasRealData,
      }

      setMessages(prev => [...prev, assistantMsg])

      // Update agent statuses
      setAgentStatus(possibleAgents, 'idle')
      const usedAgents = data.agentsUsed || possibleAgents
      setAgentStatus(usedAgents, 'done')
      usedAgents.forEach((name: string) => addActivity(`${name} completed`, 'green'))
      addActivity('Max delivered response', 'cyan')

      setTimeout(() => {
        setAgentStatuses({})
      }, 4000)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      const errResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I hit an issue: **${errorMsg}**\n\nPlease check your API keys in \`.env.local\` and try again.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errResponse])
      setAgentStatus(possibleAgents, 'idle')
      addActivity('Error occurred', '')
    }

    setIsLoading(false)
    inputRef.current?.focus()
  }, [input, isLoading, messages, setAgentStatus, addActivity])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className={styles.app}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>🤖</div>
            <span className={styles.brandName}>Agent HQ</span>
          </div>
          <div className={styles.brandSub}>9 agents · All systems live</div>
        </div>

        {/* Google Connect */}
        <div className={styles.connectBlock}>
          {isGoogleConnected ? (
            <div className={styles.connectedBadge}>✅ Google Connected</div>
          ) : (
            <a href="/api/auth/google" className={styles.connectBtn}>
              <span>🔗</span> Connect Google Account
            </a>
          )}
          <div className={styles.connectHint}>Enables Gmail + Drive agents</div>
        </div>

        {/* Squad Leader */}
        <div className={styles.secLabel}>Squad Leader</div>
        <div className={`${styles.slBlock}`}>
          <div className={styles.slInner}>
            <div className={styles.slAvatar}>
              🎖️
              <div className={styles.slBadge}>LEAD</div>
            </div>
            <div>
              <div className={styles.slName}>Max</div>
              <div className={styles.slRole}>Orchestrator · Talk to me</div>
            </div>
          </div>
        </div>

        {/* Agent List */}
        <div className={styles.secLabel}>Specialist Agents</div>
        <div className={styles.agentList}>
          {AGENTS.map(agent => {
            const status = agentStatuses[agent.id] || 'idle'
            return (
              <div key={agent.id} className={`${styles.aItem} ${status !== 'idle' ? styles[status] : ''}`}>
                <div className={styles.aIcon}>
                  {agent.emoji}
                  <div className={`${styles.aDot} ${status === 'working' ? styles.dotWorking : status === 'done' ? styles.dotDone : ''}`} />
                </div>
                <div>
                  <div className={styles.aName}>{agent.name}</div>
                  <div className={styles.aRole}>{agent.role}</div>
                </div>
                {status !== 'idle' && (
                  <div className={`${styles.aStatus} ${styles[`status_${status}`]}`}>
                    {status === 'working' ? '...' : '✓'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── MAIN CHAT ── */}
      <main className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles.tbAvatar}>🎖️</div>
          <div>
            <div className={styles.tbName}>Max — Squad Leader</div>
            <div className={styles.tbStatus}>
              {isLoading ? 'Coordinating agents...' : 'Ready to deploy your agents'}
            </div>
          </div>
          <div className={styles.tbBadge}>
            ⚡ {isLoading ? 'Working...' : '9 agents ready'}
          </div>
        </div>

        {/* Auth notice */}
        {authNotice && (
          <div className={styles.authNotice}>
            {authNotice}
            <button onClick={() => setAuthNotice(null)}>✕</button>
          </div>
        )}

        {/* Messages */}
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.welcome}>
              <div className={styles.wAvatar}>🎖️</div>
              <h2>Hey, I&apos;m Max.</h2>
              <p>
                Your Squad Leader. Tell me what you need — I&apos;ll coordinate the right agents
                and get it done. Just talk to me naturally.
              </p>
              <div className={styles.qaGrid}>
                {QUICK_ACTIONS.map(qa => (
                  <button
                    key={qa.label}
                    className={styles.qaBtn}
                    onClick={() => sendMessage(qa.prompt)}
                    disabled={isLoading}
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`${styles.msg} ${msg.role === 'user' ? styles.msgUser : styles.msgMax}`}>
              <div className={`${styles.mAvatar} ${msg.role === 'user' ? styles.mAvatarUser : styles.mAvatarMax}`}>
                {msg.role === 'user' ? '👤' : '🎖️'}
              </div>
              <div className={styles.mBody}>
                <div className={styles.mSender}>
                  {msg.role === 'user' ? 'You' : 'Max · Squad Leader'} ·{' '}
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {msg.agentsUsed?.length ? (
                  <div className={styles.agentTags}>
                    {msg.agentsUsed.map(name => (
                      <span key={name} className={styles.agentTag}>⚡ {name}</span>
                    ))}
                    {msg.hasRealData && <span className={styles.realDataTag}>📡 Live Data</span>}
                  </div>
                ) : null}
                <div
                  className={`${styles.mBubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleMax} bubble-content`}
                  dangerouslySetInnerHTML={{
                    __html: `<p>${formatMarkdown(msg.content)}</p>`,
                  }}
                />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className={styles.msg}>
              <div className={`${styles.mAvatar} ${styles.mAvatarMax}`}>🎖️</div>
              <div className={styles.typingDots}>
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <div className={styles.inputBox}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Tell Max what you need..."
              rows={1}
              disabled={isLoading}
              className={styles.textInput}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className={styles.sendBtn}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div className={styles.inputHint}>
            Enter to send · Shift+Enter for new line · Powered by Groq (LLaMA 3.3 70B)
          </div>
        </div>
      </main>

      {/* ── RIGHT PANEL ── */}
      <aside className={styles.rightPanel}>
        <div className={styles.panelHdr}>Agent Team Status</div>
        <div className={styles.teamList}>
          {AGENTS.map(agent => {
            const status = agentStatuses[agent.id] || 'idle'
            return (
              <div key={agent.id} className={`${styles.tc} ${status !== 'idle' ? styles[`tc_${status}`] : ''}`}>
                <div className={styles.tcIcon}>{agent.emoji}</div>
                <div>
                  <div className={styles.tcName}>{agent.name}</div>
                  <div className={styles.tcRole}>{agent.role}</div>
                </div>
                <div className={`${styles.tcStatus} ${styles[`ts_${status}`]}`}>
                  {status === 'idle' ? 'Idle' : status === 'working' ? 'Working...' : 'Done ✓'}
                </div>
              </div>
            )
          })}
        </div>
        <div className={styles.actSection}>
          <div className={styles.actLbl}>Activity Log</div>
          <div className={styles.actLog}>
            {activityLog.map((item, i) => (
              <div key={i} className={styles.actItem}>
                <div className={`${styles.actDot} ${item.type ? styles[`dot_${item.type}`] : ''}`} />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
