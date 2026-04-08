import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ShopCanvas — Three.js scene for the shop page.
 *
 * Renders:
 *  - A particle field of floating "encrypted frame" quads drifting in 3D space
 *  - A central wireframe shield/lock geometry (icosahedron)
 *  - Connecting beam lines from particles → center
 *  - Mouse parallax on the whole scene
 *  - `accentColor` prop drives the glow / particle color
 */
export default function ShopCanvas({ accentColor = "#00FF41" }) {
  const mountRef = useRef(null);
  const colorRef = useRef(accentColor);

  // Update color ref on prop change without recreating scene
  useEffect(() => { colorRef.current = accentColor; }, [accentColor]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 200);
    camera.position.set(0, 0, 18);

    // ── Central wireframe icosahedron (shield) ─────────────────────────────
    const shieldGeo = new THREE.IcosahedronGeometry(2.8, 1);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorRef.current),
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    scene.add(shield);

    // Inner solid icosahedron (very dim)
    const innerGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorRef.current),
      transparent: true,
      opacity: 0.04,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    scene.add(inner);

    // ── Floating frame quads ───────────────────────────────────────────────
    const FRAME_COUNT = 38;
    const frames = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const w = 0.6 + Math.random() * 1.2;
      const h = w * (0.55 + Math.random() * 0.3);
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorRef.current),
        transparent: true,
        opacity: 0.04 + Math.random() * 0.09,
        wireframe: Math.random() > 0.4,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Random position in a sphere shell
      const r = 5 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const speed = 0.003 + Math.random() * 0.008;
      const axis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      const drift = new THREE.Vector3(
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.002
      );
      const phaseOffset = Math.random() * Math.PI * 2;

      frames.push({ mesh, mat, speed, axis, drift, phaseOffset, baseOpacity: mat.opacity });
      scene.add(mesh);
    }

    // ── Particle dots ──────────────────────────────────────────────────────
    const PARTICLE_COUNT = 600;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 4 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: new THREE.Color(colorRef.current),
      size: 0.06,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Beam lines (frame → center) ────────────────────────────────────────
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);

    const beamFrameIndices = frames
      .map((_, i) => i)
      .filter(() => Math.random() > 0.6)
      .slice(0, 12);

    const beams = beamFrameIndices.map(idx => {
      const f = frames[idx];
      const points = [f.mesh.position.clone(), new THREE.Vector3(0, 0, 0)];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(colorRef.current),
        transparent: true,
        opacity: 0.05 + Math.random() * 0.08,
      });
      const line = new THREE.Line(geo, mat);
      beamGroup.add(line);
      return { line, geo, frameIdx: idx, mat };
    });

    // ── Mouse parallax ─────────────────────────────────────────────────────
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    const onMouseMove = (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Animation loop ─────────────────────────────────────────────────────
    let animId;
    let t = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.016;

      // Smooth mouse parallax
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      scene.rotation.y = currentX * 0.25;
      scene.rotation.x = currentY * 0.15;

      // Shield slow spin
      shield.rotation.y += 0.003;
      shield.rotation.x += 0.001;
      inner.rotation.y -= 0.002;

      // Sync colors from ref (if product changed)
      const col = new THREE.Color(colorRef.current);
      shieldMat.color.lerp(col, 0.05);
      innerMat.color.lerp(col, 0.05);
      pMat.color.lerp(col, 0.05);

      // Animate frames
      frames.forEach((f, i) => {
        f.mesh.rotateOnAxis(f.axis, f.speed);
        f.mesh.position.addScaledVector(f.drift, 1);

        // Pulse opacity
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.8 + f.phaseOffset);
        f.mat.opacity = f.baseOpacity * (0.6 + 0.4 * pulse);
        f.mat.color.lerp(col, 0.03);

        // Soft boundary — nudge back toward origin
        if (f.mesh.position.length() > 14) {
          f.mesh.position.multiplyScalar(0.995);
        }
      });

      // Animate particle points (slow spin)
      particles.rotation.y += 0.0005;

      // Update beam endpoints
      beams.forEach(b => {
        const pos = frames[b.frameIdx].mesh.position;
        const arr = b.geo.attributes.position.array;
        arr[0] = pos.x; arr[1] = pos.y; arr[2] = pos.z;
        b.geo.attributes.position.needsUpdate = true;
        b.mat.color.lerp(col, 0.05);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}
