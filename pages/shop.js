import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Head from "next/head";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";


const PRODUCTS = [
  {
    id: "screen_share",
    tag: "01",
    name: "Vedion Screen Share",
    tagline: "AI-powered encrypted screen sharing for Windows.",
    price: 1999,
    display: "$19.99",
    type: "ONE-TIME",
    color: "var(--green)",
    colorHex: "#39ff8b",
    status: "available",
    features: [
      "Discord snapshot mode",
      "AI analysis (Gemini, OpenAI, Claude, Groq, Ollama)",
      "Custom hotkeys",
      "Region selector",
      "Auto-updater",
      "2 machine licenses",
    ],
    badge: "NEW",
    itemId: "screen_share",
  },
  {
    id: "coming_2",
    tag: "02",
    name: "Vedion CLI",
    tagline: "Terminal-native AI assistant. Ask anything from your shell.",
    price: null,
    display: "Coming Soon",
    type: "FREE TIER + PRO",
    color: "var(--violet)",
    colorHex: "#4B10A0",
    status: "soon",
    features: [],
    badge: "SOON",
    itemId: null,
  },
  {
    id: "coming_3",
    tag: "03",
    name: "Vedion Analytics",
    tagline: "AI-powered data analysis for R and Python projects.",
    price: null,
    display: "Coming Soon",
    type: "SUBSCRIPTION",
    color: "var(--pink)",
    colorHex: "#eb0071",
    status: "soon",
    features: [],
    badge: "SOON",
    itemId: null,
  },
];

