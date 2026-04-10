import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const PLAN_COLORS = {
  ultra: '#FFB800',
  pro:   '#7B2FFF',
  free:  'rgba(255,255,255,0.25)',
}

export default function LearnAccountButton() {
  const [user, setUser]         = useState(undefined) // undefined = loading, null = signed out
  const [userData, setUserData] = useState(null)
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const dropRef = useRef(null)

  // Auth state listener
  useEffect(() => {
    let unsub = () => {}
    import('../lib/firebase').then(({ auth }) => {
      unsub = auth.onAuthStateChanged(async (u) => {
        setUser(u)
        if (u) {
          try {
            const token = await u.getIdToken()
            const res = await fetch('/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setUserData(await res.json())
          } catch (_) {}
        } else {
          setUserData(null)
        }
      })
    })
    return () => unsub()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function signIn() {
    setLoading(true)
    try {
      const { auth, googleProvider } = await import('../lib/firebase')
      const { signInWithPopup } = await import('firebase/auth')
      await signInWithPopup(auth, googleProvider)
    } catch (_) {}
    setLoading(false)
  }

  async function signOut() {
    setOpen(false)
    const { auth } = await import('../lib/firebase')
    await auth.signOut()
    setUser(null)
    setUserData(null)
  }

  const plan      = userData?.plan ?? 'free'
  const credits   = userData?.credits ?? 0
  const planColor = PLAN_COLORS[plan] ?? PLAN_COLORS.free
  const initial   = user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'

  // Loading state
  if (user === undefined) return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
  )

  // Signed out
  if (!user) return (
    <button onClick={signIn} disabled={loading} style={{ background: 'rgba(0,255,65,0.08)', border: '1px solid rgba(0,255,65,0.25)', borderRadius: 6, padding: '6px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#00FF41', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,65,0.15)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,255,65,0.08)'}>
      {loading ? '...' : 'SIGN IN'}
    </button>
  )

  // Signed in
  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.04)', border: `1px solid ${open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '5px 10px 5px 5px', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
        {/* Avatar */}
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${planColor}22`, border: `1px solid ${planColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: planColor, flexShrink: 0 }}>
          {initial}
        </div>
        {/* Plan badge */}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: planColor, textTransform: 'uppercase' }}>
          {plan}
        </span>
        {/* Caret */}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'rgba(255,255,255,0.25)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', marginLeft: 2 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          {/* User info */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName ?? user.email}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>

          {/* Plan + credits */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.15em', color: planColor, background: `${planColor}15`, padding: '3px 8px', borderRadius: 4, border: `1px solid ${planColor}30`, textTransform: 'uppercase' }}>{plan}</span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              {credits.toLocaleString()} cr
            </span>
          </div>

          {/* Links */}
          <div style={{ padding: '6px 0' }}>
            <Link href="/learn" onClick={() => setOpen(false)} style={{ display: 'block', padding: '8px 16px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>
              All Courses
            </Link>

            {plan === 'free' && (
              <Link href="/shop" onClick={() => setOpen(false)} style={{ display: 'block', padding: '8px 16px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#7B2FFF', textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,47,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                Upgrade for AI Explanations
              </Link>
            )}
          </div>

          {/* Sign out */}
          <div style={{ padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={signOut} style={{ display: 'block', width: '100%', padding: '8px 16px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(255,45,85,0.7)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,45,85,0.05)'; e.currentTarget.style.color = '#FF2D55' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,45,85,0.7)' }}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
