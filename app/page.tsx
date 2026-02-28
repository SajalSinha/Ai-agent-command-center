'use client';
import { useState, useRef, useEffect } from 'react';

const AGENTS = [
  { id:'aria',   e:'📧', name:'Aria',   role:'Email Agent',    kw:['email','gmail','inbox','reply','message','unread'] },
  { id:'dex',    e:'📁', name:'Dex',    role:'Drive Agent',    kw:['drive','document','file','doc','folder'] },
  { id:'nova',   e:'🎨', name:'Nova',   role:'Design Agent',   kw:['design','canva','figma','presentation','poster','slide'] },
  { id:'scout',  e:'🔍', name:'Scout',  role:'Research Agent', kw:['search','research','news','find','latest','trend','web'] },
  { id:'voyage', e:'🗺️', name:'Voyage', role:'Travel Agent',   kw:['trip','travel','hotel','restaurant','weather','map','place','city'] },
  { id:'blitz',  e:'🏆', name:'Blitz',  role:'Sports Agent',   kw:['sport','score','nba','nfl','cricket','soccer','football','tennis','ipl'] },
  { id:'quill',  e:'✍️', name:'Quill',  role:'Writer Agent',   kw:['write','blog','post','article','content','draft','linkedin'] },
  { id:'byte',   e:'💻', name:'Byte',   role:'Code Agent',     kw:['code','script','python','automate','program'] },
  { id:'forge',  e:'📄', name:'Forge',  role:'Document Agent', kw:['word','excel','pdf','spreadsheet','invoice','report'] },
];

type Msg = { role: 'user' | 'assistant'; content: string; agents?: string[]; time?: string };
type AgentStatus = 'idle' | 'working' | 'done';
type ActivityItem = { text: string; color: string; id: number };

function inferAgents(text: string) {
  const l = text.toLowerCase();
  return AGENTS.filter(a => a.kw.some(k => l.includes(k))).map(a => a.name);
}

