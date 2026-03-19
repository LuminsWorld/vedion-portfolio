import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { auth } from '../lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { MODELS, IMAGE_MODELS, CREDIT_PACKS, SUBSCRIPTIONS } from '../lib/credits'
import {
  getMe, listChats, createChat, deleteChat, renameChat,
  sendMessage, generateImage,
} from '../lib/api'

export default function AppPage() {
  const router = useRouter()
  const [user, setUser]           = useState(null)
  const [userData, setUserData]   = useState(null)
  const [chats, setChats]         = useState([])
  const [activeChatId, setActive] = useState(null)
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [model, setModel]         = useState('claude-haiku-4-5')
  const [sending, setSending]     = useState(false)
  const [showModels, setShowModels] = useState(false)
  const [tab, setTab]             = useState('chats') // 'chats' | 'account'
  const [sidebarOpen, setSidebar] = useState(true)
  const messagesEndRef            = useRef(null)

  // Auth gate
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) { router.replace('/auth'); return }
      setUser(u)
      try {
        const data = await getMe()
        setUserData(data)
      } catch (e) {
        console.error('getMe failed:', e)
        // Fallback so account tab always shows something
        setUserData({ email: u.email, plan: 'free', credits: 20 })
      }
      try {
        const { chats } = await listChats()
        setChats(chats)
      } catch (e) { console.error('listChats failed:', e) }
    })
    return unsub
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleNewChat() {
    try {
      const { chatId, title } = await createChat('New Chat')
      const newChat = { id: chatId, title }
      setChats(c => [newChat, ...c])
      setActive(chatId)
      setMessages([])
    } catch (e) {
      if (e.upgradeRequired) alert(e.error)
    }
  }

  async function handleSelectChat(chatId) {
    setActive(chatId)
    // Load messages from API
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` },
      })
      const { messages } = await res.json()
      setMessages(messages ?? [])
    } catch { setMessages([]) }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending || !activeChatId) return
    setInput('')
    setSending(true)

    // Optimistic user message
    const tempMsg = { id: Date.now(), role: 'user', content: text, type: 'text' }
    setMessages(m => [...m, tempMsg])

    try {
      const history = messages.slice(-20)
      let result

      if (IMAGE_MODELS.has(model)) {
        result = await generateImage(activeChatId, text, model)
        setMessages(m => [...m,
          { id: Date.now() + 1, role: 'assistant', content: result.imageUrl, type: 'image', model },
        ])
      } else {
        result = await sendMessage(activeChatId, text, model, history)
        setMessages(m => [...m,
          { id: Date.now() + 1, role: 'assistant', content: result.reply, type: 'text', model },
        ])
      }

      setUserData(d => d ? { ...d, credits: result.creditsRemaining } : d)

      // Update chat title after first message
      const chatTitle = text.slice(0, 40) + (text.length > 40 ? '…' : '')
      const chat = chats.find(c => c.id === activeChatId)
      if (chat?.title === 'New Chat') {
        await renameChat(activeChatId, chatTitle)
        setChats(c => c.map(x => x.id === activeChatId ? { ...x, title: chatTitle } : x))
      }
    } catch (e) {
      setMessages(m => m.filter(x => x.id !== tempMsg.id))
      if (e.upgradeRequired) alert(e.error)
      else if (e.status === 402) alert('Out of credits. Purchase more in Account.')
      else alert(e.error ?? 'Something went wrong.')
    } finally { setSending(false) }
  }

  if (!user) return <div style={{ background: '#000', minHeight: '100vh' }} />

  const currentModel = MODELS[model]
  const isImageModel = IMAGE_MODELS.has(model)

  return (
    <>
      <Head>
        <title>Vedion AI</title>
        <style>{`body { cursor: auto !important; } * { cursor: auto !important; } button, a, [onclick] { cursor: pointer !important; }`}</style>
      </Head>
      <div style={s.root}>

        {/* Sidebar */}
        <div style={{ ...s.sidebar, ...(sidebarOpen ? {} : s.sidebarHidden) }}>
          <div style={s.sidebarHeader}>
            <a href="/" style={{ ...s.logoText, textDecoration: 'none' }}>VEDION</a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <a href="/" style={{ ...s.iconBtn, textDecoration: 'none', fontSize: 11, letterSpacing: 1, fontFamily: 'monospace' }}>← SITE</a>
              <button style={s.iconBtn} onClick={() => setSidebar(false)}>✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            {['chats','account'].map(t => (
              <button key={t} style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }}
                onClick={() => setTab(t)}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {tab === 'chats' && (
            <>
              <button style={s.newChatBtn} onClick={handleNewChat}>+ New Chat</button>
              <div style={s.chatList}>
                {chats.map(c => (
                  <div key={c.id}
                    style={{ ...s.chatItem, ...(activeChatId === c.id ? s.chatItemActive : {}) }}
                    onClick={() => handleSelectChat(c.id)}>
                    <span style={s.chatAccent} />
                    <span style={s.chatTitle}>{c.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'account' && (
            userData
              ? <AccountPanel userData={userData} onSignOut={() => signOut(auth).then(() => router.replace('/'))} />
              : <div style={{ padding: '1rem', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
          )}
        </div>

        {/* Main area */}
        <div style={s.main}>
          {/* Top bar */}
          <div style={s.topBar}>
            {!sidebarOpen && (
              <>
                <button style={s.iconBtn} onClick={() => setSidebar(true)}>☰</button>
                <a href="/" style={{ ...s.iconBtn, textDecoration: 'none', fontSize: 11, fontFamily: 'monospace', letterSpacing: 1 }}>← SITE</a>
              </>
            )}
            <span style={s.topTitle}>
              {activeChatId ? (chats.find(c => c.id === activeChatId)?.title ?? 'Chat') : 'Select or start a chat'}
            </span>
            {userData && (
              <span style={s.creditsDisplay}>{userData.credits} ◈</span>
            )}
          </div>

          {/* Messages */}
          <div style={s.messages}>
            {!activeChatId && (
              <div style={s.emptyState}>
                <p style={s.emptyTitle}>VEDION</p>
                <p style={s.emptySubtitle}>Select a chat or start a new one</p>
                <button style={s.newChatBtn} onClick={handleNewChat}>+ New Chat</button>
              </div>
            )}
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {sending && (
              <div style={s.bubbleAI}>
                <span style={{ color: '#00FF41', fontFamily: 'monospace', fontSize: 13 }}>
                  ▋
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Model bar */}
          {activeChatId && (
            <div style={s.modelBar} onClick={() => setShowModels(v => !v)}>
              <span style={{ ...s.modelDot, background: currentModel?.color ?? '#00FF41' }} />
              <span style={s.modelLabel}>{currentModel?.label ?? model}</span>
              <span style={s.modelCost}>{currentModel?.credits ?? 1} ◈ per {isImageModel ? 'image' : 'msg'}</span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>▲</span>
            </div>
          )}

          {/* Model picker */}
          {showModels && (
            <ModelPicker selected={model} onSelect={m => { setModel(m); setShowModels(false) }} plan={userData?.plan ?? 'free'} />
          )}

          {/* Input */}
          {activeChatId && (
            <div style={s.inputRow}>
              <textarea
                style={s.input}
                placeholder={isImageModel ? 'Describe an image...' : 'Message Vedion...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                rows={1}
              />
              <button
                style={{ ...s.sendBtn, opacity: (!input.trim() || sending) ? 0.4 : 1 }}
                onClick={handleSend}
                disabled={!input.trim() || sending}
              >
                {isImageModel ? '🖼' : '↑'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  if (msg.type === 'image') {
    return (
      <div style={isUser ? s.bubbleUser : s.bubbleAI}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={msg.content} alt="Generated" style={{ maxWidth: 320, borderRadius: 8 }} />
      </div>
    )
  }
  return (
    <div style={isUser ? s.bubbleUser : s.bubbleAI}>
      <span style={isUser ? s.bubbleTextUser : s.bubbleTextAI}>
        {msg.content}
      </span>
    </div>
  )
}

function ModelPicker({ selected, onSelect, plan }) {
  const textModels  = Object.entries(MODELS).filter(([,m]) => m.type === 'text')
  const imageModels = Object.entries(MODELS).filter(([,m]) => m.type === 'image')

  return (
    <div style={s.modelPicker}>
      <p style={s.pickerSection}>TEXT MODELS</p>
      {textModels.map(([key, m]) => (
        <ModelRow key={key} id={key} model={m} selected={selected} onSelect={onSelect} plan={plan} />
      ))}
      <p style={s.pickerSection}>IMAGE GENERATION</p>
      {imageModels.map(([key, m]) => (
        <ModelRow key={key} id={key} model={m} selected={selected} onSelect={onSelect} plan={plan} />
      ))}
    </div>
  )
}

function ModelRow({ id, model, selected, onSelect, plan }) {
  const locked = !model.plans.includes(plan)
  return (
    <div style={{ ...s.modelRow, ...(selected === id ? s.modelRowSelected : {}), opacity: locked ? 0.4 : 1 }}
      onClick={() => !locked && onSelect(id)}>
      <span style={{ ...s.modelDot, background: model.color }} />
      <span style={{ flex: 1 }}>
        <span style={s.modelRowLabel}>{model.label}</span>
        <span style={s.modelRowDesc}> — {model.description}</span>
        {locked && <span style={{ color: '#FFB800', fontSize: 10, marginLeft: 6 }}>PRO+</span>}
      </span>
      <span style={s.modelRowCost}>{model.credits} ◈</span>
      {selected === id && <span style={{ color: '#00FF41' }}>✓</span>}
    </div>
  )
}

function AccountPanel({ userData, onSignOut }) {
  const planColors = { free: 'rgba(255,255,255,0.4)', pro: '#00D4FF', ultra: '#7B2FFF' }
  return (
    <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={s.accountCard}>
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{userData.email}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ border: `1px solid ${planColors[userData.plan]}`, color: planColors[userData.plan], borderRadius: 3, padding: '1px 6px', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2 }}>
            {userData.plan.toUpperCase()}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ color: '#00FF41' }}>{userData.credits}</span> ◈ credits
          </span>
        </div>
      </div>

      <p style={s.pickerSection}>BUY CREDITS</p>
      {CREDIT_PACKS.map(pack => (
        <div key={pack.id} style={s.packRow}>
          <span style={s.packLabel}>{pack.label}</span>
          {pack.badge && <span style={s.packBadge}>{pack.badge}</span>}
          <span style={s.packPrice}>{`$${pack.price}`}</span>
        </div>
      ))}

      {userData.plan === 'free' && (
        <>
          <p style={s.pickerSection}>UPGRADE</p>
          {SUBSCRIPTIONS.map(sub => (
            <div key={sub.id} style={{ ...s.accountCard, borderColor: `${sub.color}40` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: sub.color, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 16 }}>{sub.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{sub.priceLabel}</span>
              </div>
              {sub.perks.map(p => (
                <p key={p} style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '3px 0' }}>✓ {p}</p>
              ))}
            </div>
          ))}
        </>
      )}

      <button style={{ ...s.packRow, border: '1px solid rgba(255,45,85,0.3)', cursor: 'pointer', justifyContent: 'center', color: '#FF2D55', fontFamily: 'monospace', fontSize: 12 }}
        onClick={onSignOut}>
        Sign Out
      </button>
    </div>
  )
}

const s = {
  root:        { display: 'flex', height: '100vh', background: '#000', color: '#fff', overflow: 'hidden', fontFamily: 'Inter, sans-serif' },
  sidebar:     { width: 260, background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0 },
  sidebarHidden: { width: 0 },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  logoText:    { fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 16, color: '#00FF41', letterSpacing: 4 },
  iconBtn:     { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, padding: 4 },
  tabs:        { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tabBtn:      { flex: 1, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, padding: '10px 0', cursor: 'pointer' },
  tabActive:   { color: '#00FF41', borderBottom: '1px solid #00FF41' },
  newChatBtn:  { margin: '12px', background: '#00FF41', color: '#000', border: 'none', borderRadius: 4, padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer' },
  chatList:    { flex: 1, overflowY: 'auto', padding: '8px 0' },
  chatItem:    { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderRadius: 4, margin: '1px 6px' },
  chatItemActive: { background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.15)' },
  chatAccent:  { width: 3, height: 20, background: '#00FF41', borderRadius: 2, opacity: 0.4, flexShrink: 0 },
  chatTitle:   { fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main:        { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar:      { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  topTitle:    { flex: 1, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff' },
  creditsDisplay: { fontFamily: 'monospace', fontSize: 11, color: '#00FF41' },
  messages:    { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  emptyState:  { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 'auto', paddingTop: 80 },
  emptyTitle:  { fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 32, color: '#00FF41', letterSpacing: 6, margin: 0 },
  emptySubtitle: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 },
  bubbleUser:  { alignSelf: 'flex-end', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', maxWidth: '80%' },
  bubbleAI:    { alignSelf: 'flex-start', padding: '4px 0', maxWidth: '80%' },
  bubbleTextUser: { fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff' },
  bubbleTextAI:   { fontFamily: 'monospace', fontSize: 13, color: '#00FF41', whiteSpace: 'pre-wrap', lineHeight: 1.6 },
  modelBar:    { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' },
  modelDot:    { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  modelLabel:  { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1 },
  modelCost:   { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)' },
  inputRow:    { display: 'flex', gap: 8, padding: 12, paddingTop: 6 },
  input:       { flex: 1, background: '#0A0A0A', border: '1px solid rgba(0,255,65,0.3)', borderRadius: 8, color: '#fff', fontFamily: 'monospace', fontSize: 13, padding: '10px 12px', outline: 'none', resize: 'none', lineHeight: 1.5 },
  sendBtn:     { background: '#00FF41', color: '#000', border: 'none', borderRadius: 8, width: 40, fontSize: 18, cursor: 'pointer', fontWeight: 700 },
  modelPicker: { background: '#0A0A0A', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 8, margin: '0 12px 8px', padding: '12px', maxHeight: 300, overflowY: 'auto' },
  pickerSection: { fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.25)', margin: '8px 0 6px' },
  modelRow:    { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 4, cursor: 'pointer' },
  modelRowSelected: { background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.2)' },
  modelRowLabel: { fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff' },
  modelRowDesc:  { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  modelRowCost:  { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  accountCard: { background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' },
  packRow:     { display: 'flex', alignItems: 'center', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 10px', gap: 6 },
  packLabel:   { flex: 1, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff' },
  packBadge:   { fontFamily: 'monospace', fontSize: 9, color: '#FFB800', border: '1px solid #FFB800', borderRadius: 3, padding: '1px 5px', letterSpacing: 1 },
  packPrice:   { fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#00FF41' },
}
