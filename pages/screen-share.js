import Head from 'next/head'
import { useState } from 'react'

export default function ScreenSharePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBuy() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemId: 'screen_share' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong.')
        setLoading(false)
      }
    } catch (e) {
      setError('Network error. Try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Vedion Screen Share — vedion.cloud</title>
        <meta name="description" content="Encrypted background screen sharing for Windows with AI analysis." />
      </Head>

      <main style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#f0f0f0',
        fontFamily: "'Space Mono', monospace",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 20px',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 13, letterSpacing: 4, color: '#888', marginBottom: 16 }}>VEDION TOOLS</div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
            Screen Share
          </h1>
          <p style={{ color: '#888', marginTop: 16, maxWidth: 500, lineHeight: 1.6 }}>
            Encrypted background screen sharing for Windows. Send your screen to any AI — or directly to Vedion — with one hotkey.
          </p>
        </div>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          maxWidth: 800,
          width: '100%',
          marginBottom: 60,
        }}>
          {[
            { icon: '🔒', title: 'AES-256 Encrypted', desc: 'Every frame encrypted before it leaves your machine.' },
            { icon: '🤖', title: 'Any AI Provider', desc: 'Gemini, Claude, GPT-4o, Groq, Ollama, or Vedion direct.' },
            { icon: '📸', title: 'Live or Snapshot', desc: 'Continuous feed or press a hotkey to send a single frame.' },
            { icon: '✂️', title: 'Region Selection', desc: 'Drag to select exactly what part of your screen to share.' },
            { icon: '⌨️', title: 'Custom Hotkeys', desc: 'Set your own key combos for pause, resume, and snapshot.' },
            { icon: '💬', title: 'Discord Responses', desc: 'AI responses post directly to your Discord channel.' },
          ].map(f => (
            <div key={f.title} style={{
              background: '#111',
              border: '1px solid #222',
              borderRadius: 8,
              padding: '20px',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
              <div style={{ color: '#888', fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{
          background: '#111',
          border: '1px solid #333',
          borderRadius: 12,
          padding: '40px',
          textAlign: 'center',
          maxWidth: 400,
          width: '100%',
          marginBottom: 60,
        }}>
          <div style={{ fontSize: 13, letterSpacing: 3, color: '#888', marginBottom: 12 }}>ONE-TIME PURCHASE</div>
          <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 4 }}>$19.99</div>
          <div style={{ color: '#666', fontSize: 13, marginBottom: 32 }}>No subscription. Yours forever.</div>

          <ul style={{ textAlign: 'left', color: '#aaa', fontSize: 13, lineHeight: 2, padding: '0 0 0 20px', marginBottom: 32 }}>
            <li>Windows 10/11 — single license</li>
            <li>All AI providers included</li>
            <li>Lifetime updates</li>
            <li>Discord AI relay included</li>
          </ul>

          <button
            onClick={handleBuy}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#333' : '#fff',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Redirecting...' : 'Buy Now →'}
          </button>

          {error && (
            <div style={{ color: '#f87171', fontSize: 12, marginTop: 12 }}>{error}</div>
          )}

          <div style={{ color: '#555', fontSize: 11, marginTop: 16 }}>
            Secure checkout via Stripe. License key delivered instantly.
          </div>
        </div>

        {/* System requirements */}
        <div style={{ color: '#555', fontSize: 12, textAlign: 'center' }}>
          <strong style={{ color: '#666' }}>Requirements:</strong> Windows 10/11 · .NET 6.0 Runtime
        </div>

        {/* Back link */}
        <a href="/" style={{ color: '#555', fontSize: 12, marginTop: 32, textDecoration: 'none' }}>
          ← Back to vedion.cloud
        </a>

      </main>
    </>
  )
}
