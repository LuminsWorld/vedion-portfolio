import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { auth } from '../lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { MODELS, IMAGE_MODELS, CREDIT_PACKS, SUBSCRIPTIONS, PLAN_LIMITS } from '../lib/credits'
import { getMe, listChats, createChat, deleteChat, renameChat, sendMessage, generateImage, checkout, redeemCode } from '../lib/api'
import ChatIcon, { ICON_KEYS } from '../components/ChatIcon'
import { uploadFile, validateFiles, TYPE_LABELS } from '../lib/uploadFile'
import { toast } from '../components/Toast'

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
  const [attachedFiles, setAttachedFiles] = useState([])   // { name, url, mimeType, size, path, progress }
  const [uploading, setUploading]         = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [clearing, setClearing]         = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // ID of chat to confirm deletion
  const [deletingId, setDeletingId] = useState(null)
  const fileInputRef  = useRef(null)
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

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNewChat()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [chats, activeChatId])

  async function handleCheckout(itemId) {
    try {
      const { url } = await checkout(itemId)
      window.location.href = url
    } catch (e) {
      toast.error('Checkout failed: ' + (e.error ?? e.message ?? 'Unknown error'))
    }
  }

  // Show success toast if returning from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      toast.success('Payment successful! Your credits/plan have been updated.')
      window.history.replaceState({}, '', '/app')
      // Refresh user data
      getMe().then(setUserData).catch(() => {})
    }
  }, [])

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''

    const plan = userData?.plan ?? 'free'
    const currentCount = attachedFiles.filter(f => f.url).length
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
    const allFiles = [...attachedFiles.filter(f => f.url).map(f => ({ type: f.mimeType, size: f.size, name: f.name })), ...files]

    const errors = validateFiles(allFiles, plan)
    if (errors.length) { errors.forEach(err => toast.error(err)); return }

    if (!activeChatId) { toast.warning('Start a chat first.'); return }

    setUploading(true)
    const uid = user.uid

    for (const file of files) {
      const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`
      setAttachedFiles(prev => [...prev, { tempId, name: file.name, mimeType: file.type, size: file.size, progress: 0, url: null }])

      try {
        const result = await uploadFile(file, uid, activeChatId, pct => {
          setAttachedFiles(prev => prev.map(f => f.tempId === tempId ? { ...f, progress: pct } : f))
        })
        setAttachedFiles(prev => prev.map(f => f.tempId === tempId ? { ...f, ...result, progress: 100 } : f))
      } catch (err) {
        setAttachedFiles(prev => prev.filter(f => f.tempId !== tempId))
        toast.error(`Upload failed: ${err.message}`)
      }
    }
    setUploading(false)
  }

  function removeAttachment(idx) {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleNewChat() {
    try {
      const { chatId, title } = await createChat('New Chat')
      setChats(c => [{ id: chatId, title, icon: 'chat', color: '#00FF41' }, ...c])
      setActive(chatId); setMessages([])
    } catch (e) {
      toast.error(e.upgradeRequired ? e.error : `Error: ${e.error ?? e._status}`)
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

  // The delete logic is now inline with the button to enable micro-interactions.
  // async function handleDelete(e, chatId) {
  //   e.stopPropagation()
  //   if (!confirm('Delete this chat?')) return
  //   try {
  //     await deleteChat(chatId)
  //     setChats(c => c.filter(x => x.id !== chatId))
  //     if (activeChatId === chatId) { setActive(null); setMessages([]) }
  //   } catch {}
  // }

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
    if (uploading) { toast.warning('Wait for uploads to finish.'); return }

    const readyFiles = attachedFiles.filter(f => f.url)
    setInput(''); setAttachedFiles([]); setSending(true)
    const tempMsg = { id: Date.now(), role: 'user', content: text, type: 'text', files: readyFiles }
    setMessages(m => [...m, tempMsg])
    try {
      const history = messages.slice(-20)

      if (IMAGE_MODELS.has(model)) {
        // Image generation — not streaming, keep existing flow
        const result = await generateImage(activeChatId, text, model)
        setMessages(m => [...m, { id: Date.now() + 1, role: 'assistant', content: result.imageUrl, type: 'image', model }])
        setUserData(d => d ? { ...d, credits: result.creditsRemaining } : d)
      } else {
        // Text — streaming fetch
        const streamingMsgId = Date.now().toString()
        setMessages(prev => [...prev, {
          id: streamingMsgId,
          role: 'assistant',
          content: '',
          type: 'text',
          model,
          streaming: true,
        }])

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({ chatId: activeChatId, content: text, model, history, files: readyFiles }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
          setMessages(prev => prev.filter(m => m.id !== streamingMsgId))
          if (err.upgradeRequired) toast.error(err.error)
          else if (response.status === 402) toast.warning('Out of credits. Buy more in Account tab.')
          else toast.error(err.error ?? 'Failed to send message')
          setSending(false)
          return
        }

        if (!response.body) {
          // Fallback: streaming not supported — try to read as plain text
          const text = await response.text()
          setMessages(prev => prev.map(m =>
            m.id === streamingMsgId ? { ...m, content: text, streaming: false } : m
          ))
          getMe().then(setUserData).catch(() => {})
          setSending(false)
          return
        }
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setMessages(prev => prev.map(m =>
            m.id === streamingMsgId ? { ...m, content: fullText } : m
          ))
        }

        // Mark streaming done
        setMessages(prev => prev.map(m =>
          m.id === streamingMsgId ? { ...m, streaming: false } : m
        ))

        // Refresh credits from server (deduction happens post-stream on backend)
        getMe().then(setUserData).catch(() => {})

        // Auto-rename chat if still "New Chat"
        const chat = chats.find(c => c.id === activeChatId)
        if (chat?.title === 'New Chat') {
          const t = text.slice(0, 40) + (text.length > 40 ? '…' : '')
          renameChat(activeChatId, t).catch(() => {})
          setChats(c => c.map(x => x.id === activeChatId ? { ...x, title: t } : x))
        }
      }
    } catch (e) {
      setMessages(m => m.filter(x => x.id !== tempMsg.id && !x.streaming))
      if (e.upgradeRequired) toast.error(e.error)
      else if (e._status === 402) toast.warning('Out of credits. Buy more in Account tab.')
      else toast.error(e.error ?? 'Something went wrong.')
    } finally { setSending(false) }
  }

  if (!user) return <div style={{ background: '#000', minHeight: '100vh' }} />
  const currentModel = MODELS[model]
  const isImageModel = IMAGE_MODELS.has(model)
  const activeChat   = chats.find(c => c.id === activeChatId)
  const accentColor  = activeChat?.color ?? '#00FF41'
  const needsAccess  = userData && userData.accessGranted !== true

  // Credit color indicator (D5)
  const planCredits = { free: 20, pro: 500, ultra: 1500 }
  const maxCredits = planCredits[userData?.plan ?? 'free'] ?? 20
  const creditPct = userData ? Math.min(1, (userData.credits ?? 0) / maxCredits) : 1
  const creditColor = creditPct > 0.2 ? '#00FF41' : creditPct > 0.1 ? '#FFB800' : '#FF2D55'

  // ── Invite code gate ────────────────────────────────────────────────────
  if (needsAccess) return <AccessGate user={user} onGranted={() => setUserData(d => ({ ...d, accessGranted: true }))} onCheckout={handleCheckout} onSignOut={() => signOut(auth).then(() => router.replace('/'))} />

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

        {/* ── Mobile overlay backdrop (D3) ─────────────────── */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebar(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 99,
              display: 'none',
            }}
            className="mobile-overlay"
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className="app-sidebar" style={{ ...s.sidebar, ...(sidebarOpen ? {} : s.sidebarHidden) }}>

          {/* Header */}
          <div style={s.sidebarHeader}>
            <a href="/" style={{ ...s.logoText, textDecoration: 'none' }}>VEDION</a>
            <button style={s.iconBtn} onClick={() => setSidebar(false)} title="Close">✕</button>
          </div>

          {/* ── Chats panel (always visible unless settings/account) ── */}
          {tab === 'chats' && (
            <>
              <button style={s.newChatBtn} onClick={handleNewChat}>＋ New Chat</button>
              <div style={s.chatList}>
                {chats.length === 0 && (
                  <p style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 32 }}>No chats yet</p>
                )}
                {chats.map(c => (
                  <div key={c.id} className="chat-item"
                    style={{ ...s.chatItem, ...(activeChatId === c.id ? {
                      background: `${c.color ?? '#00FF41'}0D`,
                      border: `1px solid ${c.color ?? '#00FF41'}30`,
                      boxShadow: `0 0 14px ${c.color ?? '#00FF41'}12`,
                    } : {}) }}
                    onClick={() => { if (renamingId !== c.id) handleSelectChat(c.id) }}>

                    <button style={{ ...s.iconPill, color: c.color ?? '#00FF41' }}
                      onClick={e => { e.stopPropagation(); setPickerChatId(pickerChatId === c.id ? null : c.id) }}>
                      <ChatIcon name={c.icon ?? 'chat'} size={15} color={c.color ?? '#00FF41'} />
                    </button>
                    <span style={{ ...s.chatAccent, background: c.color ?? '#00FF41' }} />

                    {renamingId === c.id ? (
                      <input autoFocus style={s.renameInput} value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onBlur={() => handleRename(c.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(c.id); if (e.key === 'Escape') setRenamingId(null) }}
                        onClick={e => e.stopPropagation()} />
                    ) : (
                      <span style={s.chatTitle}>{c.title}</span>
                    )}

                    <div className="chat-item-actions" style={{ display: 'flex', gap: 1 }}>
                    {deleteConfirm === c.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#FF2D5522', borderRadius: 6, padding: '2px 6px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#FF2D55' }}>Sure?</span>
                        <button style={{ ...s.actionBtn, color: '#FF2D55', fontWeight: 700 }}
                          onClick={async e => {
                            e.stopPropagation()
                            setDeletingId(c.id)
                            try {
                              await deleteChat(c.id)
                              setChats(chats.filter(x => x.id !== c.id))
                              if (activeChatId === c.id) { setActive(null); setMessages([]) }
                              toast.success('Chat deleted')
                            } catch {
                              toast.error('Failed to delete chat')
                            } finally {
                              setDeletingId(null)
                              setDeleteConfirm(null)
                            }
                          }}
                          disabled={deletingId === c.id}>
                          {deletingId === c.id ? '...' : 'Yes'}
                        </button>
                        <button style={{ ...s.actionBtn, color: 'rgba(255,255,255,0.5)' }}
                          onClick={e => { e.stopPropagation(); setDeleteConfirm(null) }}
                          disabled={deletingId === c.id}>
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button style={s.actionBtn} title="Rename"
                          onClick={e => { e.stopPropagation(); setRenamingId(c.id); setRenameVal(c.title) }}>⌇</button>
                        <button style={{ ...s.actionBtn, color: '#FF2D55' }} title="Delete"
                          onClick={e => { e.stopPropagation(); setDeleteConfirm(c.id) }}>⊘</button>
                      </>
                    )}
                  </div>
                  </div>
                ))}
              </div>
              {pickerChatId && (
                <IconColorPicker
                  chat={chats.find(c => c.id === pickerChatId)}
                  onUpdate={patch => handleUpdateMeta(pickerChatId, patch)}
                  onClose={() => setPickerChatId(null)}
                />
              )}
            </>
          )}

          {/* ── Account panel ── */}
          {tab === 'account' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {userData
                ? <AccountPanel userData={userData}
                    onCheckout={handleCheckout}
                    onSignOut={() => signOut(auth).then(() => router.replace('/'))} />
                : <div style={{ padding: 24, textAlign: 'center', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Loading...</div>
              }
            </div>
          )}

          {/* ── Settings panel ── */}
          {tab === 'settings' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={s.sectionLabel}>DEFAULT MODEL</p>
              {['claude-haiku-4-5','claude-sonnet-4-6','gemini-2.5-flash'].map(m => {
                const locked = !MODELS[m]?.plans.includes(userData?.plan ?? 'free')
                return (
                  <button key={m}
                    onClick={() => { if (!locked) setModel(m) }}
                    style={{ ...s.settingRow, borderColor: model === m ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.06)', background: model === m ? 'rgba(0,255,65,0.05)' : '#0D0D0D', opacity: locked ? 0.4 : 1, cursor: locked ? 'default' : 'pointer' }}>
                    <span style={{ ...s.modelDot, background: MODELS[m]?.color ?? '#00FF41' }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: model === m ? '#fff' : 'rgba(255,255,255,0.5)', flex: 1 }}>{MODELS[m]?.label ?? m}</span>
                    {locked && <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#FFB800', border: '1px solid #FFB80066', borderRadius: 3, padding: '1px 5px', letterSpacing: 1 }}>PRO+</span>}
                    {!locked && model === m && <span style={{ color: '#00FF41', fontSize: 11 }}>✓</span>}
                  </button>
                )
              })}
              <p style={{ ...s.sectionLabel, marginTop: 8 }}>KEYBOARD</p>
              {[['Send message','Enter'],['New line','Shift+Enter'],['New chat','Ctrl+N']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#0D0D0D', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{k}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#00FF41', background: 'rgba(0,255,65,0.08)', padding: '1px 6px', borderRadius: 3 }}>{v}</span>
                </div>
              ))}
              <p style={{ ...s.sectionLabel, marginTop: 8 }}>DANGER</p>
              {!clearConfirm ? (
                <button style={{ background: 'none', border: '1px solid rgba(255,45,85,0.2)', borderRadius: 8, color: '#FF2D55', fontFamily: 'monospace', fontSize: 11, padding: '8px 12px', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => setClearConfirm(true)} disabled={clearing}>
                  ⊘ Clear all chats
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', border: '1px solid rgba(255,45,85,0.3)', borderRadius: 8, background: 'rgba(255,45,85,0.04)' }}>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 11, color: '#FF2D55' }}>Are you sure? This deletes all chats permanently.</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ background: '#FF2D55', color: '#000', border: 'none', borderRadius: 6, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '6px 12px', cursor: clearing ? 'default' : 'pointer', opacity: clearing ? 0.5 : 1 }}
                      disabled={clearing}
                      onClick={async () => {
                        setClearing(true)
                        try {
                          for (const chat of chats) {
                            try { await deleteChat(chat.id) } catch {}
                          }
                          setChats([]); setActive(null); setMessages([])
                        } finally { setClearing(false); setClearConfirm(false) }
                      }}>
                      {clearing ? 'Clearing...' : 'Yes, clear all'}
                    </button>
                    <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 11, padding: '6px 12px', cursor: 'pointer' }}
                      onClick={() => setClearConfirm(false)} disabled={clearing}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Bottom nav ── */}
          <div style={s.bottomNav}>
            {[
              { id: 'chats',    icon: 'chat',     label: 'Chats' },
              { id: 'settings', icon: 'grid',     label: 'Settings' },
              { id: 'account',  icon: 'key',      label: 'Account' },
            ].map(item => (
              <button key={item.id}
                style={{ ...s.navBtn, ...(tab === item.id ? s.navBtnActive : {}) }}
                onClick={() => setTab(item.id)}>
                <ChatIcon name={item.icon} size={16} color={tab === item.id ? '#00FF41' : 'rgba(255,255,255,0.3)'} />
                <span style={{ fontFamily: 'monospace', fontSize: 8, letterSpacing: 1, marginTop: 2, color: tab === item.id ? '#00FF41' : 'rgba(255,255,255,0.3)' }}>
                  {item.label.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
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
                ? <><ChatIcon name={activeChat?.icon ?? 'chat'} size={15} color={accentColor} /><span style={{ marginLeft: 8 }}>{activeChat?.title ?? 'Chat'}</span></>
                : 'Vedion AI'
              }
            </span>
            {userData && (
              <span style={{ ...s.creditsDisplay, display: 'flex', alignItems: 'center', gap: 5, color: creditColor }}>
                <span style={{ width: 6, height: 6, borderRadius: 1, background: creditColor, flexShrink: 0, display: 'inline-block' }} />
                {userData.credits} ◈
              </span>
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
            <div style={{ borderTop: `1px solid ${accentColor}10` }}>
              {/* File chips strip */}
              {attachedFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px 0' }}>
                  {attachedFiles.map((f, i) => (
                    <div key={f.tempId ?? i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#111', border: `1px solid ${accentColor}25`, borderRadius: 6, padding: '3px 8px 3px 6px', maxWidth: 160 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 9, color: accentColor, letterSpacing: 1 }}>{TYPE_LABELS[f.mimeType] ?? 'FILE'}</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{f.name}</span>
                      {f.progress < 100 && f.progress >= 0
                        ? <span style={{ fontFamily: 'monospace', fontSize: 9, color: accentColor }}>{f.progress}%</span>
                        : <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', color: '#FF2D55', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                      }
                    </div>
                  ))}
                </div>
              )}

              {/* Plan file limit hint */}
              {!isImageModel && (
                <div style={{ padding: '4px 14px 0', fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>
                  {attachedFiles.length}/{PLAN_LIMITS[userData?.plan ?? 'free']?.files ?? 1} files
                  {' · '}{Math.round((PLAN_LIMITS[userData?.plan ?? 'free']?.fileSize ?? 5*1024*1024) / 1024 / 1024)}MB max
                </div>
              )}

              <div style={s.inputRow}>
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" multiple
                  accept="image/*,.pdf,.txt,.md,.csv,.js,.ts,.html,.css,.json,.xml"
                  style={{ display: 'none' }} onChange={handleFileSelect} />

                {/* Attach button — hidden for image models */}
                {!isImageModel && (
                  <button title="Attach file"
                    style={{ ...s.attachBtn, borderColor: `${accentColor}25`, color: uploading ? accentColor : 'rgba(255,255,255,0.35)' }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}>
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M13.5 7.5l-6 6a4 4 0 01-5.5-5.5l6-6a2.5 2.5 0 013.5 3.5L5.5 11a1 1 0 01-1.5-1.5L10 3.5"/>
                    </svg>
                  </button>
                )}

                <textarea style={{ ...s.input, borderColor: `${accentColor}30` }}
                  placeholder={isImageModel ? 'Describe an image to generate...' : 'Message Vedion...'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  onFocus={e => e.target.style.borderColor = `${accentColor}80`}
                  onBlur={e => e.target.style.borderColor = `${accentColor}30`}
                  rows={1} />
                <button style={{ ...s.sendBtn, background: accentColor, color: '#000', opacity: (!input.trim() || sending || uploading) ? 0.3 : 1 }}
                  onClick={handleSend} disabled={!input.trim() || sending || uploading}>
                  {isImageModel ? '⬡' : '↑'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Icon + Color Picker ───────────────────────────────────────────────────────

function AccessGate({ user, onGranted, onCheckout, onSignOut }) {
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')

  async function handleRedeem() {
    if (!code.trim()) return
    setLoading(true); setErr('')
    try {
      await redeemCode(code.trim())
      onGranted()
    } catch (e) {
      setErr(e.error ?? 'Invalid code.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: 4, color: '#00FF41', fontFamily: 'monospace' }}>VEDION</p>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 }}>EARLY ACCESS</p>
        </div>

        {/* Invite code box */}
        <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 }}>INVITE CODE</p>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleRedeem()}
            placeholder="XXXXXXXX"
            style={{ background: '#000', border: `1px solid ${err ? '#FF2D55' : 'rgba(255,255,255,0.12)'}`, borderRadius: 8, padding: '10px 14px', color: '#00FF41', fontFamily: 'monospace', fontSize: 18, letterSpacing: 4, textTransform: 'uppercase', outline: 'none', textAlign: 'center' }}
          />
          {err && <p style={{ margin: 0, fontSize: 11, color: '#FF2D55', textAlign: 'center' }}>{err}</p>}
          <button onClick={handleRedeem} disabled={!code.trim() || loading}
            style={{ background: '#00FF41', color: '#000', border: 'none', borderRadius: 8, padding: '11px', fontFamily: 'monospace', fontWeight: 900, fontSize: 13, letterSpacing: 2, cursor: code.trim() && !loading ? 'pointer' : 'default', opacity: !code.trim() || loading ? 0.4 : 1 }}>
            {loading ? 'CHECKING...' : 'REDEEM'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 2 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Upgrade options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => onCheckout('sub_pro')}
            style={{ background: 'none', border: '1px solid #00D4FF44', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, color: '#00D4FF', fontFamily: 'monospace', fontWeight: 900, fontSize: 13 }}>PRO</p>
              <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 10 }}>500 credits/mo · Sonnet + Gemini</p>
            </div>
            <span style={{ color: '#00D4FF', fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>$9.99/mo</span>
          </button>
          <button onClick={() => onCheckout('sub_ultra')}
            style={{ background: 'none', border: '1px solid #7B2FFF44', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, color: '#7B2FFF', fontFamily: 'monospace', fontWeight: 900, fontSize: 13 }}>ULTRA</p>
              <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 10 }}>1500 credits/mo · All models</p>
            </div>
            <span style={{ color: '#7B2FFF', fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>$19.99/mo</span>
          </button>
        </div>

        {/* Sign out */}
        <button onClick={onSignOut}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', textAlign: 'center', letterSpacing: 2, marginTop: 4 }}>
          SIGN OUT — {user?.email}
        </button>
      </div>
    </div>
  )
}

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
        {ICON_KEYS.map(key => (
          <button key={key} title={key}
            style={{ ...s.iconCell, ...(chat?.icon === key ? { ...s.iconCellActive, borderColor: chat?.color ?? '#00FF41', background: `${chat?.color ?? '#00FF41'}15` } : {}) }}
            onClick={() => { onUpdate({ icon: key }); onClose() }}>
            <ChatIcon name={key} size={16} color={chat?.icon === key ? (chat?.color ?? '#00FF41') : 'rgba(255,255,255,0.6)'} />
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

// ── Markdown parser (adapted from learn module) ──────────────────────────────

function parseChatContent(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim().toLowerCase() || ''
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      i++
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') }); continue
    }
    if (line.startsWith('> ')) {
      const calloutLines = []
      while (i < lines.length && lines[i].startsWith('> ')) { calloutLines.push(lines[i].slice(2)); i++ }
      blocks.push({ type: 'callout', lines: calloutLines }); continue
    }
    if (line.startsWith('# '))   { blocks.push({ type: 'h1', text: line.slice(2) });  i++; continue }
    if (line.startsWith('## '))  { blocks.push({ type: 'h2', text: line.slice(3) });  i++; continue }
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) });  i++; continue }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) { items.push(lines[i].slice(2)); i++ }
      blocks.push({ type: 'list', items }); continue
    }
    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++ }
      blocks.push({ type: 'olist', items }); continue
    }
    if (line.trim() === '') { blocks.push({ type: 'br' }); i++; continue }
    blocks.push({ type: 'para', text: line }); i++
  }
  return blocks
}

function ChatInlineText({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.88em', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, color: '#ce9178' }}>{part.slice(1, -1)}</code>
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} style={{ color: '#fff', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
        if (part.startsWith('*') && part.endsWith('*'))
          return <em key={i} style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>{part.slice(1, -1)}</em>
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

function ChatCodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard?.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <div style={{ margin: '8px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0d1117' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>{lang ? lang.toUpperCase() : 'CODE'}</span>
        <button onClick={copy} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 8px', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', letterSpacing: '0.1em' }}>{copied ? '✓ COPIED' : 'COPY'}</button>
      </div>
      <pre style={{ margin: 0, padding: '12px 16px', overflowX: 'auto', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, lineHeight: 1.7, color: '#d4d4d4', whiteSpace: 'pre-wrap' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function ChatContentBlock({ block }) {
  switch (block.type) {
    case 'h1': return <h3 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 800, fontSize: 16, color: '#fff', margin: '12px 0 4px' }}><ChatInlineText text={block.text} /></h3>
    case 'h2': return <h4 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', margin: '10px 0 4px' }}><ChatInlineText text={block.text} /></h4>
    case 'h3': return <h5 style={{ fontFamily: 'Inter,sans-serif', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.9)', margin: '8px 0 4px' }}><ChatInlineText text={block.text} /></h5>
    case 'para': return <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: '4px 0' }}><ChatInlineText text={block.text} /></p>
    case 'br': return <div style={{ height: 4 }} />
    case 'callout': return (
      <div style={{ margin: '8px 0', padding: '10px 14px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderLeft: '3px solid #00D4FF', borderRadius: '0 6px 6px 0' }}>
        {block.lines.map((line, i) => <p key={i} style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: i > 0 ? '4px 0 0' : 0, lineHeight: 1.6 }}><ChatInlineText text={line} /></p>)}
      </div>
    )
    case 'list': return (
      <ul style={{ margin: '4px 0 8px', paddingLeft: 0, listStyle: 'none' }}>
        {block.items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '2px 0', fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            <span style={{ color: '#00FF41', fontFamily: 'JetBrains Mono,monospace', fontSize: 9, flexShrink: 0 }}>›</span>
            <span><ChatInlineText text={item} /></span>
          </li>
        ))}
      </ul>
    )
    case 'olist': return (
      <ol style={{ margin: '4px 0 8px', paddingLeft: 0, listStyle: 'none', counterReset: 'item' }}>
        {block.items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '2px 0', fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            <span style={{ color: '#00FF41', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, flexShrink: 0, minWidth: 14, textAlign: 'right' }}>{i + 1}.</span>
            <span><ChatInlineText text={item} /></span>
          </li>
        ))}
      </ol>
    )
    case 'code': return <ChatCodeBlock code={block.code} lang={block.lang} />
    default: return null
  }
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
      {/* File attachments */}
      {isUser && msg.files?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
          {msg.files.map((f, i) => {
            const isImg = f.mimeType?.startsWith('image/')
            return isImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={f.url} alt={f.name} style={{ maxWidth: 160, maxHeight: 120, borderRadius: 6, objectFit: 'cover', border: `1px solid ${accentColor}25` }} />
            ) : (
              <a key={i} href={f.url} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#111', border: `1px solid ${accentColor}25`, borderRadius: 6, padding: '4px 8px', textDecoration: 'none' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: accentColor }}>FILE</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              </a>
            )
          })}
        </div>
      )}
      <div style={isUser ? { ...s.bubbleUser, borderColor: `${accentColor}18` } : s.bubbleAI}>
        {isUser ? (
          <span style={s.bubbleTextUser}>{msg.content}</span>
        ) : (
          <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
            {parseChatContent(msg.content).map((block, i) => <ChatContentBlock key={i} block={block} />)}
            {msg.streaming && (
              <span style={{ display: 'inline-block', width: '0.55em', marginLeft: 1, verticalAlign: 'middle', animation: 'blink 1s step-start infinite', color: accentColor }}>▋</span>
            )}
            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
          </div>
        )}
      </div>
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

function AccountPanel({ userData, onSignOut, onCheckout }) {
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
        <div key={pack.id} style={{ ...s.packRow, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff' }}>{pack.label}</span>
            {pack.badge && <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#FFB800', letterSpacing: 1 }}>{pack.badge}</span>}
          </div>
          <button onClick={() => onCheckout(pack.id)}
            style={{ background: '#00FF41', color: '#000', border: 'none', borderRadius: 6, padding: '5px 12px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            ${pack.price}
          </button>
        </div>
      ))}

      {/* Upgrade plans */}
      {userData.plan === 'free' && (
        <>
          <p style={{ ...s.sectionLabel, marginTop: 6 }}>UPGRADE</p>
          {SUBSCRIPTIONS.map(sub => (
            <div key={sub.id} style={{ background: '#0D0D0D', border: `1px solid ${sub.color}30`, borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: sub.color, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>{sub.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{sub.priceLabel}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sub.perks.map(p => (
                  <p key={p} style={{ margin: 0, fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    <span style={{ color: sub.color }}>✓</span> {p}
                  </p>
                ))}
              </div>
              <button onClick={() => onCheckout(sub.id)}
                style={{ background: sub.color, color: '#000', border: 'none', borderRadius: 7, padding: '8px', fontFamily: 'monospace', fontWeight: 700, fontSize: 12, cursor: 'pointer', marginTop: 2, letterSpacing: 1 }}>
                UPGRADE TO {sub.label.toUpperCase()}
              </button>
            </div>
          ))}
        </>
      )}

      {userData.plan !== 'free' && (
        <div style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ margin: '0 0 4px', fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>NEXT RENEWAL</p>
          <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{userData.billingCycleEnd ?? 'N/A'}</p>
        </div>
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
  bottomNav:   { display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 0', background: '#070707' },
  navBtn:      { flex: 1, background: 'none', border: 'none', padding: '8px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, borderRadius: 0 },
  navBtnActive: { background: 'rgba(0,255,65,0.05)' },
  settingRow:  { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid', borderRadius: 8, cursor: 'pointer', background: '#0D0D0D', textAlign: 'left' },
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
  inputRow:    { display: 'flex', gap: 8, padding: '8px 12px 12px', alignItems: 'flex-end' },
  attachBtn:   { background: '#0D0D0D', border: '1px solid', borderRadius: 8, padding: '0 10px', height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 },
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
