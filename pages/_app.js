import '../styles/globals.css';
import { useEffect, useRef } from 'react';
import { ToastContainer } from '../components/Toast';

function CustomCursor() {
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  const posRef = useRef({ mx: -200, my: -200, rx: -200, ry: -200 });
  const rafRef = useRef(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    // Desktop / pointer devices only
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(hover: none)').matches) return;

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    const onMove = (e) => {
      posRef.current.mx = e.clientX;
      posRef.current.my = e.clientY;
      if (!visibleRef.current) {
        visibleRef.current = true;
        cursor.style.opacity = '1';
        ring.style.opacity = '1';
      }
    };

    const animate = () => {
      const { mx, my } = posRef.current;
      let { rx, ry } = posRef.current;
      cursor.style.transform = `translate(${mx - 6}px, ${my - 6}px)`;
      rx += (mx - rx - 16) * 0.12;
      ry += (my - ry - 16) * 0.12;
      posRef.current.rx = rx;
      posRef.current.ry = ry;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    // Pointer effects on interactive elements
    const onEnter = () => { cursor.style.transform += ' scale(1.8)'; ring.style.width = '48px'; ring.style.height = '48px'; ring.style.marginLeft = '-8px'; ring.style.marginTop = '-8px'; };
    const onLeave = () => { ring.style.width = '32px'; ring.style.height = '32px'; ring.style.marginLeft = '0'; ring.style.marginTop = '0'; };
    document.querySelectorAll('a, button, [role=button], [style*="cursor: pointer"]').forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        style={{
          width: 12, height: 12,
          background: 'var(--green)',
          borderRadius: '50%',
          position: 'fixed',
          top: 0, left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0,
          transition: 'opacity 0.3s ease, width 0.2s, height 0.2s',
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        style={{
          width: 32, height: 32,
          border: '1.5px solid rgba(0,255,65,0.6)',
          borderRadius: '50%',
          position: 'fixed',
          top: 0, left: 0,
          pointerEvents: 'none',
          zIndex: 9998,
          opacity: 0,
          transition: 'opacity 0.3s ease, width 0.2s, height 0.2s',
          willChange: 'transform',
        }}
      />
    </>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <CustomCursor />
      <Component {...pageProps} />
      <ToastContainer />
    </>
  );
}
