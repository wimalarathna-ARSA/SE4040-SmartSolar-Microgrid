import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SolarMicrogrid3D = () => {
  const mountRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);

  const autoRotateRef = useRef(autoRotate);
  const controlsRef = useRef({
    isDragging: false,
    prevMouseX: 0,
    prevMouseY: 0,
    rotX: 0.35,
    rotY: -0.45,
    distance: 22,
    targetRotX: 0.35,
    targetRotY: -0.45,
    targetDistance: 22,
  });

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070e1a');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const ctrl = controlsRef.current;

    const onMouseDown = (e) => {
      ctrl.isDragging = true;
      ctrl.prevMouseX = e.clientX;
      ctrl.prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (ctrl.isDragging) {
        const deltaX = e.clientX - ctrl.prevMouseX;
        const deltaY = e.clientY - ctrl.prevMouseY;

        ctrl.targetRotY += deltaX * 0.006;
        ctrl.targetRotX = Math.max(0.1, Math.min(Math.PI / 2.2, ctrl.targetRotX + deltaY * 0.005));

        ctrl.prevMouseX = e.clientX;
        ctrl.prevMouseY = e.clientY;
      }
    };

    const onMouseUp = () => {
      ctrl.isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      ctrl.targetDistance = Math.max(8, Math.min(32, ctrl.targetDistance + e.deltaY * 0.02));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotateRef.current && !ctrl.isDragging) {
        ctrl.targetRotY += 0.002;
      }
      ctrl.rotX += (ctrl.targetRotX - ctrl.rotX) * 0.08;
      ctrl.rotY += (ctrl.targetRotY - ctrl.rotY) * 0.08;
      ctrl.distance += (ctrl.targetDistance - ctrl.distance) * 0.08;

      camera.position.x = ctrl.distance * Math.sin(ctrl.rotY) * Math.cos(ctrl.rotX);
      camera.position.y = ctrl.distance * Math.sin(ctrl.rotX);
      camera.position.z = ctrl.distance * Math.cos(ctrl.rotY) * Math.cos(ctrl.rotX);
      camera.lookAt(0, 1.2, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
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