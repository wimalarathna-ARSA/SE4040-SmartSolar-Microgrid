import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SolarMicrogrid3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070e1a');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 10, 18);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight('#1e293b', 1.2);
    scene.add(ambientLight);

    // LIVE 3D ENERGY FLOW PARTICLES
    const particleCount = 180;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 1] = Math.random() * 4 + 0.1;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      particleSpeeds[i] = 0.03 + Math.random() * 0.06;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#38bdf8',
      size: 0.25,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = (performance.now() - startTime) * 0.001;

      const positions = particleGeom.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 0] += (7.5 - positions[i * 3 + 0]) * particleSpeeds[i] * 0.4;
        positions[i * 3 + 2] += (0.0 - positions[i * 3 + 2]) * particleSpeeds[i] * 0.4;
        positions[i * 3 + 1] = Math.sin(time * 2 + i) * 0.5 + 1.2;

        if (Math.abs(positions[i * 3 + 0] - 7.5) < 0.8) {
          positions[i * 3 + 0] = (Math.random() - 0.5) * 14 - 2;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
          positions[i * 3 + 1] = Math.random() * 2 + 1;
        }
      }
      particleGeom.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="position-relative w-100 rounded-4 overflow-hidden shadow-2xl border border-secondary border-opacity-25" style={{ height: '560px' }}>
      <div ref={mountRef} className="w-100 h-100" style={{ cursor: 'grab' }} />
    </div>
  );
};

export default SolarMicrogrid3D;