import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

function createSolarCellTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0c2240');
  grad.addColorStop(0.5, '#0a192f');
  grad.addColorStop(1, '#0e2b52');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const cols = 6;
  const rows = 10;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;

      ctx.strokeStyle = '#040d1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.6;
      for (let f = 3; f < cellH - 2; f += 4) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + f);
        ctx.lineTo(x + cellW - 2, y + f);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(220, 235, 255, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x + cellW * 0.33, y + 1);
      ctx.lineTo(x + cellW * 0.33, y + cellH - 1);
      ctx.moveTo(x + cellW * 0.66, y + 1);
      ctx.lineTo(x + cellW * 0.66, y + cellH - 1);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
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

    const ambientLight = new THREE.AmbientLight('#1e293b', 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 3.5);
    sunLight.position.set(18, 22, 14);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Ground Platform
    const groundGroup = new THREE.Group();
    const groundGeom = new THREE.CylinderGeometry(18, 19, 0.6, 64);
    const groundMat = new THREE.MeshStandardMaterial({ color: '#0b1320', roughness: 0.85, metalness: 0.15 });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.position.y = -0.3;
    groundMesh.receiveShadow = true;
    groundGroup.add(groundMesh);

    const gridHelper = new THREE.PolarGridHelper(17.5, 16, 8, 64, '#0284c7', '#0e3a5a');
    gridHelper.position.y = 0.02;
    groundGroup.add(gridHelper);
    scene.add(groundGroup);

    // Solar Arrays
    const solarCellTex = createSolarCellTexture();
    const solarFarmGroup = new THREE.Group();
    const solarMaterial = new THREE.MeshStandardMaterial({ map: solarCellTex, roughness: 0.15, metalness: 0.65 });
    const frameMaterial = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.25 });
    const pylonMaterial = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.4 });

    function createSolarTracker(offsetX, offsetZ) {
      const trackerUnit = new THREE.Group();
      trackerUnit.position.set(offsetX, 0, offsetZ);

      const footing = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 16), new THREE.MeshStandardMaterial({ color: '#334155' }));
      footing.position.y = 0.2;
      trackerUnit.add(footing);

      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 2.2, 16), pylonMaterial);
      column.position.y = 1.3;
      trackerUnit.add(column);

      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.0, 16), frameMaterial);
      axle.rotation.z = Math.PI / 2;
      axle.position.y = 2.4;
      trackerUnit.add(axle);

      const tiltingGroup = new THREE.Group();
      tiltingGroup.position.set(0, 2.4, 0);

      for (let px = -1.05; px <= 1.05; px += 2.1) {
        for (let pz = -0.75; pz <= 0.75; pz += 1.5) {
          const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 1.4), frameMaterial);
          panelFrame.position.set(px, 0.04, pz);
          tiltingGroup.add(panelFrame);

          const pvMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 1.34), solarMaterial);
          pvMesh.rotation.x = -Math.PI / 2;
          pvMesh.position.set(px, 0.075, pz);
          tiltingGroup.add(pvMesh);
        }
      }

      tiltingGroup.rotation.x = -0.45;
      trackerUnit.add(tiltingGroup);
      return trackerUnit;
    }

    solarFarmGroup.add(createSolarTracker(-4.5, -2.5));
    solarFarmGroup.add(createSolarTracker(1.5, -2.5));
    solarFarmGroup.add(createSolarTracker(-4.5, 3.5));
    solarFarmGroup.add(createSolarTracker(1.5, 3.5));
    scene.add(solarFarmGroup);

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
      solarCellTex.dispose();
    };
  }, []);

  return (
    <div className="position-relative w-100 rounded-4 overflow-hidden shadow-2xl border border-secondary border-opacity-25" style={{ height: '560px' }}>
      <div ref={mountRef} className="w-100 h-100" style={{ cursor: 'grab' }} />
    </div>
  );
};

export default SolarMicrogrid3D;