// Determine which API routes to call based on message
async function runTools(userMsg: string): Promise<Record<string, unknown>> {
  const l = userMsg.toLowerCase();
  const results: Record<string, unknown> = {};

  const calls: Promise<void>[] = [];

  if (/search|research|news|latest|find out|trend|web|look up/i.test(l)) {
    calls.push(
      fetch('/api/search', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ query: userMsg }) })
        .then(r => r.json()).then(d => { results['Scout (Web Search)'] = d; }).catch(() => {})
    );
  }

  if (/weather|temperature|forecast|rain|sunny/i.test(l)) {
    const cityMatch = l.match(/(?:weather|temperature|forecast) (?:in|at|for) ([a-z\s]+)/);
    const city = cityMatch?.[1]?.trim() ?? 'Mumbai';
    calls.push(
      fetch('/api/weather', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ city }) })
        .then(r => r.json()).then(d => { results['Voyage (Weather)'] = d; }).catch(() => {})
    );
  }

  if (/sport|score|nba|nfl|cricket|ipl|soccer|football|tennis|match|game/i.test(l)) {
    const sport = /cricket|ipl/.test(l) ? 'cricket' : /nfl/.test(l) ? 'nfl' : /epl|premier/.test(l) ? 'epl' : 'nba';
    calls.push(
      fetch('/api/sports', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ sport }) })
        .then(r => r.json()).then(d => { results['Blitz (Sports)'] = d; }).catch(() => {})
    );
  }

  if (/email|gmail|inbox|unread|message/i.test(l)) {
    const q = /unread/.test(l) ? 'is:unread' : /urgent|important/.test(l) ? 'is:important is:unread' : 'is:unread';
    calls.push(
      fetch('/api/gmail', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'list', query: q }) })
        .then(r => r.json()).then(d => { results['Aria (Gmail)'] = d; }).catch(() => {})
    );
  }

  if (/drive|document|file|find.*doc|search.*file/i.test(l)) {
    const qMatch = l.match(/(?:find|search|look for) (.+?) (?:in|on) (?:drive|docs?)/);
    const q = qMatch?.[1] ?? userMsg.slice(0, 50);
    calls.push(
      fetch('/api/drive', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ query: q }) })
        .then(r => r.json()).then(d => { results['Dex (Drive)'] = d; }).catch(() => {})
    );
  }

  await Promise.all(calls);
  return results;
}

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [agentStatus, setAgentStatus] = useState<Record<string, AgentStatus>>({});
  const [activity, setActivity] = useState<ActivityItem[]>([
    { text: 'All agents online', color: 'g', id: 1 },
    { text: 'Max ready for commands', color: 'p', id: 2 },
  ]);
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const actId = useRef(3);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, loading]);

  function addActivity(text: string, color = '') {
    setActivity(prev => [{ text, color, id: actId.current++ }, ...prev].slice(0, 14));
  }

  function setStatus(names: string[], status: AgentStatus) {
    const m: Record<string, AgentStatus> = {};
    AGENTS.forEach(a => { m[a.id] = agentStatus[a.id] ?? 'idle'; });
    names.forEach(name => {
      const a = AGENTS.find(x => x.name === name);
      if (a) m[a.id] = status;
    });
    setAgentStatus(m);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: text, time }]);

    const toActivate = inferAgents(text);
    if (!toActivate.length) toActivate.push('Scout', 'Quill');
    setStatus(toActivate, 'working');
    toActivate.forEach(n => addActivity(`${n} activated`, 'p'));
    setLoading(true);

    try {
      // Run real tool calls in parallel
      const toolResults = await runTools(text);
      if (Object.keys(toolResults).length > 0) {
        addActivity(`${Object.keys(toolResults).length} agent(s) fetched data`, 'c');
      }

      // Send to Max (Groq) with tool results as context
      const history = [...messages, { role: 'user' as const, content: text }].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, toolResults }),
      });

      const data = await res.json();
      const reply = data.reply ?? data.error ?? 'Something went wrong.';
      const usedAgents = [...new Set([...toActivate, ...inferAgents(reply)])];

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        agents: usedAgents,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);

      setStatus(usedAgents, 'done');
      usedAgents.forEach(n => addActivity(`${n} completed`, 'g'));
      addActivity('Max delivered response', 'c');
      setTimeout(() => setAgentStatus({}), 4000);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Couldn't reach the backend. Check your API keys and try again.", time }]);
      setAgentStatus({});
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  function getStatusClass(id: string) {
    return agentStatus[id] ?? 'idle';
  }

  const S: React.CSSProperties = {};

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr 290px', height:'100vh', position:'relative', zIndex:1 }}>

      {/* SIDEBAR */}
      <div style={{ background:'#10101a', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'3px' }}>
            <div style={{ width:28, height:28, background:'linear-gradient(135deg,#7c3aed,#06b6d4)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🤖</div>
            <span style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:15, color:'#fff' }}>Agent HQ</span>
          </div>
          <div style={{ fontSize:10, color:'#52526e', letterSpacing:'0.04em', marginLeft:38 }}>9 agents · All live</div>
        </div>

        <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', color:'#52526e', padding:'12px 14px 4px' }}>Squad Leader</div>
        <div style={{ margin:'0 8px 4px', padding:'11px', background:'linear-gradient(135deg,rgba(124,58,237,0.14),rgba(6,182,212,0.07))', border:'1px solid rgba(124,58,237,0.3)', borderRadius:11 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, position:'relative', flexShrink:0 }}>
              🎖️
              <div style={{ position:'absolute', top:-4, right:-4, background:'#7c3aed', color:'#fff', fontSize:7, padding:'1px 4px', borderRadius:4, fontFamily:'Syne', fontWeight:700 }}>LEAD</div>
            </div>
            <div>
              <div style={{ fontFamily:'Syne, sans-serif', fontWeight:800, fontSize:14, color:'#fff' }}>Max</div>
              <div style={{ fontSize:10, color:'#a78bfa' }}>Orchestrator · Talk to me</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.12em', color:'#52526e', padding:'10px 14px 4px' }}>Specialist Agents</div>
        <div style={{ flex:1, overflowY:'auto', padding:'0 8px 12px' }}>
          {AGENTS.map(a => (
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 10px', borderRadius:9, marginBottom:2 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:'#1e1e30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, position:'relative' }}>
                {a.e}
                <div style={{ position:'absolute', bottom:-1, right:-1, width:6, height:6, background:'#4ade80', borderRadius:'50%', border:'1.5px solid #10101a' }} />
              </div>
              <div>
                <div style={{ fontFamily:'Syne, sans-serif', fontSize:12, fontWeight:600, color:'#fff' }}>{a.name}</div>
                <div style={{ fontSize:10, color:'#52526e' }}>{a.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CHAT */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:'#080810' }}>
        {/* Topbar */}
        <div style={{ padding:'13px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:12, background:'rgba(8,8,16,0.9)', backdropFilter:'blur(10px)', flexShrink:0 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🎖️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:14, color:'#fff' }}>Max — Squad Leader</div>
            <div style={{ fontSize:11, color: loading ? '#fcd34d' : '#4ade80', display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:5, height:5, background: loading ? '#fcd34d' : '#4ade80', borderRadius:'50%' }} />
              {loading ? 'Coordinating agents...' : 'Ready to deploy your agents'}
            </div>
          </div>
          <div style={{ background:'#18182a', border:'1px solid rgba(255,255,255,0.06)', borderRadius:100, padding:'4px 12px', fontSize:10, color:'#7070a0', display:'flex', alignItems:'center', gap:5 }}>
            ⚡ 9 agents ready
          </div>
        </div>

        {/* Messages */}
        <div ref={msgsRef} style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign:'center', margin:'auto', padding:'32px 16px' }}>
              <div style={{ width:64, height:64, margin:'0 auto 16px', background:'linear-gradient(135deg,#7c3aed,#06b6d4)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, boxShadow:'0 16px 48px rgba(124,58,237,0.28)' }}>🎖️</div>
              <div style={{ fontFamily:'Syne, sans-serif', fontSize:22, fontWeight:800, color:'#fff', marginBottom:10 }}>Hey, I&apos;m Max.</div>
              <div style={{ fontSize:13, color:'#7070a0', lineHeight:1.7, maxWidth:360, margin:'0 auto 20px' }}>Your Squad Leader. Tell me what you need — I&apos;ll coordinate the right agents and get it done.</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
                {[
                  ['📧 Check emails','Check my emails and tell me what\'s urgent'],
                  ['🗺️ Plan a trip','Plan a weekend trip to Goa for 2 people'],
                  ['🔍 Research topic','Research the latest AI agent frameworks in 2025'],
                  ['🏆 Sports scores','What are the latest NBA scores and standings?'],
                  ['✍️ Write content','Write a LinkedIn post about productivity with AI'],
                  ['📁 Search Drive','Search my Google Drive for any project plans'],
                ].map(([label, q]) => (
                  <button key={label} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    style={{ background:'#18182a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'7px 13px', fontSize:11, color:'#7070a0', cursor:'pointer', fontFamily:'DM Mono, monospace', transition:'all 0.15s' }}
                    onMouseOver={e => { (e.target as HTMLElement).style.borderColor='rgba(124,58,237,0.4)'; (e.target as HTMLElement).style.color='#e2e2f0'; }}
                    onMouseOut={e => { (e.target as HTMLElement).style.borderColor='rgba(255,255,255,0.1)'; (e.target as HTMLElement).style.color='#7070a0'; }}
                  >{label}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display:'flex', gap:9, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width:28, height:28, borderRadius:8, background: m.role === 'user' ? '#1e1e30' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0, alignSelf:'flex-end', border: m.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                {m.role === 'user' ? '👤' : '🎖️'}
              </div>
              <div style={{ maxWidth:'73%' }}>
                <div style={{ fontSize:10, color:'#52526e', marginBottom:4, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                  {m.role === 'user' ? `You · ${m.time}` : `Max · Squad Leader · ${m.time}`}
                </div>
                <div style={{ padding:'11px 14px', borderRadius:12, fontSize:13, lineHeight:1.65, background: m.role === 'user' ? 'rgba(124,58,237,0.15)' : '#18182a', border: m.role === 'user' ? '1px solid rgba(124,58,237,0.28)' : '1px solid rgba(255,255,255,0.06)', borderBottomRightRadius: m.role === 'user' ? 3 : 12, borderBottomLeftRadius: m.role === 'assistant' ? 3 : 12 }}>
                  {m.agents && m.agents.length > 0 && (
                    <div style={{ marginBottom:8 }}>
                      {m.agents.map(n => (
                        <span key={n} style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.22)', borderRadius:5, padding:'2px 7px', fontSize:9, color:'#a78bfa', margin:'0 3px 6px 0' }}>⚡ {n}</span>
                      ))}
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }} />
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display:'flex', gap:9, alignItems:'center' }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#7c3aed,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🎖️</div>
              <div style={{ padding:'11px 14px', background:'#18182a', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px 12px 12px 3px', display:'flex', gap:4 }}>
                {[0,1,2].map(i => <span key={i} style={{ width:5, height:5, background:'#52526e', borderRadius:'50%', display:'inline-block', animation:`bounce 1.2s ease ${i*0.15}s infinite` }} />)}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding:'13px 18px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(8,8,16,0.95)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:10, background:'#18182a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 13px' }}>
            <textarea ref={inputRef} value={input} rows={1}
              onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,110)+'px'; }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Tell Max what you need..."
              style={{ flex:1, background:'none', border:'none', outline:'none', fontFamily:'DM Mono, monospace', fontSize:13, color:'#e2e2f0', resize:'none', maxHeight:110, lineHeight:1.5 }}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#7c3aed,#5b21b6)', border:'none', cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: loading || !input.trim() ? 0.4 : 1, flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div style={{ fontSize:10, color:'#52526e', textAlign:'center', marginTop:6 }}>Enter to send · Shift+Enter for new line · Max coordinates all 9 agents</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ background:'#10101a', borderLeft:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'15px 13px', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em', color:'#52526e' }}>Agent Team Status</div>
        <div style={{ flex:1, overflowY:'auto', padding:'9px', display:'flex', flexDirection:'column', gap:4 }}>
          {AGENTS.map(a => {
            const s = getStatusClass(a.id);
            return (
              <div key={a.id} style={{ background: s === 'working' ? 'rgba(245,158,11,0.04)' : s === 'done' ? 'rgba(74,222,128,0.03)' : '#18182a', border: `1px solid ${s === 'working' ? 'rgba(245,158,11,0.3)' : s === 'done' ? 'rgba(74,222,128,0.22)' : 'rgba(255,255,255,0.06)'}`, borderRadius:9, padding:'8px 10px', display:'flex', alignItems:'center', gap:9, transition:'all 0.3s' }}>
                <div style={{ width:30, height:30, borderRadius:7, background:'#1e1e30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{a.e}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'Syne, sans-serif', fontSize:11, fontWeight:700, color:'#fff' }}>{a.name}</div>
                  <div style={{ fontSize:9, color:'#52526e' }}>{a.role}</div>
                </div>
                <div style={{ fontSize:9, padding:'2px 7px', borderRadius:5, flexShrink:0, background: s === 'working' ? 'rgba(245,158,11,0.12)' : s === 'done' ? 'rgba(74,222,128,0.1)' : 'rgba(82,82,110,0.25)', color: s === 'working' ? '#fcd34d' : s === 'done' ? '#4ade80' : '#7070a0' }}>
                  {s === 'idle' ? 'Idle' : s === 'working' ? 'Working…' : 'Done ✓'}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'9px' }}>
          <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.1em', color:'#52526e', marginBottom:7 }}>Activity Log</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:100, overflowY:'auto' }}>
            {activity.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:5, fontSize:10, color:'#7070a0', lineHeight:1.35 }}>
                <div style={{ width:4, height:4, borderRadius:'50%', background: a.color === 'g' ? '#4ade80' : a.color === 'p' ? '#a78bfa' : a.color === 'c' ? '#67e8f9' : '#52526e', flexShrink:0, marginTop:4 }} />
                <span>{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-5px);opacity:1} }
      `}</style>
    </div>
  );
}

function formatMsg(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:#a0a0c0">$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:1px 5px;font-size:11px;color:#a78bfa">$1</code>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}