export default function Shop() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(PRODUCTS[0]);
  const [buyLoading, setBuyLoading] = useState(false);
  const [error, setError] = useState("");
  const [navScrolled, setNavScrolled] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const glitchTimeout = useRef(null);

  // Auth gate
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        router.replace(`/auth?next=/shop`);
      }
    });
    return unsub;
  }, [router]);

  // Nav scroll blur
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal, .stagger, .glow-reveal").forEach((el) => observer.observe(el));
    setTimeout(() => setRevealed(true), 200);
    return () => observer.disconnect();
  }, []);

  // 3D card tilt
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    const cards = document.querySelectorAll(".shop-card");
    const handlers = [];
    cards.forEach((card) => {
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-6px)`;
      };
      const onLeave = () => {
        card.style.transform = "perspective(700px) rotateY(0) rotateX(0) translateY(0)";
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      handlers.push({ card, onMove, onLeave });
    });
    return () =>
      handlers.forEach(({ card, onMove, onLeave }) => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
  }, [revealed]);

  // Periodic glitch
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitching(true);
      glitchTimeout.current = setTimeout(() => setGlitching(false), 120);
    }, 4000);
    return () => {
      clearInterval(interval);
      clearTimeout(glitchTimeout.current);
    };
  }, []);

  async function handleBuy() {
    if (!selected || selected.status !== "available") return;
    if (!user) { router.push("/auth?next=/shop"); return; }
    setBuyLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: selected.itemId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong.");
        setBuyLoading(false);
      }
    } catch (e) {
      setError("Network error. Try again.");
      setBuyLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ background: '#04040a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'rgba(57,255,139,0.5)', letterSpacing: '0.3em' }}>
          VERIFYING
        </div>
      </div>
    )
  }
  if (false) {
    return (
      <div
        style={{
          background: "var(--bg)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Shop — Vedion</title>
        <meta
          name="description"
          content="Tools built by Vedion. Encrypted screen sharing, AI utilities, and more."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="grain" />

      {/* NAV */}
      <nav
        className={navScrolled ? "nav-scrolled" : ""}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "1.25rem clamp(1.25rem, 5vw, 2rem)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "all 0.3s ease",
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: "var(--green)",
            textDecoration: "none",
          }}
        >
          VEDION
        </a>
        <div style={{ display: "flex", gap: "clamp(1rem, 4vw, 2rem)", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "#000",
              background: "var(--green)",
              padding: "5px 12px",
              borderRadius: 3,
              fontWeight: 700,
            }}
          >
            SHOP
          </span>
          <a
            href="/learn"
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "var(--green)")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.5)")}
          >
            LEARN
          </a>
          <a
            href="/"
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.5)")}
          >
            BACK
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="scanlines"
        style={{
          position: "relative",
          height: "100svh",
          minHeight: 560,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          padding: "clamp(5rem, 14vw, 9rem) clamp(1.25rem, 6vw, 4rem) 0",
          background: "var(--bg)",
          backgroundImage: "url(/assets/gen/shop_hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(4,4,10,0.6)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />


        {/* Color orbs */}
        <div
          className="orb"
          style={{
            width: "clamp(200px,45vw,520px)",
            height: "clamp(200px,45vw,520px)",
            background: "#4B10A0",
            top: "-80px",
            right: "8%",
            opacity: 0.55,
          }}
        />
        <div
          className="orb"
          style={{
            width: "clamp(120px,28vw,340px)",
            height: "clamp(120px,28vw,340px)",
            background: "#00D4FF",
            bottom: "15%",
            right: "22%",
            opacity: 0.4,
          }}
        />
        <div
          className="orb"
          style={{
            width: "clamp(80px,18vw,220px)",
            height: "clamp(80px,18vw,220px)",
            background: "#39ff8b",
            top: "30%",
            left: "3%",
            opacity: 0.3,
          }}
        />

        {/* Text content */}
        <div style={{ position: "relative", zIndex: 10, maxWidth: 900, width: "100%" }}>
          <div className="section-label" style={{ marginBottom: "1.25rem" }}>
            VEDION TOOLS — 2026
          </div>
          <h1
            className={glitching ? "glitch-text beat-active" : "glitch-text"}
            data-text="SHOP"
            style={{
              fontSize: "clamp(4rem, 16vw, 10rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 0.9,
              textTransform: "uppercase",
              fontFamily: "Inter, sans-serif",
              margin: 0,
            }}
          >
            SHOP
          </h1>
          <p
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
              color: "rgba(255,255,255,0.4)",
              marginTop: "1.25rem",
              letterSpacing: "0.05em",
            }}
          >
            Software built for developers. One-time purchases. No fluff.
          </p>
        </div>

        {/* Label at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "clamp(3rem, 8vw, 6rem)",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "9px",
              letterSpacing: "0.4em",
              color: selected?.color ?? "var(--green)",
              opacity: 0.6,
            }}
          >
            AES-256 · ENCRYPTED · REAL-TIME
          </div>
        </div>

        {/* Gradient fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            background: "linear-gradient(transparent, #000)",
            zIndex: 5,
            pointerEvents: "none",
          }}
        />
      </section>

      {/* PRODUCT GRID + DETAIL */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(3rem, 8vw, 6rem) clamp(1.25rem, 5vw, 2rem)",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(1.5rem, 4vw, 3rem)",
          }}
        >
          {/* LEFT — Product cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="section-label reveal" style={{ marginBottom: "0.75rem" }}>
              PRODUCTS
            </div>
            {PRODUCTS.map((p, i) => (
              <div
                key={p.id}
                className="shop-card"
                onClick={() => p.status === "available" && setSelected(p)}
                style={{
                  padding: "1.5rem",
                  border: `1px solid ${
                    selected?.id === p.id ? p.colorHex + "66" : "rgba(255,255,255,0.07)"
                  }`,
                  borderRadius: 8,
                  cursor: p.status === "available" ? "pointer" : "default",
                  background: selected?.id === p.id ? p.colorHex + "08" : "rgba(255,255,255,0.01)",
                  transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
                  position: "relative",
                  overflow: "hidden",
                  opacity: p.status === "soon" ? 0.5 : 1,
                }}
              >
                {/* Active glow line */}
                {selected?.id === p.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: p.colorHex,
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div
                      style={{
                        fontFamily: "JetBrains Mono",
                        fontSize: "10px",
                        color: p.color,
                        letterSpacing: "0.2em",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {p.tag}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.35rem" }}>
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "JetBrains Mono",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {p.type}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "0.4rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "JetBrains Mono",
                        fontSize: "9px",
                        letterSpacing: "0.2em",
                        color: p.status === "available" ? "#000" : p.colorHex,
                        background: p.status === "available" ? p.colorHex : "transparent",
                        border: `1px solid ${p.colorHex}`,
                        padding: "2px 8px",
                        borderRadius: 2,
                      }}
                    >
                      {p.badge}
                    </span>
                    <span
                      style={{
                        fontFamily: "JetBrains Mono",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: p.color,
                      }}
                    >
                      {p.display}
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.6,
                    marginTop: "0.75rem",
                    marginBottom: 0,
                  }}
                >
                  {p.tagline}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT — Detail panel */}
          <div style={{ position: "sticky", top: 100, height: "fit-content" }}>
            {selected ? (
              <div
                key={selected.id}
                style={{
                  border: `1px solid ${selected.colorHex}33`,
                  borderRadius: 12,
                  padding: "clamp(1.5rem, 4vw, 2.5rem)",
                  background: `${selected.colorHex}05`,
                  position: "relative",
                  overflow: "hidden",
                  animation: "panelFadeIn 0.35s ease",
                }}
              >
                {/* Corner accent */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 60,
                    height: 60,
                    borderBottom: `1px solid ${selected.colorHex}33`,
                    borderLeft: `1px solid ${selected.colorHex}33`,
                    borderRadius: "0 12px 0 0",
                  }}
                />

                <div
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "10px",
                    color: selected.color,
                    letterSpacing: "0.3em",
                    marginBottom: "1rem",
                  }}
                >
                  SELECTED / {selected.tag}
                </div>

                <h2
                  style={{
                    fontSize: "clamp(1.4rem, 3vw, 2rem)",
                    fontWeight: 900,
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {selected.name}
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.7,
                    marginBottom: "1.75rem",
                  }}
                >
                  {selected.tagline}
                </p>

                {/* Features list */}
                {selected.features.length > 0 && (
                  <div style={{ marginBottom: "2rem" }}>
                    <div
                      style={{
                        fontFamily: "JetBrains Mono",
                        fontSize: "9px",
                        letterSpacing: "0.25em",
                        color: "rgba(255,255,255,0.3)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      INCLUDES
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {selected.features.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.65)",
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            style={{ flexShrink: 0, color: selected.color }}
                          >
                            <path
                              fill="currentColor"
                              d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 11-1.06-1.06l7.25-7.25a.75.75 0 011.06 0z"
                            />
                            <path
                              fill="currentColor"
                              d="M2.22 9.28l3.25-3.25a.75.75 0 111.06 1.06L3.28 10.34a.75.75 0 01-1.06-1.06z"
                            />
                          </svg>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "JetBrains Mono",
                      fontSize: "2.5rem",
                      fontWeight: 900,
                      color: selected.color,
                    }}
                  >
                    {selected.display}
                  </span>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono",
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.3)",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {selected.type}
                  </span>
                </div>

                {/* Buy button */}
                {selected.status === "available" ? (
                  <>
                    <button
                      onClick={handleBuy}
                      disabled={buyLoading}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        background: buyLoading ? "rgba(255,255,255,0.05)" : selected.colorHex,
                        color: buyLoading ? "rgba(255,255,255,0.4)" : "#000",
                        border: `1px solid ${selected.colorHex}`,
                        borderRadius: 6,
                        fontSize: "13px",
                        fontWeight: 700,
                        fontFamily: "JetBrains Mono",
                        letterSpacing: "0.15em",
                        cursor: buyLoading ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        marginBottom: "0.75rem",
                      }}
                      onMouseEnter={(e) => {
                        if (!buyLoading) {
                          e.currentTarget.style.background = "#000";
                          e.currentTarget.style.color = selected.colorHex;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!buyLoading) {
                          e.currentTarget.style.background = selected.colorHex;
                          e.currentTarget.style.color = "#000";
                        }
                      }}
                    >
                      {buyLoading ? "REDIRECTING..." : "PURCHASE"}
                    </button>
                    {error && (
                      <div
                        style={{
                          fontFamily: "JetBrains Mono",
                          color: "#f87171",
                          fontSize: "11px",
                          marginBottom: "0.75rem",
                        }}
                      >
                        {error}
                      </div>
                    )}
                    <div
                      style={{
                        fontFamily: "JetBrains Mono",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.2)",
                        letterSpacing: "0.05em",
                        textAlign: "center",
                      }}
                    >
                      Secure checkout via Stripe · License key delivered instantly
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      padding: "1rem",
                      textAlign: "center",
                      border: `1px solid ${selected.colorHex}33`,
                      borderRadius: 6,
                      fontFamily: "JetBrains Mono",
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.25)",
                      letterSpacing: "0.15em",
                    }}
                  >
                    NOT YET AVAILABLE
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(3rem, 8vw, 6rem) clamp(1.25rem, 5vw, 2rem)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "var(--bg)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="section-label reveal" style={{ marginBottom: "1rem" }}>
            HOW IT WORKS
          </div>
          <h2
            className="reveal"
            style={{
              fontSize: "clamp(1.6rem, 4vw, 3rem)",
              fontWeight: 900,
              marginBottom: "3rem",
              letterSpacing: "-0.02em",
            }}
          >
            Vedion Screen Share
          </h2>
          <div
            className="stagger"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {[
              {
                step: "01",
                title: "Capture",
                desc: "Screen or custom region captured locally. Only what you select — nothing more.",
                color: "var(--green)",
              },
              {
                step: "02",
                title: "Encrypt",
                desc: "Frame encrypted with AES-256 before it leaves your machine.",
                color: "#FFB800",
              },
              {
                step: "03",
                title: "Analyze",
                desc: "Sent to your AI provider — Gemini, Claude, GPT-4o, or Vedion directly.",
                color: "var(--violet)",
              },
              {
                step: "04",
                title: "Respond",
                desc: "AI response posts to your Discord channel in real time.",
                color: "#00D4FF",
              },
            ].map((s, i) => (
              <div key={i} className="project-card" style={{ padding: "1.5rem", position: "relative" }}>
                <div
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "9px",
                    color: s.color,
                    letterSpacing: "0.25em",
                    marginBottom: "1rem",
                  }}
                >
                  {s.step}
                </div>
                <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                  {["📍", "🔒", "🤖", "💬"][i]}
                </div>
                <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{s.title}</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.6,
                  }}
                >
                  {s.desc}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${s.color}, transparent)`,
                    opacity: 0.3,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(3rem, 8vw, 6rem) clamp(1.25rem, 5vw, 2rem)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "var(--bg)",
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div className="section-label reveal" style={{ marginBottom: "1rem" }}>
            FAQ
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              {
                q: "Does it record my screen without me knowing?",
                a: "No. The app shows a system tray icon and requires your explicit setup and start. You see exactly what's being captured before it sends anything.",
              },
              {
                q: "Can it see outside the region I select?",
                a: "No. Region capture physically only reads pixels inside your chosen rectangle. Nothing outside is ever captured, encoded, or transmitted.",
              },
              {
                q: "Do I need a paid AI subscription?",
                a: "Not necessarily. The Vedion Discord relay (free) forwards frames to Vedion directly. If you want Gemini, Claude or GPT-4o you need your own API key.",
              },
              {
                q: "Is the license tied to one machine?",
                a: "Yes — one machine per license. Contact support if you need to transfer it.",
              },
              {
                q: "What happens if vedion.cloud is down?",
                a: "The app caches your validated license locally and allows offline use.",
              },
            ].map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          position: "relative",
          zIndex: 2,
          padding: "1.5rem clamp(1.25rem, 5vw, 2rem)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg)",
        }}
      >
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: "10px",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.2em",
          }}
        >
          © 2026 AUSTIN TESSMER
        </span>
        <a
          href="/"
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: "10px",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.2em",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "var(--green)")}
          onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.2)")}
        >
          ← VEDION.CLOUD
        </a>
      </footer>


      <style>{`
        @keyframes panelFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "1.25rem 0",
        cursor: "pointer",
      }}
      onClick={() => setOpen((o) => !o)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: "14px",
            color: open ? "var(--green)" : "rgba(255,255,255,0.85)",
            transition: "color 0.2s",
          }}
        >
          {q}
        </span>
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: "14px",
            color: "var(--green)",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          +
        </span>
      </div>
      {open && (
        <p
          style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.7,
            marginTop: "0.75rem",
            marginBottom: 0,
            animation: "panelFadeIn 0.25s ease",
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}
