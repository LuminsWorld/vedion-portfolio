import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ShopCanvas — unified full-hero Three.js scene.
 *
 * Particles fill the whole canvas from top → they drift/stream downward
 * toward the icosahedron anchored at the bottom-center.
 * Beam lines connect floating frames to the shield.
 * Everything is one continuous scene — no visual cut.
 */
export default function ShopCanvas({ accentColor = "#00FF41" }) {
  const mountRef  = useRef(null);
  const colorRef  = useRef(accentColor);

  useEffect(() => { colorRef.current = accentColor; }, [accentColor]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 300);
    camera.position.set(0, 0, 28);

    // ── Shield — positioned low in the scene ──────────────────────────────
    const shieldY = -7;   // pushed down so it sits near bottom of viewport

    const shieldGeo = new THREE.IcosahedronGeometry(3.2, 1);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorRef.current),
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.y = shieldY;
    scene.add(shield);

    const innerGeo = new THREE.IcosahedronGeometry(2.4, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorRef.current),
      transparent: true,
      opacity: 0.05,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.y = shieldY;
    scene.add(inner);

    // Outer halo ring
    const ringGeo = new THREE.TorusGeometry(4.5, 0.04, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorRef.current),
      transparent: true,
      opacity: 0.1,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = shieldY;
    ring.rotation.x = Math.PI / 2.2;
    scene.add(ring);

    // ── Floating frame quads spread across entire height ───────────────────
    const FRAME_COUNT = 50;
    const frames = [];
    const origin  = new THREE.Vector3(0, shieldY, 0);

    for (let i = 0; i < FRAME_COUNT; i++) {
      const w = 0.5 + Math.random() * 1.4;
      const h = w * (0.5 + Math.random() * 0.35);
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorRef.current),
        transparent: true,
        opacity: 0.05 + Math.random() * 0.1,
        wireframe: Math.random() > 0.35,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Spread across full height — y from +16 (top) to -12 (just above shield)
      const yPos = -12 + Math.random() * 28;
      const radius = 4 + Math.random() * 10;
      const angle  = Math.random() * Math.PI * 2;
      mesh.position.set(
        radius * Math.cos(angle),
        yPos,
        radius * Math.sin(angle) - 2
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const speed    = 0.002 + Math.random() * 0.006;
      const axis     = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const fallSpeed = 0.003 + Math.random() * 0.006; // drift downward toward shield
      const phase    = Math.random() * Math.PI * 2;
      const baseY    = mesh.position.y;

      frames.push({ mesh, mat, speed, axis, fallSpeed, phase, baseY, baseOpacity: mat.opacity });
      scene.add(mesh);
    }

    // ── Particles — spread vertically across the full hero ─────────────────
    const PART = 900;
    const positions = new Float32Array(PART * 3);
    const velocities = new Float32Array(PART * 3); // drift toward shield

    for (let i = 0; i < PART; i++) {
      const y = -14 + Math.random() * 36;        // full vertical spread
      const r = 2 + Math.random() * 14;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3]     = r * Math.cos(a);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(a) - 1;

      // Slow drift toward center-bottom
      const toShield = new THREE.Vector3(0, shieldY, 0)
        .sub(new THREE.Vector3(positions[i*3], positions[i*3+1], positions[i*3+2]))
        .normalize();
      velocities[i * 3]     = toShield.x * 0.004;
      velocities[i * 3 + 1] = toShield.y * 0.003;
      velocities[i * 3 + 2] = toShield.z * 0.003;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: new THREE.Color(colorRef.current),
      size: 0.07,
      transparent: true,
      opacity: 0.55,
    });
    const pts = new THREE.Points(pGeo, pMat);
    scene.add(pts);

    // ── Beam lines — frames → shield ───────────────────────────────────────
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);

    const beamed = frames.filter(() => Math.random() > 0.55).slice(0, 16);
    const beams  = beamed.map(f => {
      const pts2 = [f.mesh.position.clone(), origin.clone()];
      const geo  = new THREE.BufferGeometry().setFromPoints(pts2);
      const mat  = new THREE.LineBasicMaterial({
        color: new THREE.Color(colorRef.current),
        transparent: true,
        opacity: 0.06 + Math.random() * 0.09,
      });
      const line = new THREE.Line(geo, mat);
      beamGroup.add(line);
      return { line, geo, frame: f, mat };
    });

    // ── Mouse parallax ─────────────────────────────────────────────────────
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMouse = (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    // ── Resize ─────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Animate ────────────────────────────────────────────────────────────
    let rafId, t = 0;
    const posArr = pGeo.attributes.position.array;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;

      // Parallax
      cx += (tx - cx) * 0.035;
      cy += (ty - cy) * 0.035;
      scene.rotation.y = cx * 0.18;
      scene.rotation.x = cy * 0.1;

      // Color lerp
      const col = new THREE.Color(colorRef.current);
      [shieldMat, innerMat, ringMat, pMat].forEach(m => m.color.lerp(col, 0.04));

      // Shield spin
      shield.rotation.y += 0.004;
      shield.rotation.x += 0.0015;
      inner.rotation.y  -= 0.003;
      ring.rotation.z   += 0.002;

      // Frames — rotate + gentle drift down
      frames.forEach(f => {
        f.mesh.rotateOnAxis(f.axis, f.speed);
        f.mesh.position.y -= f.fallSpeed;
        f.mat.color.lerp(col, 0.03);
        // Pulse
        f.mat.opacity = f.baseOpacity * (0.6 + 0.4 * Math.sin(t * 0.7 + f.phase));
        // Reset when they reach the shield
        if (f.mesh.position.y < shieldY - 1) {
          f.mesh.position.y = 16 + Math.random() * 4;
        }
      });

      // Particles drift toward shield
      for (let i = 0; i < PART; i++) {
        posArr[i * 3]     += velocities[i * 3]     + Math.sin(t * 0.3 + i) * 0.002;
        posArr[i * 3 + 1] += velocities[i * 3 + 1];
        posArr[i * 3 + 2] += velocities[i * 3 + 2];

        // Reset particle when it reaches the shield
        const dy = posArr[i * 3 + 1] - shieldY;
        const dx = posArr[i * 3];
        const dz = posArr[i * 3 + 2];
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 3.5) {
          const y2 = 10 + Math.random() * 10;
          const r2 = 4 + Math.random() * 12;
          const a2 = Math.random() * Math.PI * 2;
          posArr[i * 3]     = r2 * Math.cos(a2);
          posArr[i * 3 + 1] = y2;
          posArr[i * 3 + 2] = r2 * Math.sin(a2);
          // Recalc velocity
          const to = new THREE.Vector3(0, shieldY, 0)
            .sub(new THREE.Vector3(posArr[i*3], posArr[i*3+1], posArr[i*3+2]))
            .normalize();
          velocities[i * 3]     = to.x * 0.004;
          velocities[i * 3 + 1] = to.y * 0.003;
          velocities[i * 3 + 2] = to.z * 0.003;
        }
      }
      pGeo.attributes.position.needsUpdate = true;

      // Beam endpoints follow frames
      beams.forEach(b => {
        const p = b.frame.mesh.position;
        const arr = b.geo.attributes.position.array;
        arr[0] = p.x; arr[1] = p.y; arr[2] = p.z;
        b.geo.attributes.position.needsUpdate = true;
        b.mat.color.lerp(col, 0.04);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouse);
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
