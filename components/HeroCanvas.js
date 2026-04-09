import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // WebGL availability check — fail gracefully on headless/unsupported
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) return;

    let scene, camera, renderer;
    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
      camera.position.set(0, 0, 80);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x04040a, 1);
      el.appendChild(renderer.domElement);
    } catch(e) {
      return; // No WebGL — canvas just won't render, page still works
    }

    // ── Wave layers ──────────────────────────────────────────────────
    const LAYERS = [
      { color: 0x39ff8b, count: 3000, amp: 12, freq: 1.8, speed: 0.012, z: 0,   opacity: 0.9, size: 0.8 },
      { color: 0xeb0071, count: 2500, amp: 9,  freq: 2.2, speed: 0.009, z: -8,  opacity: 0.6, size: 0.7 },
      { color: 0x39ff8b, count: 2000, amp: 6,  freq: 3.0, speed: 0.015, z: -16, opacity: 0.35, size: 0.5 },
      { color: 0x7B2FFF, count: 1800, amp: 14, freq: 1.2, speed: 0.007, z: -24, opacity: 0.25, size: 0.6 },
      { color: 0xeb0071, count: 1500, amp: 5,  freq: 4.0, speed: 0.018, z: -32, opacity: 0.15, size: 0.4 },
    ];

    const waves = LAYERS.map(({ color, count, amp, freq, speed, z, opacity, size }) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const x = ((i / count) - 0.5) * 160;
        pos[i * 3]     = x;
        pos[i * 3 + 1] = Math.sin((i / count) * Math.PI * 2 * freq) * amp;
        pos[i * 3 + 2] = z + (Math.random() - 0.5) * 4;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true });
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      return { geo, mat, pts, count, amp, freq, speed, z, origPos: pos.slice() };
    });

    // ── Vertical EQ bars (left side) ─────────────────────────────────
    const BAR_COUNT = 32;
    const barGeo = new THREE.BufferGeometry();
    const barPos = new Float32Array(BAR_COUNT * 2 * 3);
    const barGeoAttr = () => {
      for (let i = 0; i < BAR_COUNT; i++) {
        const x = -75 + (i / BAR_COUNT) * 30;
        const h = 4 + Math.random() * 14;
        barPos[i * 6]     = x; barPos[i * 6 + 1] = -h; barPos[i * 6 + 2] = 5;
        barPos[i * 6 + 3] = x; barPos[i * 6 + 4] =  h; barPos[i * 6 + 5] = 5;
      }
      barGeo.setAttribute('position', new THREE.BufferAttribute(barPos, 3));
    };
    barGeoAttr();
    const barMat = new THREE.LineBasicMaterial({ color: 0x39ff8b, transparent: true, opacity: 0.3 });
    const barLines = new THREE.LineSegments(barGeo, barMat);
    scene.add(barLines);

    // ── Scroll ───────────────────────────────────────────────────────
    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    // ── Resize ───────────────────────────────────────────────────────
    const onResize = () => {
      const nW = window.innerWidth, nH = window.innerHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener('resize', onResize);

    // ── Animate ──────────────────────────────────────────────────────
    let t = 0, raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.01;
      const scrollAmp = 1 + (scrollY / (window.innerHeight || 1)) * 1.5;

      waves.forEach(({ geo, count, amp, freq, speed, z, origPos }, li) => {
        const pos = geo.attributes.position.array;
        for (let i = 0; i < count; i++) {
          const x = origPos[i * 3];
          pos[i * 3]     = x;
          pos[i * 3 + 1] = Math.sin((i / count) * Math.PI * 2 * freq + t * (speed / 0.01)) * amp * scrollAmp
                         + Math.sin((i / count) * Math.PI * 4 + t * 0.7) * amp * 0.2;
          pos[i * 3 + 2] = origPos[i * 3 + 2];
        }
        geo.attributes.position.needsUpdate = true;
      });

      // Animate EQ bars
      for (let i = 0; i < BAR_COUNT; i++) {
        const h = (4 + Math.abs(Math.sin(t * 2 + i * 0.4)) * 16) * (0.7 + Math.random() * 0.3);
        barPos[i * 6 + 1] = -h;
        barPos[i * 6 + 4] =  h;
      }
      barGeo.attributes.position.needsUpdate = true;

      camera.position.z = 80 + (scrollY / (window.innerHeight || 1)) * 20;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      waves.forEach(({ geo, mat }) => { geo.dispose(); mat.dispose(); });
      barGeo.dispose(); barMat.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} style={{
      position: 'absolute', top: 0, left: 0,
      width: '100vw', height: '100vh',
      zIndex: 0, pointerEvents: 'none',
    }} />
  );
}
