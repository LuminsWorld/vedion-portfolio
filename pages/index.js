import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import ChatWidget from "../components/ChatWidget";
import ProjectModal from "../components/ProjectModal";
import EQVisualizer from "../components/EQVisualizer";
import { useSynth } from "../lib/useSynth";

const HeroCanvas = dynamic(() => import("../components/HeroCanvas"), { ssr: false });

const PROJECTS = [
  {
    title: "Portfolio Site",
    tags: ["Next.js", "Three.js", "WebAudio"],
    desc: "This site. Three.js particles, beat-synced glitch effects, procedural audio synthesis, and an AI chat widget.",
    detail: "Built entirely from scratch. The hero features a Three.js particle field that reacts to a procedural Web Audio synthesizer running a 100 BPM Am-F-C-G progression. The glitch effect on the title is beat-detected from the audio analyser node. Every animation — from the EQ visualizer divider to the scroll reveals — was hand-coded with no animation libraries.",
    highlights: ["Beat-synced Three.js particle system", "Procedural Web Audio synthesis — no static audio files", "Multi-color glitch text driven by AnalyserNode", "Mirrored EQ visualizer with centered bass spike", "Reveal-locked landing with animated card entrance"],
    color: "var(--green)", colorHex: "#00FF41",
    link: "https://github.com/LuminsWorld/vedion-portfolio",
    hasChat: false, isPlaceholder: false,
  },
  {
    title: "Vedion — AI Agent",
    tags: ["AI", "Node.js", "OpenClaw"],
    desc: "My personal AI assistant. Manages my calendar, work schedule, daily digest, and assists with code — running 24/7.",
    detail: "Vedion is a fully autonomous AI agent running 24/7 on a home server via OpenClaw. It manages my Google Calendar, syncs my HotSchedules work shifts, sends me a daily digest to Discord every morning at 6:30 AM, and assists with coding tasks over SSH to my GCP VM. It can generate images, search the web, and maintain long-term memory across sessions.",
    highlights: ["Daily 6:30 AM digest with schedule, weather, and Canvas assignments", "Google Calendar + HotSchedules sync", "Autonomous coding assistant with SSH to GCP VM", "Long-term memory persistence across sessions", "You are talking to it right now — try the chat →"],
    color: "var(--violet)", colorHex: "#7B2FFF",
    hasChat: true, isPlaceholder: false,
  },
  {
    title: "More Coming Soon",
    tags: ["..."],
    desc: "New projects in the works. Check back.",
    detail: "More projects are actively in development. Check back soon.",
    highlights: [],
    color: "var(--ice)", colorHex: "#00D4FF",
    hasChat: false, isPlaceholder: true,
  },
];

