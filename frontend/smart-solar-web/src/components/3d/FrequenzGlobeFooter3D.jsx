// ============================================================================
// File: FrequenzGlobeFooter3D.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Three.js interactive 3D glowing wireframe globe for website footer CTA.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * FrequenzGlobeFooter3D
 * Centered 3D glowing wireframe globe with pulsing cyan nodes and interconnecting lines,
 * matching the exact visual style in the Frequenz footer call-to-action.
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
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);

    // Globe Group
    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, -0.2, 0);
    scene.add(globeGroup);

    // 1. Geodesic Sphere Geometry (Subdivided Icosahedron)
    const radius = 5.6;
    const baseGeometry = new THREE.IcosahedronGeometry(radius, 2);

    // 2. Wireframe Lines (Glowing Cyan)
    const wireframeGeometry = new THREE.WireframeGeometry(baseGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffce,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });
    const lineSegments = new THREE.LineSegments(wireframeGeometry, lineMaterial);
    globeGroup.add(lineSegments);

    // 3. Node Points (Procedural glow texture)
    const createGlowTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0, 255, 206, 1)');
      grad.addColorStop(0.3, 'rgba(0, 255, 206, 0.85)');
      grad.addColorStop(0.6, 'rgba(0, 255, 206, 0.25)');
      grad.addColorStop(1, 'rgba(0, 255, 206, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();
      return new THREE.CanvasTexture(canvas);
    };

    const dotTexture = createGlowTexture();

    // Standard Vertices
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x00ffce,
      size: 0.35,
      map: dotTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(baseGeometry, pointsMaterial);
    globeGroup.add(points);

    // 4. Accent Hub Nodes (Larger pulsing dots)
    const positions = baseGeometry.attributes.position.array;
    const hubPositions = [];
    for (let i = 0; i < positions.length; i += 12) {
      hubPositions.push(positions[i], positions[i + 1], positions[i + 2]);
    }
    const hubGeometry = new THREE.BufferGeometry();
    hubGeometry.setAttribute('position', new THREE.Float32BufferAttribute(hubPositions, 3));

    const hubMaterial = new THREE.PointsMaterial({
      color: 0x00ffce,
      size: 0.72,
      map: dotTexture,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hubPoints = new THREE.Points(hubGeometry, hubMaterial);
    globeGroup.add(hubPoints);

    // Initial Tilt
    globeGroup.rotation.x = 0.3;
    globeGroup.rotation.y = 0.2;

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous rotation
      globeGroup.rotation.y += 0.002;
      globeGroup.rotation.x += 0.0006;

      // Pulse hub nodes
      hubMaterial.size = 0.65 + Math.sin(elapsedTime * 2.5) * 0.18;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      baseGeometry.dispose();
      wireframeGeometry.dispose();
      lineMaterial.dispose();
      pointsMaterial.dispose();
      hubGeometry.dispose();
      hubMaterial.dispose();
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
