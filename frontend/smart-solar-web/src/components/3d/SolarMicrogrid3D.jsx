import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SolarMicrogrid3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // 1. SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070e1a');
    scene.fog = new THREE.FogExp2('#070e1a', 0.016);

    // 2. CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 10, 18);
    camera.lookAt(0, 1, 0);

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Main render loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
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