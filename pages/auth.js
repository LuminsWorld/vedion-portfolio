import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { auth, googleProvider } from '../lib/firebase'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, onAuthStateChanged,
} from 'firebase/auth'
import Head from 'next/head'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode]     = useState('login')
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (u) router.replace('/app') })
    return unsub
  }, [])

  async function handleEmail(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, pass)
      else await createUserWithEmailAndPassword(auth, email, pass)
      router.replace('/app')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleGoogle() {
    setError(''); setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      router.replace('/app')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <Head><title>Vedion — Sign In</title></Head>
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.logo}>VEDION</h1>
          <p style={s.tagline}>[ AI INTERFACE ]</p>

          <p style={s.label}>{mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</p>

          <form onSubmit={handleEmail} style={s.form}>
            <input style={s.input} type="email" placeholder="email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input style={s.input} type="password" placeholder="password"
              value={pass} onChange={e => setPass(e.target.value)} required />
            {error && <p style={s.error}>{error}</p>}
            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? '...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div style={s.divider}><div style={s.line}/><span style={s.or}>OR</span><div style={s.line}/></div>

          <button style={s.oauthBtn} onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </button>

          <p style={s.switch}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span style={s.switchLink} onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'Inter, sans-serif' },
  card: { width: '100%', maxWidth: 400, background: '#0A0A0A', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 12, padding: '2rem' },
  logo: { fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: 40, color: '#00FF41', letterSpacing: 8, textAlign: 'center', margin: 0 },
  tagline: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 4, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  label: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 4, color: '#00FF41', opacity: 0.7, marginBottom: 12 },
  form: { display: 'flex', flexDirection: 'column', gap: 8 },
  input: { background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', fontFamily: 'monospace', fontSize: 13, padding: '10px 12px', outline: 'none' },
  error: { color: '#FF2D55', fontFamily: 'monospace', fontSize: 11, margin: 0 },
  btn: { background: '#00FF41', color: '#000', border: 'none', borderRadius: 4, padding: '10px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: 2, cursor: 'pointer', marginTop: 4 },
  divider: { display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0' },
  line: { flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' },
  or: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 2 },
  oauthBtn: { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 14, padding: '10px', cursor: 'pointer' },
  switch: { fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 16 },
  switchLink: { color: '#00FF41', cursor: 'pointer' },
}
