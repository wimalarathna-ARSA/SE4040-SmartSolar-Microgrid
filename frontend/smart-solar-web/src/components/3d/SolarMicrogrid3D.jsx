import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SolarMicrogrid3D = () => {
  const mountRef = useRef(null);
  const [timeOfDay, setTimeOfDay] = useState('noon'); // 'dawn', 'noon', 'dusk', 'night'
  const timeOfDayRef = useRef(timeOfDay);

  useEffect(() => {
    timeOfDayRef.current = timeOfDay;
  }, [timeOfDay]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070e1a');
    scene.fog = new THREE.FogExp2('#070e1a', 0.016);

    const camera = new THREE.PerspectiveCamera(45, (container.clientWidth || 800) / (container.clientHeight || 520), 0.1, 1000);
    camera.position.set(12, 10, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth || 800, container.clientHeight || 520);
    container.appendChild(renderer.domElement);

    const sunLight = new THREE.DirectionalLight('#fffbeb', 3.5);
    sunLight.position.set(18, 22, 14);
    scene.add(sunLight);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const tod = timeOfDayRef.current;
      let targetSunY = 22;
      let targetSunX = 18;
      let sunColor = '#fffbeb';
      let skyFogColor = '#070e1a';

      if (tod === 'dawn') {
        targetSunY = 8;
        targetSunX = -20;
        sunColor = '#f59e0b';
        skyFogColor = '#1e1428';
      } else if (tod === 'noon') {
        targetSunY = 24;
        targetSunX = 12;
        sunColor = '#fffbeb';
        skyFogColor = '#06162d';
      } else if (tod === 'dusk') {
        targetSunY = 6;
        targetSunX = 22;
        sunColor = '#f97316';
        skyFogColor = '#241018';
      } else if (tod === 'night') {
        targetSunY = -10;
        targetSunX = 0;
        sunColor = '#38bdf8';
        skyFogColor = '#030712';
      }

      sunLight.position.lerp(new THREE.Vector3(targetSunX, targetSunY, 14), 0.04);
      sunLight.color.set(sunColor);
      scene.fog.color.set(skyFogColor);
      scene.background.set(skyFogColor);

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

      <div className="position-absolute bottom-0 start-0 w-100 p-3 pointer-events-none d-flex flex-wrap justify-content-between align-items-end gap-3">
        <div className="glass-panel p-2 rounded-3 pointer-events-auto d-flex align-items-center gap-2">
          <span className="text-secondary small fw-bold px-1">LIGHTING:</span>
          <div className="btn-group btn-group-sm">
            <button onClick={() => setTimeOfDay('dawn')} className={`btn btn-sm ${timeOfDay === 'dawn' ? 'btn-warning text-dark' : 'btn-outline-secondary text-white'}`}>Dawn</button>
            <button onClick={() => setTimeOfDay('noon')} className={`btn btn-sm ${timeOfDay === 'noon' ? 'btn-warning text-dark' : 'btn-outline-secondary text-white'}`}>Peak Noon</button>
            <button onClick={() => setTimeOfDay('dusk')} className={`btn btn-sm ${timeOfDay === 'dusk' ? 'btn-warning text-dark' : 'btn-outline-secondary text-white'}`}>Dusk</button>
            <button onClick={() => setTimeOfDay('night')} className={`btn btn-sm ${timeOfDay === 'night' ? 'btn-info text-dark' : 'btn-outline-secondary text-white'}`}>Night</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarMicrogrid3D;