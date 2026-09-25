// ============================================================================
// File: FrequenzGlobeFooter3D.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Three.js foundation for the SmartSolar footer globe visualization.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * FrequenzGlobeFooter3D
 * Creates the Three.js scene, camera, and transparent WebGL renderer
 * used by the footer globe visualization.
 */
const FrequenzGlobeFooter3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      1000
    );

    camera.position.set(0, 0, 14);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    // Basic animation loop
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);

      if (
        container &&
        renderer.domElement &&
        container.contains(renderer.domElement)
      ) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        minHeight: '520px',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default FrequenzGlobeFooter3D;