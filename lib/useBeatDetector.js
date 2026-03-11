import { useEffect, useRef, useCallback } from 'react';

export function useBeatDetector(audioRef) {
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const frameRef = useRef(null);
  const callbacksRef = useRef([]);

  const onBeat = useCallback((cb) => {
    callbacksRef.current.push(cb);
    return () => {
      callbacksRef.current = callbacksRef.current.filter(f => f !== cb);
    };
  }, []);

  useEffect(() => {
    if (!audioRef?.current) return;
    const audio = audioRef.current;

    const setup = () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastBeat = 0;
      let beatThreshold = 150;

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        // bass: bins 0-10 (~20-300hz)
        const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
        const now = Date.now();
        
        // Dynamic threshold
        beatThreshold = beatThreshold * 0.97 + bass * 0.03 + 80;
        
        if (bass > beatThreshold && now - lastBeat > 200) {
          lastBeat = now;
          callbacksRef.current.forEach(cb => cb({ bass, dataArray: [...dataArray] }));
        }

        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    };

    audio.addEventListener('play', setup, { once: true });
    return () => {
      cancelAnimationFrame(frameRef.current);
      analyserRef.current?.disconnect();
    };
  }, []);

  return { onBeat, analyserRef };
}
