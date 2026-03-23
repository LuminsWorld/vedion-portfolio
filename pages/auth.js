import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { auth, googleProvider } from '../lib/firebase'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, sendPasswordResetEmail, onAuthStateChanged,
} from 'firebase/auth'
import Head from 'next/head'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (u) router.replace('/app') })
    return unsub
  }, [])

  useEffect(() => {
    // Card fade-in animation
    if (cardRef.current) {
      cardRef.current.style.opacity = 0
      cardRef.current.style.transform = 'translateY(20px)'
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)'
          cardRef.current.style.opacity = 1
          cardRef.current.style.transform = 'translateY(0)'
        }
      }, 50);
    }
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

  async function handleForgotPassword() {
    setError(''); setResetSuccess(false); setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSuccess(true)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const glitchTextStyles = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "clamp(2rem, 8vw, 3.5rem)",
    fontWeight: 900,
    letterSpacing: "-0.02em",
    lineHeight: 0.9,
    textTransform: "uppercase",
    margin: 0,
    position: "relative",
    animation: "glitch-base 4s infinite",
  }

  const glitchBeforeAfterStyles = {
    content: "attr(data-text)",
    position: "absolute",
    top: 0, left: 0,
    width: "100%", height: "100%",
  }

  return (
    <>
      <Head>
        <title>Vedion — {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Forgot Password'}</title>
        <style>{`
          body { cursor: auto !important; background: #000; overflow: hidden; }
          * { cursor: auto !important; }
          button, a { cursor: pointer !important; }

          @keyframes orb-drift-1 {
            0% { transform: translate(0, 0); }
            50% { transform: translate(30px, 40px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes orb-drift-2 {
            0% { transform: translate(0, 0); }
            50% { transform: translate(-40px, -20px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes orb-drift-3 {
            0% { transform: translate(0, 0); }
            50% { transform: translate(20px, -30px); }
            100% { transform: translate(0, 0); }
          }
          .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.15;
            pointer-events: none;
          }
          .orb-1 { animation: orb-drift-1 20s infinite ease-in-out; }
          .orb-2 { animation: orb-drift-2 25s infinite ease-in-out; }
          .orb-3 { animation: orb-drift-3 22s infinite ease-in-out; }

          /* Film grain */
          @keyframes grain {
            0%, 100% { transform: translate(0,0); }
            10% { transform: translate(-2%, -3%); }
            20% { transform: translate(3%, 2%); }
            30% { transform: translate(-1%, 4%); }
            40% { transform: translate(4%, -1%); }
            50% { transform: translate(-3%, 1%); }
            60% { transform: translate(1%, -4%); }
            70% { transform: translate(-4%, 3%); }
            80% { transform: translate(2%, -2%); }
            90% { transform: translate(-1%, 2%); }
          }
          .grain::after {
            content: '';
            position: fixed;
            inset: -50%;
            width: 200%; height: 200%;
            background-image: url(data:image/svg+xml,%3Csvg viewBox=0 0 256 256 xmlns=http://www.w3.org/2000/svg%3E%3Cfilter id=noise%3E%3CfeTurbulence type=fractalNoise baseFrequency=0.9 numOctaves=4 stitchTiles=stitch/%3E%3C/filter%3E%3Crect width=100%25 height=100%25 filter=url(%23noise) opacity=0.04/%3E%3C/svg%3E);
            opacity: 0.12;
            pointer-events: none;
            animation: grain 0.5s steps(1) infinite;
            z-index: 9997;
          }

          /* Glitch text animation */
          @keyframes glitch-1 {
            0%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); color: #FF2D55; }
            20% { clip-path: inset(30% 0 50% 0); transform: translate(-4px, 2px); color: #FFB800; }
            40% { clip-path: inset(70% 0 10% 0); transform: translate(4px, -2px); color: #00FF41; }
            60% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 4px); color: #FF2D55; }
            80% { clip-path: inset(50% 0 30% 0); transform: translate(2px, -4px); color: #7B2FFF; }
          }

          @keyframes glitch-2 {
            0%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); color: #00D4FF; }
            20% { clip-path: inset(60% 0 20% 0); transform: translate(6px, -2px); color: #7B2FFF; }
            40% { clip-path: inset(20% 0 60% 0); transform: translate(-6px, 2px); color: #00D4FF; }
            60% { clip-path: inset(40% 0 40% 0); transform: translate(3px, 3px); color: #FFB800; }
            80% { clip-path: inset(10% 0 70% 0); transform: translate(-3px, -3px); color: #00FF41; }
          }

          @keyframes glitch-base {
            0%, 90%, 100% { transform: translate(0); }
            91% { transform: translate(-2px, 1px); }
            92% { transform: translate(2px, -1px); }
            93% { transform: translate(0); }
          }

          .glitch-text::before {
            color: #FF2D55;
            animation: glitch-1 4s infinite;
          }
          .glitch-text::after {
            color: #00D4FF;
            animation: glitch-2 4s infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinner { animation: spin 1s linear infinite; display: inline-block; }
        `}</style>
      </Head>

      <div className="grain" />
      <div className="orb orb-1" style={{ width: 300, height: 300, background: '#00FF41', top: '10%', left: '15%' }} />
      <div className="orb orb-2" style={{ width: 250, height: 250, background: '#7B2FFF', bottom: '15%', right: '10%' }} />
      <div className="orb orb-3" style={{ width: 200, height: 200, background: '#00D4FF', top: '20%', right: '25%' }} />

      <div style={s.page}>
        <div ref={cardRef} style={s.card}>
          <h1 className="glitch-text" data-text="VEDION" style={glitchTextStyles}>
            VEDION
          </h1>
          <p style={s.tagline}>[ {mode === 'login' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'RESET PASSWORD'} ]</p>

          {mode === 'forgot' ? (
            <>
              <form onSubmit={handleForgotPassword} style={s.form}>
                <label htmlFor="email-reset" style={s.label}>EMAIL</label>
                <input id="email-reset" style={s.input} type="email" placeholder="email@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
                {error && <p style={s.error}>{error}</p>}
                {resetSuccess && <p style={{ ...s.success, marginTop: '12px' }}>CHECK YOUR EMAIL ✓</p>}
                <button style={s.btn} type="submit" disabled={loading}>
                  {loading ? <span className="spinner">◌</span> : 'SEND RESET EMAIL'}
                </button>
              </form>
              <p style={s.switch}>
                <span style={s.switchLink} onClick={() => { setMode('login'); setError(''); setResetSuccess(false) }}>
                  ← BACK TO SIGN IN
                </span>
              </p>
            </>
          ) : (
            <>
              <form onSubmit={handleEmail} style={s.form}>
                <label htmlFor="email-auth" style={s.label}>EMAIL</label>
                <input id="email-auth" style={s.input} type="email" placeholder="email@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
                <label htmlFor="password-auth" style={{ ...s.label, marginTop: '16px' }}>PASSWORD</label>
                <input id="password-auth" style={s.input} type="password" placeholder="••••••••"
                  value={pass} onChange={e => setPass(e.target.value)} required />
                {mode === 'login' && (
                  <p style={{ textAlign: 'right', marginTop: '8px' }}>
                    <span style={s.forgotPassLink} onClick={() => { setMode('forgot'); setError('') }}>
                      FORGOT PASSWORD →
                    </span>
                  </p>
                )}
                {error && <p style={s.error}>{error}</p>}
                <button style={s.btn} type="submit" disabled={loading}>
                  {loading ? <span className="spinner">◌</span> : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </button>
              </form>

              <div style={s.divider}><div style={s.line}/><span style={s.or}>OR</span><div style={s.line}/></div>

              <button style={s.oauthBtn} onClick={handleGoogle} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{verticalAlign: 'middle', marginRight: '8px'}}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <p style={s.switch}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <span style={s.switchLink} onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}>
                  {mode === 'login' ? 'Create account' : 'Sign in'}
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'Inter, sans-serif', position: 'relative', zIndex: 1 },
  card: {
    width: '100%', maxWidth: 420,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '48px 40px',
  },
  tagline: {
    fontFamily: 'monospace', fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4, textAlign: 'center',
    marginTop: 16, marginBottom: 32,
  },
  label: {
    fontFamily: 'monospace', fontSize: 10,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  form: { display: 'flex', flexDirection: 'column' },
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#fff',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 14, padding: '12px 14px', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '::placeholder': { color: 'rgba(255,255,255,0.3)' },
    ':focus': {
      borderColor: '#00FF41',
      boxShadow: '0 0 0 2px rgba(0,255,65,0.15)',
    }
  },
  error: { color: '#FF2D55', fontFamily: 'monospace', fontSize: 11, margin: '8px 0 0 0', textAlign: 'center' },
  success: { color: '#00FF41', fontFamily: 'monospace', fontSize: 11, margin: '8px 0 0 0', textAlign: 'center' },
  btn: {
    background: '#00FF41', color: '#000',
    border: 'none', borderRadius: 4,
    padding: '12px 20px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', textTransform: 'uppercase',
    cursor: 'pointer', marginTop: 24,
    transition: 'opacity 0.2s',
    ':hover': { opacity: 0.8 },
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '32px 0' },
  line: { flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' },
  or: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '0.1em', textTransform: 'uppercase',
  },
  oauthBtn: {
    width: '100%', background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 4,
    color: '#fff',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14, padding: '12px 20px', cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
    ':hover': { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.3)' },
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  switch: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
    color: 'rgba(255,255,255,0.4)', textAlign: 'center',
    marginTop: 32,
  },
  switchLink: { color: '#00FF41', cursor: 'pointer', textDecoration: 'none' },
  forgotPassLink: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
    color: '#00FF41', cursor: 'pointer', textDecoration: 'none',
    letterSpacing: '0.05em',
  }
}