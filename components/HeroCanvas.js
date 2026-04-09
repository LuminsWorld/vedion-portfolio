import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    try {
      const W = window.innerWidth;
      const H = window.innerHeight;

      // Test WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return; // WebGL not available, fail silently

      // Initialize scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
      camera.position.z = 80;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x04040a, 1);
      el.appendChild(renderer.domElement);

      // Create waveform layers
      const LAYERS = [
        { color: 0x39ff8b, count: 2000, amp: 12, freq: 1.8, speed: 0.012, z: 0,   opacity: 0.9, size: 0.8 },
        { color: 0xeb0071, count: 1800, amp: 9,  freq: 2.2, speed: 0.009, z: -10, opacity: 0.6, size: 0.7 },
        { color: 0x39ff8b, count: 1500, amp: 6,  freq: 3.0, speed: 0.015, z: -20, opacity: 0.35, size: 0.5 },
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
        return { geo, mat, pts, count, amp, freq, speed, origPos: pos.slice() };
      });

      // Animation variables
      let scrollY = 0;
      let t = 0;
      let raf;

      const onScroll = () => { scrollY = window.scrollY; };
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      const animate = () => {
        raf = requestAnimationFrame(animate);
        t += 0.01;
        const scrollAmp = 1 + Math.min(scrollY / (window.innerHeight || 1), 2) * 1.5;

        waves.forEach(({ geo, count, amp, freq, speed, origPos }) => {
          const pos = geo.attributes.position.array;
          for (let i = 0; i < count; i++) {
            const x = origPos[i * 3];
            pos[i * 3]     = x;
            pos[i * 3 + 1] = Math.sin((i / count) * Math.PI * 2 * freq + t * speed) * amp * scrollAmp;
            pos[i * 3 + 2] = origPos[i * 3 + 2];
          }
          geo.attributes.position.needsUpdate = true;
        });

        camera.position.z = 80 + Math.min(scrollY / (window.innerHeight || 1), 1) * 30;
        renderer.render(scene, camera);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      animate();

      // Cleanup
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        waves.forEach(({ geo, mat }) => { geo.dispose(); mat.dispose(); });
        renderer.dispose();
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      };
    } catch (e) {
      // Fail silently — canvas just won't render, page still works
      console.debug('HeroCanvas:', e.message);
    }
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
