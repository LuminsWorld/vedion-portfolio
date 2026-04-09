import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 2000;
const GREEN = 0x39ff8b;
const PINK = 0xeb0071;

export default function HeroCanvas() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const particlesAltRef = useRef(null);
  const scrollAmplitudeRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04040a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x04040a, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create waveform particle system (green layer)
    const createWaveform = (color, phaseOffset = 0) => {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];

      const waveSpacing = 100 / PARTICLE_COUNT;
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = (i / PARTICLE_COUNT - 0.5) * 100;
        const y = Math.sin((i / PARTICLE_COUNT) * Math.PI * 2 + phaseOffset) * 15;
        const z = 0;
        
        positions.push(x, y, z);
        
        // Slight opacity variation per particle
        const colorObj = new THREE.Color(color);
        colors.push(colorObj.r, colorObj.g, colorObj.b);
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

      const material = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);
      
      return { geometry, material, points, originalPositions: new Float32Array(positions) };
    };

    const waveformGreen = createWaveform(GREEN, 0);
    const waveformPink = createWaveform(PINK, Math.PI);
    
    particlesRef.current = waveformGreen;
    particlesAltRef.current = waveformPink;

    // Scroll listener to increase amplitude
    let scrollProgress = 0;
    const handleScroll = () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = Math.min(window.scrollY / windowHeight, 1);
      scrollAmplitudeRef.current = scrollProgress * 0.8;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      timeRef.current += 0.01;

      // Update green waveform
      const greenPositions = waveformGreen.geometry.attributes.position.array;
      const greenOriginal = waveformGreen.originalPositions;
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = greenOriginal[i * 3];
        const baseY = greenOriginal[i * 3 + 1];
        const z = greenOriginal[i * 3 + 2];
        
        // Oscillating wave with scroll-based amplitude
        const amplitude = 15 + scrollAmplitudeRef.current * 30;
        const waveY = Math.sin((i / PARTICLE_COUNT) * Math.PI * 2 + timeRef.current) * amplitude;
        
        greenPositions[i * 3] = x;
        greenPositions[i * 3 + 1] = baseY + waveY;
        greenPositions[i * 3 + 2] = z;
      }
      waveformGreen.geometry.attributes.position.needsUpdate = true;

      // Update pink waveform (offset)
      const pinkPositions = waveformPink.geometry.attributes.position.array;
      const pinkOriginal = waveformPink.originalPositions;
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = pinkOriginal[i * 3];
        const baseY = pinkOriginal[i * 3 + 1];
        const z = pinkOriginal[i * 3 + 2];
        
        const amplitude = 15 + scrollAmplitudeRef.current * 30;
        const waveY = Math.sin((i / PARTICLE_COUNT) * Math.PI * 2 + Math.PI + timeRef.current * 0.8) * amplitude;
        
        pinkPositions[i * 3] = x;
        pinkPositions[i * 3 + 1] = baseY + waveY;
        pinkPositions[i * 3 + 2] = z - 5;
      }
      waveformPink.geometry.attributes.position.needsUpdate = true;

      // Subtle camera pull-back on scroll
      const cameraZ = 50 + scrollAmplitudeRef.current * 30;
      camera.position.z = cameraZ;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      renderer.dispose();
      waveformGreen.geometry.dispose();
      waveformGreen.material.dispose();
      waveformPink.geometry.dispose();
      waveformPink.material.dispose();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
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
