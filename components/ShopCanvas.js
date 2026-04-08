import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ShopCanvas({ accentColor = "#00FF41" }) {
  const mountRef = useRef(null);
  const colorRef = useRef(accentColor);
  useEffect(() => { colorRef.current = accentColor; }, [accentColor]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 300);
    camera.position.set(0, 2, 26);

    // ── SHIELD — center of viewport, not bottom ────────────────────────────
    const shieldY = -2;
    const shieldPos = new THREE.Vector3(0, shieldY, 0);

    const shieldOuter = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4.2, 2),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colorRef.current), wireframe: true, transparent: true, opacity: 0.15 })
    );
    shieldOuter.position.y = shieldY;
    scene.add(shieldOuter);

    const shieldInner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.8, 1),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colorRef.current), wireframe: true, transparent: true, opacity: 0.25 })
    );
    shieldInner.position.y = shieldY;
    scene.add(shieldInner);

    const shieldCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.4, 0),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colorRef.current), transparent: true, opacity: 0.07 })
    );
    shieldCore.position.y = shieldY;
    scene.add(shieldCore);

    // Rings
    const rings = [5.5, 7.5, 10].map((r, i) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.025, 8, 120),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(colorRef.current), transparent: true, opacity: 0.08 - i * 0.02 })
      );
      m.position.y = shieldY;
      m.rotation.x = Math.PI / (2 + i * 0.4);
      m.rotation.z = i * 0.6;
      scene.add(m);
      return m;
    });

    // ── BACKGROUND PARTICLE FIELD — fills entire viewport ─────────────────
    // Layer 1: Dense scattered field (static, fills whole space)
    const BG_COUNT = 1800;
    const bgPos = new Float32Array(BG_COUNT * 3);
    for (let i = 0; i < BG_COUNT; i++) {
      // Distribute across whole viewport frustum
      bgPos[i * 3]     = (Math.random() - 0.5) * 70;
      bgPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      bgPos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({
      color: new THREE.Color(colorRef.current),
      size: 0.055,
      transparent: true,
      opacity: 0.35,
    });
    const bgPts = new THREE.Points(bgGeo, bgMat);
    scene.add(bgPts);

    // Layer 2: Flowing particles that stream toward the shield
    const FLOW_COUNT = 500;
    const flowPos = new Float32Array(FLOW_COUNT * 3);
    const flowVel = new Float32Array(FLOW_COUNT * 3);

    const resetFlowParticle = (i) => {
      // Spawn from random point across the canvas
      const x = (Math.random() - 0.5) * 60;
      const y = 10 + Math.random() * 22;
      const z = (Math.random() - 0.5) * 20;
      flowPos[i * 3]     = x;
      flowPos[i * 3 + 1] = y;
      flowPos[i * 3 + 2] = z;
      const to = new THREE.Vector3(0, shieldY, 0)
        .sub(new THREE.Vector3(x, y, z)).normalize();
      const spd = 0.04 + Math.random() * 0.06;
      flowVel[i * 3]     = to.x * spd;
      flowVel[i * 3 + 1] = to.y * spd;
      flowVel[i * 3 + 2] = to.z * spd;
    };
    for (let i = 0; i < FLOW_COUNT; i++) resetFlowParticle(i);

    const flowGeo = new THREE.BufferGeometry();
    flowGeo.setAttribute("position", new THREE.BufferAttribute(flowPos, 3));
    const flowMat = new THREE.PointsMaterial({
      color: new THREE.Color(colorRef.current),
      size: 0.09,
      transparent: true,
      opacity: 0.7,
    });
    const flowPts = new THREE.Points(flowGeo, flowMat);
    scene.add(flowPts);

    // ── FLOATING FRAME QUADS — scattered across whole canvas ─────────────
    const FRAME_COUNT = 45;
    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const w = 0.4 + Math.random() * 1.6;
      const h = w * (0.5 + Math.random() * 0.4);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorRef.current),
        transparent: true,
        opacity: 0.04 + Math.random() * 0.12,
        wireframe: Math.random() > 0.3,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      // Spread across entire viewport
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20 - 2
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      frames.push({ mesh, mat, axis, speed: 0.002 + Math.random() * 0.005, baseOp: mat.opacity, phase: Math.random() * Math.PI * 2 });
      scene.add(mesh);
    }

    // ── BEAM LINES from outer ring toward shield ───────────────────────────
    const BEAM_COUNT = 24;
    const beamLines = [];
    for (let i = 0; i < BEAM_COUNT; i++) {
      const angle = (i / BEAM_COUNT) * Math.PI * 2;
      const r = 18 + Math.random() * 10;
      const startX = r * Math.cos(angle);
      const startY = 8 + Math.random() * 18;
      const startZ = r * Math.sin(angle) * 0.4;
      const pts2 = [new THREE.Vector3(startX, startY, startZ), shieldPos.clone()];
      const geo = new THREE.BufferGeometry().setFromPoints(pts2);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(colorRef.current),
        transparent: true,
        opacity: 0.04 + Math.random() * 0.08,
      });
      beamLines.push({ line: new THREE.Line(geo, mat), mat, startX, startY, startZ });
      scene.add(beamLines[beamLines.length - 1].line);
    }

    // ── MOUSE PARALLAX ────────────────────────────────────────────────────
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMouse = (e) => {
      tx = (e.clientX / window.innerWidth  - 0.5) * 2;
      ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const onResize = () => {
      if (!el) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ── ANIMATE ───────────────────────────────────────────────────────────
    let rafId, t = 0;
    const fArr = flowGeo.attributes.position.array;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.016;

      // Parallax
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      scene.rotation.y = cx * 0.15;
      scene.rotation.x = cy * 0.08;

      // Color lerp
      const col = new THREE.Color(colorRef.current);
      [bgMat, flowMat].forEach(m => m.color.lerp(col, 0.04));
      [shieldOuter.material, shieldInner.material, shieldCore.material].forEach(m => m.color.lerp(col, 0.04));
      rings.forEach(r => r.material.color.lerp(col, 0.04));
      beamLines.forEach(b => b.mat.color.lerp(col, 0.04));

      // Shield spin
      shieldOuter.rotation.y += 0.003;
      shieldOuter.rotation.x += 0.001;
      shieldInner.rotation.y -= 0.004;
      shieldInner.rotation.z += 0.001;
      shieldCore.rotation.y  += 0.006;
      rings.forEach((r, i) => { r.rotation.z += 0.002 * (i % 2 === 0 ? 1 : -1); r.rotation.y += 0.001; });

      // Background particles — very slow drift
      bgPts.rotation.y += 0.00015;

      // Flow particles toward shield
      for (let i = 0; i < FLOW_COUNT; i++) {
        fArr[i * 3]     += flowVel[i * 3];
        fArr[i * 3 + 1] += flowVel[i * 3 + 1];
        fArr[i * 3 + 2] += flowVel[i * 3 + 2];
        const dx = fArr[i * 3]     - 0;
        const dy = fArr[i * 3 + 1] - shieldY;
        const dz = fArr[i * 3 + 2] - 0;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 4.5) resetFlowParticle(i);
      }
      flowGeo.attributes.position.needsUpdate = true;

      // Frames — gentle rotate
      frames.forEach((f, i) => {
        f.mesh.rotateOnAxis(f.axis, f.speed);
        f.mat.opacity = f.baseOp * (0.6 + 0.4 * Math.sin(t * 0.6 + f.phase));
        f.mat.color.lerp(col, 0.03);
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

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}