export default function Home() {
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [glitching, setGlitching] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const glitchTimeout = useRef(null);
  const { start: synthStart, stop: synthStop, analyserRef } = useSynth();

  // Custom cursor (desktop only)
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    const cursor = document.createElement("div");
    const ring = document.createElement("div");
    cursor.className = "cursor";
    ring.className = "cursor-ring";
    document.body.appendChild(cursor);
    document.body.appendChild(ring);
    let mx = 0, my = 0, rx = 0, ry = 0;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    document.addEventListener("mousemove", onMove);
    const animCursor = () => {
      cursor.style.left = mx - 6 + "px";
      cursor.style.top = my - 6 + "px";
      rx += (mx - rx - 16) * 0.12;
      ry += (my - ry - 16) * 0.12;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(animCursor);
    };
    animCursor();
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
      if (ring.parentNode) ring.parentNode.removeChild(ring);
    };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger, .glow-reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Lock scroll until user reveals work
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Nav scroll blur
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Beat-driven glitch
  useEffect(() => {
    let rafId, lastBeat = 0, threshold = 100;
    const tick = () => {
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bass = data.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
        threshold = threshold * 0.96 + 50;
        const now = Date.now();
        if (bass > threshold && now - lastBeat > 200) {
          lastBeat = now;
          setGlitching(true);
          clearTimeout(glitchTimeout.current);
          glitchTimeout.current = setTimeout(() => setGlitching(false), 150);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Auto-start on first user interaction (browser requires gesture for AudioContext)
  const startedRef = useRef(false);
  useEffect(() => {
    const tryAutoplay = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      synthStart();
      setPlaying(true);
    };
    document.addEventListener('touchstart', tryAutoplay, { once: true, passive: true });
    document.addEventListener('click', tryAutoplay, { once: true });
    document.addEventListener('scroll', tryAutoplay, { once: true, passive: true });
    return () => {
      document.removeEventListener('touchstart', tryAutoplay);
      document.removeEventListener('click', tryAutoplay);
      document.removeEventListener('scroll', tryAutoplay);
    };
  }, []);

  const handleReveal = () => {
    if (revealed) {
      // Already revealed — just scroll, no animation
      const el = document.getElementById('work');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    // First time — play flash animation then unlock
    setFlashing(true);
    setTimeout(() => {
      setFlashing(false);
      setRevealed(true);
      document.body.style.overflow = '';
      setTimeout(() => {
        setCardsVisible(true);
        const el = document.getElementById('work');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }, 700);
  };

  const toggleAudio = () => {
    startedRef.current = true;
    if (playing) { synthStop(); setPlaying(false); }
    else { synthStart(); setPlaying(true); }
  };

  return (
    <>
      <Head>
        <title>Vedion — Austin Tessmer</title>
        <meta name="description" content="Student developer portfolio" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Full-screen flash overlay for reveal animation */}
      {flashing && (
        <div className="reveal-flash" style={{
          position: "fixed", inset: 0, zIndex: 9996, pointerEvents: "none"
        }} />
      )}

      <div className="grain" />

      {/* NAV */}
      <nav
        className={navScrolled ? "nav-scrolled" : ""}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "1.25rem clamp(1.25rem, 5vw, 2rem)", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.3s ease" }}
      >
        <span
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ fontFamily: "JetBrains Mono", fontSize: "11px", letterSpacing: "0.3em", color: "var(--green)", cursor: "pointer" }}
        >VEDION</span>
        <div style={{ display: "flex", gap: "clamp(1rem, 4vw, 2rem)", alignItems: "center" }}>
          <a href="/app" style={{ fontFamily: "JetBrains Mono", fontSize: "10px", letterSpacing: "0.2em", color: "#000", background: "var(--green)", padding: "5px 12px", borderRadius: 3, textDecoration: "none", fontWeight: 700 }}>
            OPEN APP
          </a>
          {["WORK", "ABOUT", "CONTACT"].map(l => (
            <a key={l} href={"#" + l.toLowerCase()}
              onClick={e => {
                if (!revealed) {
                  e.preventDefault();
                  handleReveal();
                  setTimeout(() => {
                    const el = document.getElementById(l.toLowerCase());
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 800);
                }
              }}
              style={{ fontFamily: "JetBrains Mono", fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "var(--green)"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}>
              {l}
            </a>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section
        className="scanlines"
        style={{ position: "relative", height: "100svh", minHeight: "580px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", padding: "0 clamp(1.25rem, 6vw, 4rem)", background: "transparent", zIndex: 1 }}
      >
        <HeroCanvas analyserRef={analyserRef} />

        {/* Color orbs */}
        <div className="orb" style={{ width: "clamp(150px,40vw,400px)", height: "clamp(150px,40vw,400px)", background: "#7B2FFF", top: "-100px", right: "10%" }} />
        <div className="orb" style={{ width: "clamp(100px,25vw,280px)", height: "clamp(100px,25vw,280px)", background: "#00D4FF", bottom: "10%", right: "20%" }} />
        <div className="orb" style={{ width: "clamp(60px,15vw,180px)", height: "clamp(60px,15vw,180px)", background: "#00FF41", bottom: "25%", left: "5%" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: "900px", width: "100%" }}>
          <div className="section-label" style={{ marginBottom: "1.25rem" }}>PORTFOLIO — 2026</div>

          <h1
            className={glitching ? "glitch-text beat-active" : "glitch-text"}
            data-text="VEDION"
            style={{ fontSize: "clamp(3.5rem, 14vw, 9rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 0.9, textTransform: "uppercase", fontFamily: "Inter, sans-serif", margin: 0 }}
          >
            VEDION
          </h1>

          {/* Subtitle - stacked on mobile */}
          <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: "12px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>
              by student developer Austin Tessmer
            </span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: "11px", color: "var(--green)", letterSpacing: "0.03em" }}>
              {"{ available_for_work: true }"}
            </span>
          </div>

          {/* Buttons */}
          <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleReveal}
              style={{ border: "1px solid var(--green)", color: "var(--green)", background: "transparent", padding: "0.7rem 1.5rem", fontFamily: "JetBrains Mono", fontSize: "11px", letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.2s", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--green)"; e.currentTarget.style.color = "#000"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--green)"; }}
            >
              VIEW WORK
            </button>
            <button
              onClick={toggleAudio}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)", padding: "0.7rem 1.5rem", fontFamily: "JetBrains Mono", fontSize: "11px", letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.2s", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            >
              {playing
                ? <><svg width="11" height="12" viewBox="0 0 11 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'5px'}}><rect x="0" y="0" width="3.5" height="12" rx="1" fill="#00FF41"/><rect x="7.5" y="0" width="3.5" height="12" rx="1" fill="#00FF41"/></svg><span style={{color:'#00FF41'}}>PAUSE</span></>
                : <><svg width="11" height="12" viewBox="0 0 11 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'5px'}}><polygon points="0,0 11,6 0,12" fill="#00FF41"/></svg><span style={{color:'#00FF41'}}>PLAY</span></>}
            </button>
          </div>
        </div>


      </section>



      {/* EQ BAR — sibling, z-index 10 above hero(1) and projects(2), transform centers on boundary */}
      <div style={{ position: "relative", zIndex: 10, transform: "translateY(-50%)", marginBottom: "-100px" }}>
        <EQVisualizer analyserRef={analyserRef} />
      </div>

      {/* PROJECTS */}
      <section id="work" style={{ position: "relative", zIndex: 2, padding: "clamp(4rem, 10vw, 8rem) clamp(1.25rem, 5vw, 2rem)", background: "#000" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className={`section-label ${cardsVisible ? "section-rise" : ""}`} style={{ marginBottom: "1rem" }}>SELECTED WORK</div>
          <h2 className="reveal" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 900, marginBottom: "3rem", letterSpacing: "-0.02em" }}>Projects</h2>
          <div className={cardsVisible ? "stagger visible" : "stagger"} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
            {PROJECTS.map((p, i) => (
              <div key={i} className={cardsVisible ? "project-card card-slam" : "project-card"} onClick={() => setSelectedProject(p)} style={{ cursor: "pointer" }}>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: p.color, letterSpacing: "0.2em", marginBottom: "0.75rem" }}>
                  {String(i+1).padStart(2, "0")}
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem" }}>{p.title}</h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: "1rem" }}>{p.desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {p.tags.map(t => (
                    <span key={t} style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: p.color, border: `1px solid ${p.color}44`, padding: "2px 8px", borderRadius: 2 }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ position: "relative", zIndex: 2, padding: "clamp(4rem, 10vw, 8rem) clamp(1.25rem, 5vw, 2rem)", borderTop: "1px solid rgba(255,255,255,0.05)", background: "#000" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div className="section-label reveal" style={{ marginBottom: "1rem" }}>ABOUT</div>
          <h2 className="reveal" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, marginBottom: "2rem", letterSpacing: "-0.02em" }}>Austin Tessmer</h2>
          <p className="reveal" style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
            Data Science student at UW-Madison. I build things at the intersection of data, code, and design.
            When I am not writing Python or R, I am serving tables at Cafe Hollander or digging through indie music.
          </p>
          <p className="reveal" style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
            This site is powered by an AI called Vedion — my personal assistant. Hit the chat button and ask it anything.
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1.5rem" }}>
            {[["GITHUB", "https://github.com/LuminsWorld"], ["LINKEDIN", "#"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontFamily: "JetBrains Mono", fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "var(--green)"}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.35)"}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ position: "relative", zIndex: 2, padding: "clamp(4rem, 10vw, 8rem) clamp(1.25rem, 5vw, 2rem)", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", background: "#000" }}>
        <div className="section-label reveal" style={{ marginBottom: "1rem" }}>CONTACT</div>
        <h2 className="glow-reveal" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: "1.5rem" }}>
          Let&apos;s work<br /><span style={{ color: "var(--green)" }}>together.</span>
        </h2>
        <a href="mailto:austintessmer06@gmail.com" style={{ fontFamily: "JetBrains Mono", fontSize: "13px", color: "var(--green)", textDecoration: "none", letterSpacing: "0.1em" }}>
          austintessmer06@gmail.com
        </a>
        <div style={{ marginTop: "1.5rem" }}>
          <a href="https://instagram.com/aust1n_lt" target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontFamily: "JetBrains Mono", fontSize: "12px", color: "var(--green)", textDecoration: "none", letterSpacing: "0.1em", transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="#00FF41" strokeWidth="2"/>
              <circle cx="12" cy="12" r="4" stroke="#00FF41" strokeWidth="2"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="#00FF41"/>
            </svg>
            aust1n_lt
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: "relative", zIndex: 2, padding: "1.5rem clamp(1.25rem, 5vw, 2rem)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#000" }}>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>© 2026 AUSTIN TESSMER</span>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>POWERED BY VEDION</span>
      </footer>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          analyserRef={analyserRef}
        />
      )}

      <ChatWidget />
    </>
  );
}
