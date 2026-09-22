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
    scene.fog = new THREE.FogExp2('#070e1a', 0.016);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 10, 18);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. LIGHTING SYSTEM
    const ambientLight = new THREE.AmbientLight('#1e293b', 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#38bdf8', '#0f172a', 0.8);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 3.5);
    sunLight.position.set(18, 22, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 70;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Sun Mesh with Atmospheric Corona
    const sunGroup = new THREE.Group();
    const sunGeom = new THREE.SphereGeometry(1.8, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#fde047' });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunGroup.add(sunMesh);

    const coronaGeom = new THREE.RingGeometry(1.9, 3.5, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: '#f59e0b',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
    coronaMesh.lookAt(camera.position);
    sunGroup.add(coronaMesh);
    sunGroup.position.copy(sunLight.position);
    scene.add(sunGroup);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      coronaMesh.lookAt(camera.position);
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