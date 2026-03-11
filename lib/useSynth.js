import { useRef, useCallback, useEffect } from 'react';

// Minimal, iOS-safe Web Audio synth
// Rules: no async, no await, synchronous AudioContext creation inside user gesture

const BPM = 100;
const STEP = (60 / BPM) / 4;
const BASS = [55,0,0,55,0,73.4,0,0,55,0,0,55,0,0,82.4,0];
const KICK = [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0];
const HAT  = [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0];
const CHORDS = [
  [220,261.6,329.6],
  [174.6,220,261.6],
  [261.6,329.6,392],
  [196,246.9,293.7],
];
const ARP = [0,2,1,2,0,2,1,-1,0,2,1,2,-1,1,2,-1];

export function useSynth() {
  const refs = useRef({ playing: false, timers: [], ctx: null });
  const analyserRef = useRef(null);

  const start = useCallback(() => {
    if (refs.current.playing) return;

    // Must be synchronous - no async/await for iOS
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // iOS silent-buffer unlock
    const silent = ctx.createBuffer(1, 1, 22050);
    const silentSrc = ctx.createBufferSource();
    silentSrc.buffer = silent;
    silentSrc.connect(ctx.destination);
    silentSrc.start(0);

    // Resume if suspended (non-blocking)
    if (ctx.state !== 'running') ctx.resume();

    // Master bus
    const master = ctx.createGain();
    master.gain.value = 0.85;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -4;
    comp.ratio.value = 8;
    master.connect(analyser);
    analyser.connect(comp);
    comp.connect(ctx.destination);
    analyserRef.current = analyser;

    // Reverb
    const revLen = ctx.sampleRate * 2;
    const revBuf = ctx.createBuffer(2, revLen, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = revBuf.getChannelData(c);
      for (let i = 0; i < revLen; i++) d[i] = (Math.random()*2-1) * (1-i/revLen);
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = revBuf;
    const rvg = ctx.createGain();
    rvg.gain.value = 0.2;
    reverb.connect(rvg);
    rvg.connect(master);

    refs.current = { playing: true, ctx, timers: [] };

    const addTimer = (fn, ms) => {
      const id = setTimeout(fn, ms);
      refs.current.timers.push(id);
    };

    const kick = (t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(0.001, t + 0.5);
      g.gain.setValueAtTime(3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.51);
    };

    const snare = (t) => {
      const n = Math.floor(ctx.sampleRate * 0.12);
      const b = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/n, 0.6);
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.5;
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.12);
      s.buffer = b; s.connect(f); f.connect(g);
      g.connect(reverb); g.connect(master);
      s.start(t); s.stop(t+0.13);
    };

    const hat = (t) => {
      const n = Math.floor(ctx.sampleRate * 0.04);
      const b = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random()*2-1;
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'highpass'; f.frequency.value = 9000;
      g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.04);
      s.buffer = b; s.connect(f); f.connect(g); g.connect(master);
      s.start(t); s.stop(t+0.05);
    };

    const bass = (t, freq) => {
      if (!freq) return;
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = freq;
      f.type = 'lowpass';
      f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(180, t+0.2);
      f.Q.value = 4;
      g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.25);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t); o.stop(t+0.26);
    };

    const arp = (t, freq) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = freq * 2;
      g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t+STEP*1.5);
      o.connect(g); g.connect(reverb); g.connect(master);
      o.start(t); o.stop(t+STEP*1.6);
    };

    // Chord pads
    let chordBar = 0;
    const schedChord = () => {
      if (!refs.current.playing) return;
      const chord = CHORDS[chordBar % 4];
      const t = ctx.currentTime + 0.02;
      const dur = STEP * 16;
      chord.forEach(freq => {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'sine'; o.frequency.value = freq;
        f.type = 'lowpass'; f.frequency.value = 2000;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.06, t + 0.5);
        g.gain.setValueAtTime(0.05, t + dur - 0.3);
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(f); f.connect(g); g.connect(reverb); g.connect(master);
        o.start(t); o.stop(t + dur + 0.1);
      });
      chordBar++;
      addTimer(schedChord, STEP * 16 * 1000);
    };

    // Step sequencer
    let nextBeat = ctx.currentTime + 0.05;
    let step = 0;
    const seq = () => {
      if (!refs.current.playing) return;
      while (nextBeat < ctx.currentTime + 0.2) {
        const s = step % 16;
        const bar = Math.floor(step / 16);
        const chord = CHORDS[bar % 4];
        const t = nextBeat;
        if (KICK[s]) kick(t);
        else if (s === 4 || s === 12) snare(t);
        if (HAT[s]) hat(t);
        bass(t, BASS[s]);
        if (ARP[s] >= 0 && chord[ARP[s]]) arp(t, chord[ARP[s]]);
        nextBeat += STEP;
        step++;
      }
      addTimer(seq, 20);
    };

    schedChord();
    seq();
  }, []);

  const stop = useCallback(() => {
    refs.current.timers.forEach(clearTimeout);
    refs.current.playing = false;
    refs.current.ctx?.close();
    refs.current = { playing: false, timers: [], ctx: null };
    analyserRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);
  return { start, stop, analyserRef };
}
