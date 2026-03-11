import { useEffect, useRef } from 'react';

const BAR_COLORS = ['#00FF41','#00FF41','#00D4FF','#00D4FF','#7B2FFF','#00D4FF','#00D4FF','#00FF41'];

export default function EQVisualizer({ analyserRef }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let time = 0;

    const draw = () => {
      frameRef.current = requestAnimationFrame(draw);
      time += 0.02;

      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const bars = 48;
      const gap = 5;
      const barW = (W / bars) - gap;
      const centerY = H / 2;
      const maxH = centerY - 1;

      let data;
      if (analyserRef?.current) {
        const arr = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(arr);
        data = arr;
      }

      for (let i = 0; i < bars; i++) {
        // Mirror data: low freq (big spike) in center, highs on both edges
        const half = bars / 2;
        const dist = Math.abs(i - half) / half; // 0=center, 1=edge
        const freqPos = dist; // center=bass(0), edge=highs(1)
        const dataIndex = Math.floor(freqPos * (data ? data.length / 2 : bars));
        const rawAmp = data
          ? data[dataIndex] / 255
          : (Math.sin(time * 1.2 + i * 0.25) * 0.5 + 0.5) * (1 - dist * 0.5);

        // Solid base at 55%, sound drives up to 100%
        const amp = 0.15 + rawAmp * 0.85;
        const barH = amp * maxH;

        const colorIndex = Math.floor((i / bars) * BAR_COLORS.length);
        const color = BAR_COLORS[colorIndex];
        const x = i * (barW + gap);

        ctx.globalAlpha = 0.8 + rawAmp * 0.2;
        ctx.fillStyle = color;

        // Solid bars, top and bottom mirrored
        ctx.fillRect(x, centerY - barH, barW, barH);
        ctx.fillRect(x, centerY, barW, barH);
      }

      ctx.globalAlpha = 1;
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="eq-canvas"
      style={{ width: '100%', height: '200px', display: 'block' }}
    />
  );
}
