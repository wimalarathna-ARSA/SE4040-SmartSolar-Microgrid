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

    // POWER TRANSMISSION PYLON
    const pylonGroup = new THREE.Group();
    pylonGroup.position.set(-12, 0, -10);

    const towerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 1.6, 12, 4),
      new THREE.MeshStandardMaterial({ color: '#64748b', wireframe: true })
    );
    towerMesh.position.y = 6;
    pylonGroup.add(towerMesh);

    const crossArm = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: '#94a3b8' })
    );
    crossArm.position.y = 10;
    pylonGroup.add(crossArm);
    scene.add(pylonGroup);

    // GLOWING ENERGY CONDUIT LINES ON GROUND
    const conduitMaterial = new THREE.MeshBasicMaterial({
      color: '#06b6d4',
      transparent: true,
      opacity: 0.7,
    });

    function createConduit(x1, z1, x2, z2) {
      const path = new THREE.LineCurve3(new THREE.Vector3(x1, 0.05, z1), new THREE.Vector3(x2, 0.05, z2));
      const tubeGeom = new THREE.TubeGeometry(path, 20, 0.06, 8, false);
      const tube = new THREE.Mesh(tubeGeom, conduitMaterial);
      scene.add(tube);
    }

    createConduit(-1.5, -2.5, 7.5, 4.0);
    createConduit(-1.5, 3.5, 7.5, 4.0);
    createConduit(7.5, 4.0, 7.5, -1.0);
    createConduit(7.5, 4.0, -12, -10);

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