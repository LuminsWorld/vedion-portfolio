# vedion.cloud

Personal portfolio site for Austin Tessmer. Built with Next.js, Three.js, and the Web Audio API.

Live at **[vedion.cloud](https://vedion.cloud)**

---

## Features

- **Three.js particle field** — 2,000 particles with mouse parallax and beat-reactive movement
- **Procedural audio synthesis** — 100 BPM synthesizer running an Am–F–C–G progression with kick, snare, hi-hat, bass, arp, and pad layers. No static audio files — everything generated in real time via the Web Audio API
- **Beat-synced glitch effect** — the hero title detects bass hits via an `AnalyserNode` and snaps through all five brand colors on each beat
- **Mirrored EQ visualizer** — 48 soundbars centered at the hero/content boundary, bass-centered frequency mapping
- **Project modals** — click any project card for a detail view with a glitch-open animation and beat-reactive border glow. The Vedion project includes a live embedded chat
- **Scroll-locked landing** — page is locked on load; first interaction triggers a multi-color flash reveal and card entrance animation
- **AI chat widget** — powered by Vedion, my personal AI assistant
- **Mobile responsive** — tested on iOS Safari with proper audio unlock handling

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 |
| 3D / Particles | Three.js |
| Audio | Web Audio API (procedural synthesis) |
| Styling | Tailwind CSS + custom CSS |
| Hosting | GCP VM + nginx + pm2 |
| SSL | Let's Encrypt (Certbot) |
| Domain | Hostinger → vedion.cloud |

---

## Project Structure

```
portfolio/
├── components/
│   ├── HeroCanvas.js      # Three.js particle field with mouse parallax
│   ├── EQVisualizer.js    # Mirrored soundbar EQ at hero/content boundary
│   ├── ChatWidget.js      # Floating AI chat widget
│   └── ProjectModal.js    # Project detail modal with beat-reactive glow
├── lib/
│   ├── useSynth.js        # Procedural Web Audio synthesizer hook
│   └── useBeatDetector.js # Bass-detection via AnalyserNode
├── pages/
│   ├── index.js           # Main page
│   ├── _app.js            # App wrapper
│   └── api/
│       └── chat.js        # AI chat API route
└── styles/
    └── globals.css        # Global styles, animations, media queries
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The chat widget requires an AI backend. Set your API key in a `.env.local` file if running locally.

---

## About

Made by **Austin Tessmer** — Data Science student at UW–Madison, server at Cafe Hollander, and indie music fan.

- **Site:** [vedion.cloud](https://vedion.cloud)
- **Instagram:** [@aust1n_lt](https://instagram.com/aust1n_lt)
- **Email:** austintessmer06@gmail.com
