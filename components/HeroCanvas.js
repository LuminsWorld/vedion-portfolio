import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const COLORS = [0x00FF41, 0x7B2FFF, 0x00D4FF, 0xFFB800, 0xFF2D55];

export default function HeroCanvas({ analyserRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || window.innerWidth;
    const H = mount.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 1000);
    camera.position.z = 30;

    const COUNT = 2000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const orig = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * 80;
      const y = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 40;
      pos[i*3] = orig[i*3] = x;
      pos[i*3+1] = orig[i*3+1] = y;
      pos[i*3+2] = orig[i*3+2] = z;
      const c = new THREE.Color(COLORS[i % COLORS.length]);
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // Mouse NDC — smooth target for parallax tilt
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    let time = 0;
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.005;

      let beat = (Math.sin(time * 1.5) * 0.5 + 0.5) * 0.15;
      if (analyserRef?.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bass = data.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
        beat = Math.min(bass / 120, 1);
      }

      const pa = particles.geometry.attributes.position;
      for (let i = 0; i < COUNT; i++) {
        pa.array[i*3]   = orig[i*3]   + Math.sin(time + i * 0.01) * (0.5 + beat * 2);
        pa.array[i*3+1] = orig[i*3+1] + Math.cos(time + i * 0.013) * (0.5 + beat * 2);
        pa.array[i*3+2] = orig[i*3+2] + Math.sin(time * 0.7 + i * 0.007) * 0.3;
      }
      pa.needsUpdate = true;

      // Smooth lerp toward mouse — very gentle parallax tilt
      currentTiltX += (targetMouseY * 0.15 - currentTiltX) * 0.04;
      currentTiltY += (targetMouseX * 0.2  - currentTiltY) * 0.04;

      particles.rotation.x = currentTiltX;
      particles.rotation.y = time * 0.04 + currentTiltY;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W = mount.clientWidth || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
