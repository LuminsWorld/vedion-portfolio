import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { auth } from '../lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { MODELS, IMAGE_MODELS, CREDIT_PACKS, SUBSCRIPTIONS } from '../lib/credits'
import { getMe, listChats, createChat, deleteChat, renameChat, sendMessage, generateImage } from '../lib/api'

// Custom geometric icons — no emoji
const CHAT_ICONS = ['◈','◉','⬡','◆','▲','◐','⊕','⊗','⌘','⊞','✦','◎','⬢','◇','△','◒','⊛','⌖','◑','◀','▶','⬤','⬦','◧','⌬','◬','⊠','⊿','⊜','◍']
const CHAT_COLORS = ['#00FF41','#7B2FFF','#00D4FF','#FFB800','#FF2D55','#FF6B35','#C084FC','#FFFFFF']

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
  const [tab, setTab]             = useState('chats')
  const [sidebarOpen, setSidebar] = useState(true)
  const [renamingId, setRenamingId] = useState(null)
  const [renameVal, setRenameVal]   = useState('')
  const [pickerChatId, setPickerChatId] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) { router.replace('/auth'); return }
      setUser(u)
      try { setUserData(await getMe()) }
      catch { setUserData({ email: u.email, plan: 'free', credits: 20 }) }
      try { const { chats } = await listChats(); setChats(chats) }
      catch {}
    })
    return unsub
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleNewChat() {
    try {
      const { chatId, title } = await createChat('New Chat')
      setChats(c => [{ id: chatId, title, icon: '◈', color: '#00FF41' }, ...c])
      setActive(chatId); setMessages([])
    } catch (e) {
      alert(e.upgradeRequired ? e.error : `Error: ${e.error ?? e._status}`)
    }
  }

  async function handleSelectChat(chatId) {
    setActive(chatId)
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` },
      })
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch { setMessages([]) }
  }

  async function handleDelete(e, chatId) {
    e.stopPropagation()
    if (!confirm('Delete this chat?')) return
    try {
      await deleteChat(chatId)
      setChats(c => c.filter(x => x.id !== chatId))
      if (activeChatId === chatId) { setActive(null); setMessages([]) }
    } catch {}
  }

  async function handleRename(chatId) {
    if (!renameVal.trim()) { setRenamingId(null); return }
    try {
      await renameChat(chatId, renameVal.trim())
      setChats(c => c.map(x => x.id === chatId ? { ...x, title: renameVal.trim() } : x))
    } catch {}
    setRenamingId(null)
  }

  async function handleUpdateMeta(chatId, patch) {
    setChats(c => c.map(x => x.id === chatId ? { ...x, ...patch } : x))
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await auth.currentUser.getIdToken()}` },
        body: JSON.stringify(patch),
      })
    } catch {}
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending || !activeChatId) return
    setInput(''); setSending(true)
    const tempMsg = { id: Date.now(), role: 'user', content: text, type: 'text' }
    setMessages(m => [...m, tempMsg])
    try {
      const history = messages.slice(-20)
      let result
      if (IMAGE_MODELS.has(model)) {
        result = await generateImage(activeChatId, text, model)
        setMessages(m => [...m, { id: Date.now() + 1, role: 'assistant', content: result.imageUrl, type: 'image', model }])
      } else {
        result = await sendMessage(activeChatId, text, model, history)
        setMessages(m => [...m, { id: Date.now() + 1, role: 'assistant', content: result.reply, type: 'text', model }])
      }
      setUserData(d => d ? { ...d, credits: result.creditsRemaining } : d)
      const chat = chats.find(c => c.id === activeChatId)
      if (chat?.title === 'New Chat') {
        const t = text.slice(0, 40) + (text.length > 40 ? '…' : '')
        await renameChat(activeChatId, t)
        setChats(c => c.map(x => x.id === activeChatId ? { ...x, title: t } : x))
      }
    } catch (e) {
      setMessages(m => m.filter(x => x.id !== tempMsg.id))
      if (e.upgradeRequired) alert(e.error)
      else if (e._status === 402) alert('Out of credits. Buy more in Account tab.')
      else alert(e.error ?? 'Something went wrong.')
    } finally { setSending(false) }
  }

  if (!user) return <div style={{ background: '#000', minHeight: '100vh' }} />
  const currentModel = MODELS[model]
  const isImageModel = IMAGE_MODELS.has(model)
  const activeChat   = chats.find(c => c.id === activeChatId)
  const accentColor  = activeChat?.color ?? '#00FF41'

  return (
    <>
      <Head>
        <title>Vedion AI</title>
        <style>{`
          body, * { cursor: auto !important; }
          button, a, [role=button] { cursor: pointer !important; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
          textarea:focus { outline: none; }
          .chat-item-actions { opacity: 0; transition: opacity 0.15s; }
          .chat-item:hover .chat-item-actions { opacity: 1; }
        `}</style>
      </Head>
      <div style={s.root}>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div style={{ ...s.sidebar, ...(sidebarOpen ? {} : s.sidebarHidden) }}>

          {/* Header */}
          <div style={s.sidebarHeader}>
            <a href="/" style={{ ...s.logoText, textDecoration: 'none' }}>VEDION</a>
            <div style={{ display: 'flex', gap: 2 }}>
              <a href="/" title="Back to site" style={{ ...s.iconBtn, textDecoration: 'none', fontSize: 12 }}>←</a>
              <button style={s.iconBtn} onClick={() => setSidebar(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            {['chats','account'].map(t => (
              <button key={t} style={{ ...s.tabBtn, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
                {t === 'chats' ? 'CHATS' : 'ACCOUNT'}
              </button>
            ))}
          </div>

          {/* ── Chats tab ── */}
          {tab === 'chats' && (
            <>
              <button style={s.newChatBtn} onClick={handleNewChat}>＋ New Chat</button>
              <div style={s.chatList}>
                {chats.length === 0 && (
                  <p style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 24 }}>No chats yet</p>
                )}
                {chats.map(c => (
                  <div key={c.id} className="chat-item"
                    style={{ ...s.chatItem, ...(activeChatId === c.id ? {
                      background: `${c.color ?? '#00FF41'}0D`,
                      border: `1px solid ${c.color ?? '#00FF41'}30`,
                      boxShadow: `0 0 12px ${c.color ?? '#00FF41'}10`,
                    } : {}) }}
                    onClick={() => { if (renamingId !== c.id) handleSelectChat(c.id) }}>

                    {/* Icon button — opens picker */}
                    <button style={{ ...s.iconPill, color: c.color ?? '#00FF41' }}
                      onClick={e => { e.stopPropagation(); setPickerChatId(pickerChatId === c.id ? null : c.id) }}>
                      {c.icon ?? '◈'}
                    </button>

                    {/* Color accent */}
                    <span style={{ ...s.chatAccent, background: c.color ?? '#00FF41' }} />

                    {/* Title / rename input */}
                    {renamingId === c.id ? (
                      <input autoFocus style={s.renameInput} value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onBlur={() => handleRename(c.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(c.id); if (e.key === 'Escape') setRenamingId(null) }}
                        onClick={e => e.stopPropagation()} />
                    ) : (
                      <span style={s.chatTitle}>{c.title}</span>
                    )}

                    {/* Actions (visible on hover) */}
                    <div className="chat-item-actions" style={{ display: 'flex', gap: 2 }}>
                      <button style={s.actionBtn} title="Rename"
                        onClick={e => { e.stopPropagation(); setRenamingId(c.id); setRenameVal(c.title) }}>⌇</button>
                      <button style={s.actionBtn} title="Delete"
                        onClick={e => handleDelete(e, c.id)}>⊘</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Icon/Color picker popover */}
              {pickerChatId && (
                <IconColorPicker
                  chat={chats.find(c => c.id === pickerChatId)}
                  onUpdate={patch => handleUpdateMeta(pickerChatId, patch)}
                  onClose={() => setPickerChatId(null)}
                />
              )}
            </>
          )}

          {/* ── Account tab ── */}
          {tab === 'account' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {userData
                ? <AccountPanel userData={userData} onSignOut={() => signOut(auth).then(() => router.replace('/'))} />
                : <div style={{ padding: 16, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>Loading...</div>
              }
            </div>
          )}
        </div>

        {/* ── Main area ────────────────────────────────────── */}
        <div style={s.main}>
          {/* Top bar */}
          <div style={{ ...s.topBar, borderBottom: `1px solid ${activeChatId ? accentColor + '22' : 'rgba(255,255,255,0.05)'}`, boxShadow: activeChatId ? `0 1px 20px ${accentColor}08` : 'none' }}>
            {!sidebarOpen && (
              <button style={s.iconBtn} onClick={() => setSidebar(true)}>☰</button>
            )}
            <span style={{ ...s.topTitle, color: activeChatId ? accentColor : 'rgba(255,255,255,0.5)' }}>
              {activeChatId
                ? <><span style={{ marginRight: 8, fontFamily: 'monospace' }}>{activeChat?.icon ?? '◈'}</span>{activeChat?.title ?? 'Chat'}</>
                : 'Vedion AI'
              }
            </span>
            {userData && (
              <span style={{ ...s.creditsDisplay, color: accentColor }}>{userData.credits} ◈</span>
            )}
          </div>

          {/* Messages */}
          <div style={{ ...s.messages, background: activeChatId ? `radial-gradient(ellipse at top, ${accentColor}06 0%, #000 60%)` : '#000' }}>
            {!activeChatId && (
              <div style={s.emptyState}>
                <p style={s.emptyTitle}>VEDION</p>
                <p style={s.emptySubtitle}>Sharp AI. Pick a model. Start chatting.</p>
                <button style={s.newChatBtnLarge} onClick={handleNewChat}>＋ New Chat</button>
              </div>
            )}
            {messages.map((msg, i) => <MessageBubble key={msg.id ?? i} msg={msg} accentColor={accentColor} />)}
            {sending && (
              <div style={s.bubbleAI}>
                <span style={{ color: accentColor, fontFamily: 'monospace' }}>▋</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Model bar */}
          {activeChatId && (
            <div style={{ ...s.modelBar, borderTop: `1px solid ${accentColor}15` }} onClick={() => setShowModels(v => !v)}>
              <span style={{ ...s.modelDot, background: currentModel?.color ?? accentColor }} />
              <span style={s.modelLabel}>{currentModel?.label ?? model}</span>
              <span style={s.modelCost}>{currentModel?.credits ?? 1} ◈ / {isImageModel ? 'img' : 'msg'}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>{showModels ? '▼' : '▲'}</span>
            </div>
          )}

          {showModels && (
            <ModelPicker selected={model} onSelect={m => { setModel(m); setShowModels(false) }} plan={userData?.plan ?? 'free'} />
          )}

          {activeChatId && (
            <div style={s.inputRow}>
              <textarea style={{ ...s.input, borderColor: `${accentColor}30`, '--focus-color': accentColor }}
                placeholder={isImageModel ? 'Describe an image to generate...' : 'Message Vedion...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                onFocus={e => e.target.style.borderColor = `${accentColor}80`}
                onBlur={e => e.target.style.borderColor = `${accentColor}30`}
                rows={1} />
              <button style={{ ...s.sendBtn, background: accentColor, color: '#000', opacity: (!input.trim() || sending) ? 0.3 : 1 }}
                onClick={handleSend} disabled={!input.trim() || sending}>
                {isImageModel ? '⬡' : '↑'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Icon + Color Picker ───────────────────────────────────────────────────────

function IconColorPicker({ chat, onUpdate, onClose }) {
  useEffect(() => {
    const handler = () => onClose()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [onClose])

  return (
    <div style={s.picker} onClick={e => e.stopPropagation()}>
      <p style={s.pickerLabel}>ICON</p>
      <div style={s.iconGrid}>
        {CHAT_ICONS.map(ic => (
          <button key={ic} style={{ ...s.iconCell, ...(chat?.icon === ic ? { ...s.iconCellActive, borderColor: chat?.color ?? '#00FF41', color: chat?.color ?? '#00FF41' } : {}) }}
            onClick={() => { onUpdate({ icon: ic }); onClose() }}>
            {ic}
          </button>
        ))}
      </div>
      <p style={{ ...s.pickerLabel, marginTop: 10 }}>COLOR</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CHAT_COLORS.map(col => (
          <button key={col} style={{ ...s.colorDot, background: col, ...(chat?.color === col ? { boxShadow: `0 0 0 2px #000, 0 0 0 4px ${col}` } : {}) }}
            onClick={() => { onUpdate({ color: col }); onClose() }} />
        ))}
      </div>
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, accentColor = '#00FF41' }) {
  const isUser = msg.role === 'user'
  if (msg.type === 'image') {
    return (
      <div style={isUser ? s.bubbleUser : s.bubbleAI}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={msg.content} alt="Generated" style={{ maxWidth: 320, borderRadius: 8, display: 'block' }} />
      </div>
    )
  }
  return (
    <div style={isUser ? { ...s.bubbleUser, borderColor: `${accentColor}18` } : s.bubbleAI}>
      <span style={isUser ? s.bubbleTextUser : { ...s.bubbleTextAI, color: accentColor === '#FFFFFF' ? 'rgba(255,255,255,0.9)' : accentColor }}>
        {msg.content}
      </span>
    </div>
  )
}

// ── Model Picker ──────────────────────────────────────────────────────────────

function ModelPicker({ selected, onSelect, plan }) {
  const text  = Object.entries(MODELS).filter(([,m]) => m.type === 'text')
  const image = Object.entries(MODELS).filter(([,m]) => m.type === 'image')
  return (
    <div style={s.modelPicker}>
      <p style={s.pickerSection}>TEXT</p>
      {text.map(([k, m]) => <ModelRow key={k} id={k} model={m} selected={selected} onSelect={onSelect} plan={plan} />)}
      <p style={s.pickerSection}>IMAGE GEN</p>
      {image.map(([k, m]) => <ModelRow key={k} id={k} model={m} selected={selected} onSelect={onSelect} plan={plan} />)}
    </div>
  )
}

function ModelRow({ id, model, selected, onSelect, plan }) {
  const locked = !model.plans.includes(plan)
  return (
    <div style={{ ...s.modelRow, ...(selected === id ? s.modelRowSelected : {}), opacity: locked ? 0.35 : 1 }}
      onClick={() => !locked && onSelect(id)}>
      <span style={{ ...s.modelDot, background: model.color }} />
      <span style={{ flex: 1 }}>
        <span style={s.modelRowLabel}>{model.label}</span>
        <span style={s.modelRowDesc}> — {model.description}</span>
        {locked && <span style={{ color: '#FFB800', fontSize: 9, marginLeft: 6, letterSpacing: 1 }}>PRO+</span>}
      </span>
      <span style={s.modelRowCost}>{model.credits} ◈</span>
      {selected === id && <span style={{ color: '#00FF41', fontSize: 12 }}>✓</span>}
    </div>
  )
}

// ── Account Panel ─────────────────────────────────────────────────────────────

function AccountPanel({ userData, onSignOut }) {
  const planColor = { free: 'rgba(255,255,255,0.4)', pro: '#00D4FF', ultra: '#7B2FFF' }[userData.plan]
  const maxCredits = { free: 20, pro: 500, ultra: 1500 }[userData.plan] ?? 20
  const pct = Math.min(100, Math.round((userData.credits / maxCredits) * 100))

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* User card */}
      <div style={s.accountCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${planColor}22`, border: `2px solid ${planColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            {userData.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userData.email}</p>
            <span style={{ display: 'inline-block', marginTop: 3, border: `1px solid ${planColor}`, color: planColor, borderRadius: 3, padding: '1px 6px', fontFamily: 'monospace', fontSize: 9, letterSpacing: 2 }}>
              {userData.plan.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Credits bar */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>CREDITS</span>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#00FF41' }}>{userData.credits} / {maxCredits}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct < 20 ? '#FF2D55' : '#00FF41', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Buy credits */}
      <p style={s.sectionLabel}>BUY CREDITS</p>
      {CREDIT_PACKS.map(pack => (
        <div key={pack.id} style={s.packRow}>
          <span style={{ fontSize: 16 }}>◈</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff' }}>{pack.label}</span>
            {pack.badge && <span style={s.packBadge}>{pack.badge}</span>}
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#00FF41' }}>${pack.price}</span>
        </div>
      ))}

      {/* Upgrade */}
      {userData.plan === 'free' && (
        <>
          <p style={s.sectionLabel}>UPGRADE PLAN</p>
          {SUBSCRIPTIONS.map(sub => (
            <div key={sub.id} style={{ ...s.accountCard, borderColor: `${sub.color}44`, cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: sub.color, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 15 }}>{sub.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: sub.color, fontWeight: 700 }}>{sub.priceLabel}</span>
              </div>
              {sub.perks.map(p => (
                <p key={p} style={{ margin: '2px 0', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>✓ {p}</p>
              ))}
            </div>
          ))}
        </>
      )}

      {/* Sign out */}
      <button style={s.signOutBtn} onClick={onSignOut}>Sign Out</button>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  root:        { display: 'flex', height: '100vh', background: '#000', color: '#fff', overflow: 'hidden', fontFamily: 'Inter, sans-serif' },
  sidebar:     { width: 260, background: '#070707', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0, position: 'relative' },
  sidebarHidden: { width: 0 },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  logoText:    { fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 15, color: '#00FF41', letterSpacing: 4 },
  iconBtn:     { background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 14, padding: '4px 6px', borderRadius: 4, lineHeight: 1 },
  tabs:        { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tabBtn:      { flex: 1, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 9, letterSpacing: 1.5, padding: '10px 4px', cursor: 'pointer' },
  tabActive:   { color: '#00FF41', borderBottom: '2px solid #00FF41' },
  newChatBtn:  { margin: '10px 10px 6px', background: '#00FF41', color: '#000', border: 'none', borderRadius: 6, padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, cursor: 'pointer' },
  newChatBtnLarge: { background: '#00FF41', color: '#000', border: 'none', borderRadius: 8, padding: '12px 24px', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: 1, cursor: 'pointer', marginTop: 8 },
  chatList:    { flex: 1, overflowY: 'auto', padding: '4px 0 12px' },
  chatItem:    { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', cursor: 'pointer', borderRadius: 6, margin: '1px 6px', position: 'relative' },
  chatItemActive: { background: 'rgba(0,255,65,0.06)', border: '1px solid rgba(0,255,65,0.12)' },
  iconPill:    { background: 'none', border: 'none', fontSize: 14, fontFamily: 'monospace', cursor: 'pointer', padding: '0 2px', lineHeight: 1, flexShrink: 0, color: 'rgba(255,255,255,0.7)' },
  chatAccent:  { width: 2, height: 18, borderRadius: 1, flexShrink: 0 },
  chatTitle:   { flex: 1, fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  renameInput: { flex: 1, background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.3)', borderRadius: 4, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 12, padding: '2px 6px', outline: 'none' },
  actionBtn:   { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'monospace', padding: '2px 4px', opacity: 0.5, lineHeight: 1, color: '#fff' },

  // Icon/Color picker
  picker:      { position: 'absolute', bottom: 8, left: 10, right: 10, background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.8)' },
  pickerLabel: { fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', margin: '0 0 6px' },
  iconGrid:    { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 },
  iconCell:    { background: 'none', border: '1px solid transparent', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', padding: 5, cursor: 'pointer', textAlign: 'center' },
  iconCellActive: { borderColor: '#00FF41', background: 'rgba(0,255,65,0.1)' },
  colorDot:    { width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer' },

  // Main
  main:        { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar:      { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', minHeight: 49 },
  topTitle:    { flex: 1, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  creditsDisplay: { fontFamily: 'monospace', fontSize: 11, color: '#00FF41', flexShrink: 0 },
  messages:    { flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 },
  emptyState:  { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, margin: 'auto' },
  emptyTitle:  { fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 36, color: '#00FF41', letterSpacing: 8, margin: 0 },
  emptySubtitle: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 },
  bubbleUser:  { alignSelf: 'flex-end', background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px 12px 3px 12px', padding: '9px 13px', maxWidth: '75%' },
  bubbleAI:    { alignSelf: 'flex-start', padding: '2px 0', maxWidth: '85%' },
  bubbleTextUser: { fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff', lineHeight: 1.5 },
  bubbleTextAI:   { fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', lineHeight: 1.65 },
  modelBar:    { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' },
  modelDot:    { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  modelLabel:  { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.45)', flex: 1 },
  modelCost:   { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.2)' },
  inputRow:    { display: 'flex', gap: 8, padding: '8px 12px 12px' },
  input:       { flex: 1, background: '#0D0D0D', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 10, color: '#fff', fontFamily: 'monospace', fontSize: 13, padding: '10px 14px', resize: 'none', lineHeight: 1.5, transition: 'border-color 0.2s' },
  sendBtn:     { background: '#00FF41', color: '#000', border: 'none', borderRadius: 10, width: 44, height: 44, fontSize: 18, cursor: 'pointer', fontWeight: 900, flexShrink: 0, alignSelf: 'flex-end' },
  modelPicker: { background: '#0A0A0A', border: '1px solid rgba(0,255,65,0.15)', borderRadius: 10, margin: '0 12px 6px', padding: 12, maxHeight: 280, overflowY: 'auto' },
  pickerSection: { fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.2)', margin: '6px 0 4px' },
  modelRow:    { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', border: '1px solid transparent' },
  modelRowSelected: { background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.15)' },
  modelRowLabel: { fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff' },
  modelRowDesc:  { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  modelRowCost:  { fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)' },

  // Account
  accountCard: { background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' },
  sectionLabel: { fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.25)', margin: '2px 0 4px' },
  packRow:     { display: 'flex', alignItems: 'center', background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '9px 12px', gap: 8, cursor: 'pointer' },
  packBadge:   { fontFamily: 'monospace', fontSize: 9, color: '#FFB800', border: '1px solid #FFB80066', borderRadius: 3, padding: '1px 5px', letterSpacing: 1, marginLeft: 4 },
  signOutBtn:  { background: 'none', border: '1px solid rgba(255,45,85,0.25)', borderRadius: 8, color: '#FF2D55', fontFamily: 'monospace', fontSize: 12, padding: '9px', cursor: 'pointer', width: '100%', marginTop: 4 },
}
