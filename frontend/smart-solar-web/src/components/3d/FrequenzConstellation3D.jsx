// ============================================================================
// File: FrequenzConstellation3D.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Three.js interactive 3D particle constellation and energy network grid visualization.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * FrequenzConstellation3D
 * Generates an interactive 3D geodesic wireframe sphere network with glowing cyan nodes
 * and interconnecting energy lines, matching the exact visual style of Frequenz.com.
 */
const FrequenzConstellation3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);

    // Create Geodesic Sphere Network Group
    const constellationGroup = new THREE.Group();
    // Position slightly towards right edge as in the screenshot
    constellationGroup.position.set(1.5, -0.2, 0);
    scene.add(constellationGroup);

    // 1. Core Sphere Geometry (Subdivided Icosahedron for geodesic triangles)
    const radius = 5.8;
    const detail = 2; // Geodesic subdivision level
    const baseGeometry = new THREE.IcosahedronGeometry(radius, detail);

    // 2. Wireframe Lines (Glowing Cyan lines)
    const wireframeGeometry = new THREE.WireframeGeometry(baseGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffce,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });
    const lineSegments = new THREE.LineSegments(wireframeGeometry, lineMaterial);
    constellationGroup.add(lineSegments);

    // 3. Node Points (Vertices as glowing dots)
    // Procedural glowing circle sprite texture for points
    const createGlowDotTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0, 255, 206, 1)');
      grad.addColorStop(0.25, 'rgba(0, 255, 206, 0.9)');
      grad.addColorStop(0.5, 'rgba(0, 255, 206, 0.35)');
      grad.addColorStop(1, 'rgba(0, 255, 206, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(canvas);
    };

    const dotTexture = createGlowDotTexture();

    // Standard Nodes Material
    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x00ffce,
      size: 0.36,
      map: dotTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(baseGeometry, pointsMaterial);
    constellationGroup.add(points);

    // 4. Hero Accent Hub Nodes (Fewer, larger pulsing nodes like in Frequenz)
    const positions = baseGeometry.attributes.position.array;
    const hubPositions = [];
    // Select every 4th vertex for major grid hubs
    for (let i = 0; i < positions.length; i += 12) {
      hubPositions.push(positions[i], positions[i + 1], positions[i + 2]);
    }
    const hubGeometry = new THREE.BufferGeometry();
    hubGeometry.setAttribute('position', new THREE.Float32BufferAttribute(hubPositions, 3));

    const hubMaterial = new THREE.PointsMaterial({
      color: 0x00ffce,
      size: 0.75,
      map: dotTexture,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hubPoints = new THREE.Points(hubGeometry, hubMaterial);
    constellationGroup.add(hubPoints);

    // 5. Subtle ambient inner energy glow
    const innerGlowGeometry = new THREE.SphereGeometry(radius * 0.94, 32, 32);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x003d36,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    constellationGroup.add(innerGlowMesh);

    // Initial tilt to match screenshot orientation
    constellationGroup.rotation.x = 0.25;
    constellationGroup.rotation.y = -0.4;
    constellationGroup.rotation.z = -0.15;

    // Mouse Interaction for interactive parallax & rotation
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 0.5;
      targetY = (y / rect.height) * 0.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);

      // Adjust group position depending on screen width
      if (newWidth < 768) {
        constellationGroup.position.set(0, 0, 0);
        camera.position.z = 18;
      } else {
        constellationGroup.position.set(1.5, -0.2, 0);
        camera.position.z = 15;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Continuous gentle planetary rotation
      constellationGroup.rotation.y += 0.0022;
      constellationGroup.rotation.x += 0.0008;

      // Smooth mouse parallax interpolation
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      constellationGroup.position.x = (window.innerWidth < 768 ? 0 : 1.5) + mouseX * 0.6;
      constellationGroup.position.y = -0.2 - mouseY * 0.6;

      // Pulse larger hub nodes
      const pulse = 0.65 + Math.sin(elapsedTime * 2.5) * 0.2;
      hubMaterial.size = pulse;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
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
      innerGlowGeometry.dispose();
      innerGlowMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="frequenz-constellation-container"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '480px',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    />
  );
};

export default FrequenzConstellation3D;
