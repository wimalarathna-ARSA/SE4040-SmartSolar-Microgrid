import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function createBatteryContainerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 256);

  for (let x = 0; x < 512; x += 16) {
    ctx.fillStyle = x % 32 === 0 ? '#172033' : '#283548';
    ctx.fillRect(x, 0, 8, 256);
  }

  ctx.fillStyle = '#0f172a';
  for (let y = 40; y < 140; y += 10) {
    ctx.fillRect(40, y, 120, 5);
    ctx.fillRect(200, y, 120, 5);
  }

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(360, 40, 110, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('BESS-480V', 370, 66);

  ctx.fillStyle = '#22c55e';
  ctx.font = '12px monospace';
  ctx.fillText('ACTIVE GRID NODE', 360, 110);

  return new THREE.CanvasTexture(canvas);
}

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
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight('#1e293b', 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 3.5);
    sunLight.position.set(18, 22, 14);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const batteryTex = createBatteryContainerTexture();
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.25 });

    // BESS BATTERY STORAGE CONTAINER UNIT
    const bessGroup = new THREE.Group();
    bessGroup.position.set(7.5, 0, -1.0);

    const bessGeom = new THREE.BoxGeometry(3.5, 2.6, 5.5);
    const bessMats = [
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: batteryTex, roughness: 0.3, metalness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.3 }),
    ];
    const bessMesh = new THREE.Mesh(bessGeom, bessMats);
    bessMesh.position.y = 1.3;
    bessMesh.castShadow = true;
    bessGroup.add(bessMesh);

    const hvacMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.2), frameMaterial);
    hvacMesh.position.set(0, 2.85, 0);
    bessGroup.add(hvacMesh);

    scene.add(bessGroup);

    // CENTRAL SMART INVERTER & TRANSFORMER KIOSK
    const inverterGroup = new THREE.Group();
    inverterGroup.position.set(7.5, 0, 4.0);

    const inverterMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.0, 1.8),
      new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.5, roughness: 0.3 })
    );
    inverterMesh.position.y = 1.0;
    inverterMesh.castShadow = true;
    inverterGroup.add(inverterMesh);

    for (let f = -0.7; f <= 0.7; f += 0.25) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.6, 2.1), frameMaterial);
      fin.position.set(1.05, 1.0, f);
      inverterGroup.add(fin);
    }

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ color: '#38bdf8' }));
    screen.rotation.y = -Math.PI / 2;
    screen.position.set(-1.01, 1.2, 0);
    inverterGroup.add(screen);

    scene.add(inverterGroup);

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
      batteryTex.dispose();
    };
  }, []);

  return (
    <div className="position-relative w-100 rounded-4 overflow-hidden shadow-2xl border border-secondary border-opacity-25" style={{ height: '560px' }}>
      <div ref={mountRef} className="w-100 h-100" style={{ cursor: 'grab' }} />
    </div>
  );
};

export default SolarMicrogrid3D;