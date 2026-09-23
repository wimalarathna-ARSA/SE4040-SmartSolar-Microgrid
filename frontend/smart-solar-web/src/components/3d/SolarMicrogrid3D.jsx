// ============================================================================
// File: SolarMicrogrid3D.jsx
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: High-fidelity Three.js 3D simulation of photovoltaic microgrid and battery transfer telemetry.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Procedural texture generator for high-realism photovoltaic monocrystalline solar cells
 */
function createSolarCellTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base monocrystalline dark blue silicon wafer
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#0c2240');
  grad.addColorStop(0.5, '#0a192f');
  grad.addColorStop(1, '#0e2b52');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Solar wafer grid (6 columns x 10 rows of cells)
  const cols = 6;
  const rows = 10;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;

      // Cell border / wafer isolation gap
      ctx.strokeStyle = '#040d1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // Micro contact fingers (fine horizontal silver lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.6;
      for (let f = 3; f < cellH - 2; f += 4) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + f);
        ctx.lineTo(x + cellW - 2, y + f);
        ctx.stroke();
      }

      // Main silver busbars (2 vertical tracks per cell)
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

/**
 * Procedural texture for the battery storage container decals
 */
function createBatteryContainerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Industrial slate background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 256);

  // Corrugated steel panels stripes
  for (let x = 0; x < 512; x += 16) {
    ctx.fillStyle = x % 32 === 0 ? '#172033' : '#283548';
    ctx.fillRect(x, 0, 8, 256);
  }

  // Ventilation louvers
  ctx.fillStyle = '#0f172a';
  for (let y = 40; y < 140; y += 10) {
    ctx.fillRect(40, y, 120, 5);
    ctx.fillRect(200, y, 120, 5);
  }

  // Decal badge
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(360, 40, 110, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('BESS-480V', 370, 66);

  ctx.fillStyle = '#22c55e';
  ctx.font = '12px monospace';
  ctx.fillText('ACTIVE GRID NODE', 360, 110);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('CAPACITY: 250 kWh', 360, 130);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

const SolarMicrogrid3D = () => {
  const mountRef = useRef(null);
  const [timeOfDay, setTimeOfDay] = useState('noon'); // 'dawn', 'noon', 'dusk', 'night'
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'panels', 'battery', 'inverter'
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [telemetry, setTelemetry] = useState({
    solarYieldKw: 48.6,
    irradiance: 940,
    batterySoc: 86,
    gridStatus: 'Exporting to Microgrid',
    co2SavedKg: 142.5,
  });

  // State refs to bridge Three.js animation loop with React state
  const timeOfDayRef = useRef(timeOfDay);
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
    timeOfDayRef.current = timeOfDay;
  }, [timeOfDay]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Adjust telemetry based on time of day
  useEffect(() => {
    if (timeOfDay === 'dawn') {
      setTelemetry({
        solarYieldKw: 16.4,
        irradiance: 320,
        batterySoc: 45,
        gridStatus: 'Solar Ramping Up',
        co2SavedKg: 85.2,
      });
    } else if (timeOfDay === 'noon') {
      setTelemetry({
        solarYieldKw: 48.6,
        irradiance: 940,
        batterySoc: 86,
        gridStatus: 'Peak Exporting to Grid',
        co2SavedKg: 142.5,
      });
    } else if (timeOfDay === 'dusk') {
      setTelemetry({
        solarYieldKw: 12.1,
        irradiance: 210,
        batterySoc: 94,
        gridStatus: 'BESS Discharging to Grid',
        co2SavedKg: 138.0,
      });
    } else if (timeOfDay === 'night') {
      setTelemetry({
        solarYieldKw: 0.0,
        irradiance: 0,
        batterySoc: 78,
        gridStatus: 'BESS Baseload Mode',
        co2SavedKg: 135.2,
      });
    }
  }, [timeOfDay]);

  // Set camera view preset
  const handleViewChange = (view) => {
    setCurrentView(view);
    const ctrl = controlsRef.current;
    if (view === 'overview') {
      ctrl.targetRotX = 0.35;
      ctrl.targetRotY = -0.45;
      ctrl.targetDistance = 22;
    } else if (view === 'panels') {
      ctrl.targetRotX = 0.28;
      ctrl.targetRotY = -0.15;
      ctrl.targetDistance = 14;
    } else if (view === 'battery') {
      ctrl.targetRotX = 0.25;
      ctrl.targetRotY = 1.25;
      ctrl.targetDistance = 13;
    } else if (view === 'inverter') {
      ctrl.targetRotX = 0.45;
      ctrl.targetRotY = 2.3;
      ctrl.targetDistance = 15;
    }
  };

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

    // Glowing Sun Mesh with Atmospheric Corona
    const sunGroup = new THREE.Group();
    const sunGeom = new THREE.SphereGeometry(1.8, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#fde047' });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunGroup.add(sunMesh);

    // Corona ring
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

    // 5. GROUND TERRAIN & CYBER-GRID PLATFORM
    const groundGroup = new THREE.Group();
    
    // Main foundation slab
    const groundGeom = new THREE.CylinderGeometry(18, 19, 0.6, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#0b1320',
      roughness: 0.85,
      metalness: 0.15,
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.position.y = -0.3;
    groundMesh.receiveShadow = true;
    groundGroup.add(groundMesh);

    // High-tech holographic circular grid
    const gridHelper = new THREE.PolarGridHelper(17.5, 16, 8, 64, '#0284c7', '#0e3a5a');
    gridHelper.position.y = 0.02;
    groundGroup.add(gridHelper);

    // Outer cyber glowing ring
    const ringGeom = new THREE.RingGeometry(17.2, 17.6, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#06b6d4',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.03;
    groundGroup.add(ringMesh);

    scene.add(groundGroup);

    // 6. PROCEDURAL TEXTURES
    const solarCellTex = createSolarCellTexture();
    const batteryTex = createBatteryContainerTexture();

    // 7. INTERACTIVE OBJECTS MAP (for click/hover raycasting)
    const interactableObjects = [];

    // 8. SOLAR TRACKING ARRAYS
    const solarFarmGroup = new THREE.Group();
    const solarMaterial = new THREE.MeshStandardMaterial({
      map: solarCellTex,
      roughness: 0.15,
      metalness: 0.65,
      bumpScale: 0.05,
    });

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      metalness: 0.85,
      roughness: 0.25,
    });

    const pylonMaterial = new THREE.MeshStandardMaterial({
      color: '#475569',
      metalness: 0.7,
      roughness: 0.4,
    });

    // Helper: Create a single commercial dual-axis solar tracker unit
    function createSolarTracker(offsetX, offsetZ) {
      const trackerUnit = new THREE.Group();
      trackerUnit.position.set(offsetX, 0, offsetZ);

      // Base concrete footing
      const footingGeom = new THREE.CylinderGeometry(0.5, 0.6, 0.4, 16);
      const footingMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.9 });
      const footing = new THREE.Mesh(footingGeom, footingMat);
      footing.position.y = 0.2;
      footing.castShadow = true;
      footing.receiveShadow = true;
      trackerUnit.add(footing);

      // Steel vertical column pylon
      const columnGeom = new THREE.CylinderGeometry(0.18, 0.2, 2.2, 16);
      const column = new THREE.Mesh(columnGeom, pylonMaterial);
      column.position.y = 1.3;
      column.castShadow = true;
      trackerUnit.add(column);

      // Horizontal tilt gimbal/axle
      const axleGeom = new THREE.CylinderGeometry(0.22, 0.22, 1.0, 16);
      const axle = new THREE.Mesh(axleGeom, frameMaterial);
      axle.rotation.z = Math.PI / 2;
      axle.position.y = 2.4;
      axle.castShadow = true;
      trackerUnit.add(axle);

      // Tilting Solar Array Frame
      const tiltingGroup = new THREE.Group();
      tiltingGroup.position.set(0, 2.4, 0);

      // Support crossbars
      const barGeom = new THREE.BoxGeometry(4.2, 0.08, 0.12);
      const bar1 = new THREE.Mesh(barGeom, frameMaterial);
      bar1.position.set(0, 0, 0.7);
      const bar2 = new THREE.Mesh(barGeom, frameMaterial);
      bar2.position.set(0, 0, -0.7);
      tiltingGroup.add(bar1, bar2);

      // 4 PV Modules forming an industrial panel table
      for (let px = -1.05; px <= 1.05; px += 2.1) {
        for (let pz = -0.75; pz <= 0.75; pz += 1.5) {
          // Aluminum beveled panel frame
          const panelFrameGeom = new THREE.BoxGeometry(2.0, 0.06, 1.4);
          const panelFrame = new THREE.Mesh(panelFrameGeom, frameMaterial);
          panelFrame.position.set(px, 0.04, pz);
          panelFrame.castShadow = true;
          tiltingGroup.add(panelFrame);

          // Silicon PV active surface
          const pvGeom = new THREE.PlaneGeometry(1.94, 1.34);
          const pvMesh = new THREE.Mesh(pvGeom, solarMaterial);
          pvMesh.rotation.x = -Math.PI / 2;
          pvMesh.position.set(px, 0.075, pz);
          pvMesh.receiveShadow = true;
          tiltingGroup.add(pvMesh);
        }
      }

      // Initial realistic tilt facing sun (~25 degrees south)
      tiltingGroup.rotation.x = -0.45;
      trackerUnit.add(tiltingGroup);

      // Tag for raycasting tooltip
      trackerUnit.userData = {
        name: 'Solar PV Tracker Array',
        type: 'solar',
        details: 'Dual-Axis High-Efficiency Monocrystalline Silicon (48 kW peak capacity)',
      };
      interactableObjects.push(trackerUnit);

      return { trackerUnit, tiltingGroup };
    }

    // Spawn an array of 4 solar tracker stations
    const trackers = [];
    trackers.push(createSolarTracker(-4.5, -2.5));
    trackers.push(createSolarTracker(1.5, -2.5));
    trackers.push(createSolarTracker(-4.5, 3.5));
    trackers.push(createSolarTracker(1.5, 3.5));

    trackers.forEach((t) => solarFarmGroup.add(t.trackerUnit));
    scene.add(solarFarmGroup);

    // 9. BESS BATTERY STORAGE CONTAINER UNIT
    const bessGroup = new THREE.Group();
    bessGroup.position.set(7.5, 0, -1.0);

    // Battery container enclosure
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
    bessMesh.receiveShadow = true;
    bessGroup.add(bessMesh);

    // Rooftop industrial HVAC air condenser unit
    const hvacGeom = new THREE.BoxGeometry(1.6, 0.5, 2.2);
    const hvacMesh = new THREE.Mesh(hvacGeom, frameMaterial);
    hvacMesh.position.set(0, 2.85, 0);
    hvacMesh.castShadow = true;
    bessGroup.add(hvacMesh);

    // Glowing Animated Battery State of Charge LED Indicator Strips
    const ledStrips = [];
    for (let i = 0; i < 5; i++) {
      const ledGeom = new THREE.BoxGeometry(0.12, 0.16, 0.4);
      const ledMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });
      const ledMesh = new THREE.Mesh(ledGeom, ledMat);
      ledMesh.position.set(-1.8, 0.6 + i * 0.3, 1.8);
      bessGroup.add(ledMesh);
      ledStrips.push(ledMesh);
    }

    bessGroup.userData = {
      name: 'Grid BESS Battery Substation',
      type: 'battery',
      details: '250 kWh LiFePO4 Battery Storage System with dynamic bidirectional inverter dispatch',
    };
    interactableObjects.push(bessGroup);
    scene.add(bessGroup);

    // 10. CENTRAL SMART INVERTER & TRANSFORMER KIOSK
    const inverterGroup = new THREE.Group();
    inverterGroup.position.set(7.5, 0, 4.0);

    const inverterGeom = new THREE.BoxGeometry(2.0, 2.0, 1.8);
    const inverterMat = new THREE.MeshStandardMaterial({
      color: '#0284c7',
      metalness: 0.5,
      roughness: 0.3,
    });
    const inverterMesh = new THREE.Mesh(inverterGeom, inverterMat);
    inverterMesh.position.y = 1.0;
    inverterMesh.castShadow = true;
    inverterMesh.receiveShadow = true;
    inverterGroup.add(inverterMesh);

    // High voltage cooling radiator fins
    for (let f = -0.7; f <= 0.7; f += 0.25) {
      const finGeom = new THREE.BoxGeometry(0.04, 1.6, 2.1);
      const fin = new THREE.Mesh(finGeom, frameMaterial);
      fin.position.set(1.05, 1.0, f);
      fin.castShadow = true;
      inverterGroup.add(fin);
    }

    // Telemetry digital display on the inverter
    const screenGeom = new THREE.PlaneGeometry(0.8, 0.5);
    const screenMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.rotation.y = -Math.PI / 2;
    screen.position.set(-1.01, 1.2, 0);
    inverterGroup.add(screen);

    inverterGroup.userData = {
      name: 'High-Voltage Smart Inverter & Transformer',
      type: 'inverter',
      details: 'Converts DC solar energy to 400V 3-phase AC with 98.4% MPPT efficiency',
    };
    interactableObjects.push(inverterGroup);
    scene.add(inverterGroup);

    // 11. POWER TRANSMISSION PYLON & GRID LINE CONDUITS
    const pylonGroup = new THREE.Group();
    pylonGroup.position.set(-12, 0, -10);

    const towerGeom = new THREE.CylinderGeometry(0.4, 1.6, 12, 4);
    const towerMat = new THREE.MeshStandardMaterial({
      color: '#64748b',
      wireframe: true,
    });
    const towerMesh = new THREE.Mesh(towerGeom, towerMat);
    towerMesh.position.y = 6;
    pylonGroup.add(towerMesh);

    // Cross-arm beams
    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 0.3), frameMaterial);
    crossArm.position.y = 10;
    pylonGroup.add(crossArm);

    scene.add(pylonGroup);

    // 12. GLOWING ENERGY CONDUIT LINES ON GROUND
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

    // 13. LIVE 3D ENERGY FLOW PARTICLES (Photons & Grid Pulses)
    const particleCount = 180;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    // Distribute particles along paths between solar panels, inverter, and battery
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 1] = Math.random() * 4 + 0.1;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 16;
      particleSpeeds[i] = 0.03 + Math.random() * 0.06;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#38bdf8',
      size: 0.25,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 14. MOUSE ORBIT CONTROLS & PARALLAX
    const ctrl = controlsRef.current;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e) => {
      ctrl.isDragging = true;
      ctrl.prevMouseX = e.clientX;
      ctrl.prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (ctrl.isDragging) {
        const deltaX = e.clientX - ctrl.prevMouseX;
        const deltaY = e.clientY - ctrl.prevMouseY;

        ctrl.targetRotY += deltaX * 0.006;
        ctrl.targetRotX = Math.max(0.1, Math.min(Math.PI / 2.2, ctrl.targetRotX + deltaY * 0.005));

        ctrl.prevMouseX = e.clientX;
        ctrl.prevMouseY = e.clientY;
      } else {
        // Raycast check for interactive tooltips
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        let foundObject = null;
        for (let hit of intersects) {
          let curr = hit.object;
          while (curr) {
            if (curr.userData && curr.userData.name) {
              foundObject = curr.userData;
              break;
            }
            curr = curr.parent;
          }
          if (foundObject) break;
        }
        setActiveTooltip(foundObject);
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

    // Handle Window Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 15. MAIN ANIMATION RENDER LOOP
    let animationFrameId;
    const startTime = performance.now();
    let lastTime = startTime;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) * 0.001, 0.1);
      const time = (now - startTime) * 0.001;
      lastTime = now;

      // Smooth damping for camera controls
      if (autoRotateRef.current && !ctrl.isDragging) {
        ctrl.targetRotY += 0.002;
      }
      ctrl.rotX += (ctrl.targetRotX - ctrl.rotX) * 0.08;
      ctrl.rotY += (ctrl.targetRotY - ctrl.rotY) * 0.08;
      ctrl.distance += (ctrl.targetDistance - ctrl.distance) * 0.08;

      // Update camera spherical position
      camera.position.x = ctrl.distance * Math.sin(ctrl.rotY) * Math.cos(ctrl.rotX);
      camera.position.y = ctrl.distance * Math.sin(ctrl.rotX);
      camera.position.z = ctrl.distance * Math.cos(ctrl.rotY) * Math.cos(ctrl.rotX);
      camera.lookAt(0, 1.2, 0);

      // Orient corona ring towards camera
      coronaMesh.lookAt(camera.position);

      // Atmospheric Lighting transitions based on time of day
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
        sunLight.intensity = 2.2;
      } else if (tod === 'noon') {
        targetSunY = 24;
        targetSunX = 12;
        sunColor = '#fffbeb';
        skyFogColor = '#06162d';
        sunLight.intensity = 3.6;
      } else if (tod === 'dusk') {
        targetSunY = 6;
        targetSunX = 22;
        sunColor = '#f97316';
        skyFogColor = '#241018';
        sunLight.intensity = 2.0;
      } else if (tod === 'night') {
        targetSunY = -10;
        targetSunX = 0;
        sunColor = '#38bdf8';
        skyFogColor = '#030712';
        sunLight.intensity = 0.2;
      }

      sunLight.position.lerp(new THREE.Vector3(targetSunX, targetSunY, 14), 0.04);
      sunGroup.position.copy(sunLight.position);
      sunLight.color.set(sunColor);
      sunMat.color.set(sunColor);
      scene.fog.color.set(skyFogColor);
      scene.background.set(skyFogColor);

      // Articulate Solar Trackers to face the dynamic Sun
      trackers.forEach((t) => {
        if (tod === 'night') {
          // Night stow position (flat horizontal)
          t.tiltingGroup.rotation.x = THREE.MathUtils.lerp(t.tiltingGroup.rotation.x, 0, 0.03);
        } else {
          // Track sun angle
          const angle = (targetSunX / 24) * 0.45;
          t.tiltingGroup.rotation.z = THREE.MathUtils.lerp(t.tiltingGroup.rotation.z, -angle, 0.03);
          t.tiltingGroup.rotation.x = THREE.MathUtils.lerp(t.tiltingGroup.rotation.x, -0.4, 0.03);
        }
      });

      // Animate Battery SoC LEDs (pulse effect)
      ledStrips.forEach((led, idx) => {
        const pulse = Math.sin(time * 3 + idx * 0.8) * 0.5 + 0.5;
        if (tod === 'night') {
          led.material.color.set(pulse > 0.3 ? '#38bdf8' : '#0284c7');
        } else {
          led.material.color.set(pulse > 0.2 ? '#22c55e' : '#15803d');
        }
      });

      // Animate Energy Flow Particles
      const positions = particleGeom.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        // Move towards inverter & battery hub
        positions[i * 3 + 0] += (7.5 - positions[i * 3 + 0]) * particleSpeeds[i] * 0.4;
        positions[i * 3 + 2] += (0.0 - positions[i * 3 + 2]) * particleSpeeds[i] * 0.4;
        positions[i * 3 + 1] = Math.sin(time * 2 + i) * 0.5 + 1.2;

        // Reset particle when it reaches center
        if (Math.abs(positions[i * 3 + 0] - 7.5) < 0.8) {
          positions[i * 3 + 0] = (Math.random() - 0.5) * 14 - 2;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
          positions[i * 3 + 1] = Math.random() * 2 + 1;
        }
      }
      particleGeom.attributes.position.needsUpdate = true;

      // Pulse conduit glow
      conduitMaterial.opacity = 0.5 + Math.sin(time * 4) * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // 16. CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
      solarCellTex.dispose();
      batteryTex.dispose();
    };
  }, []);

  return (
    <div className="position-relative w-100 rounded-4 overflow-hidden shadow-2xl border border-secondary border-opacity-25" style={{ height: '560px' }}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-100 h-100" style={{ cursor: 'grab' }} />

      {/* Top Overlay: 3D Scene Controls & HUD */}
      <div className="position-absolute top-0 start-0 w-100 p-3 d-flex justify-content-between align-items-start pointer-events-none">
        {/* Left: 3D Microgrid Status Badge */}
        <div className="glass-panel p-2 px-3 rounded-3 d-flex align-items-center gap-2 pointer-events-auto">
          <span className="position-relative d-flex h-3 w-3">
            <span className="spinner-grow spinner-grow-sm text-success" role="status" />
          </span>
          <span className="text-white fw-bold small tracking-wider text-uppercase">
            <i className="bi bi-cpu-fill text-info me-1" />
          </span>
        </div>

        {/* Right: Camera View Controls */}
        <div className="d-flex gap-2 pointer-events-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`btn btn-sm ${autoRotate ? 'btn-info text-dark' : 'btn-outline-light'} rounded-pill fw-semibold`}
            title="Toggle Auto-Rotate"
          >
            <i className={`bi bi-${autoRotate ? 'pause-fill' : 'play-fill'}`} />
          </button>

          <div className="btn-group btn-group-sm glass-panel p-1 rounded-pill">
            <button
              onClick={() => handleViewChange('overview')}
              className={`btn btn-sm ${currentView === 'overview' ? 'btn-primary' : 'btn-dark text-light'} rounded-pill`}
            >
              Overview
            </button>
            <button
              onClick={() => handleViewChange('panels')}
              className={`btn btn-sm ${currentView === 'panels' ? 'btn-primary' : 'btn-dark text-light'} rounded-pill`}
            >
              PV Array
            </button>
            <button
              onClick={() => handleViewChange('battery')}
              className={`btn btn-sm ${currentView === 'battery' ? 'btn-primary' : 'btn-dark text-light'} rounded-pill`}
            >
              BESS Bank
            </button>
            <button
              onClick={() => handleViewChange('inverter')}
              className={`btn btn-sm ${currentView === 'inverter' ? 'btn-primary' : 'btn-dark text-light'} rounded-pill`}
            >
              Substation
            </button>
          </div>
        </div>
      </div>

      {/* Floating 3D Tooltip (Raycasting) */}
      {activeTooltip && (
        <div
          className="position-absolute glass-panel-glow p-2 px-3 rounded-3 text-white pointer-events-none"
          style={{
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <div className="fw-bold text-info small d-flex align-items-center gap-1">
            <i className="bi bi-pin-map-fill" /> {activeTooltip.name}
          </div>
          <div className="text-light smaller" style={{ fontSize: '0.82rem' }}>
            {activeTooltip.details}
          </div>
        </div>
      )}

      {/* Bottom Overlay: Time of Day Slider & Live Telemetry HUD */}
      <div className="position-absolute bottom-0 start-0 w-100 p-3 pointer-events-none d-flex flex-wrap justify-content-between align-items-end gap-3">
        {/* Time of Day Mode Switcher */}
        <div className="glass-panel p-2 rounded-3 pointer-events-auto d-flex align-items-center gap-2">
          <span className="text-secondary small fw-bold px-1">LIGHTING:</span>
          <div className="btn-group btn-group-sm">
            <button
              onClick={() => setTimeOfDay('dawn')}
              className={`btn btn-sm ${timeOfDay === 'dawn' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-white'}`}
            >
              <i className="bi bi-sunrise-fill me-1" /> Dawn
            </button>
            <button
              onClick={() => setTimeOfDay('noon')}
              className={`btn btn-sm ${timeOfDay === 'noon' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-white'}`}
            >
              <i className="bi bi-sun-fill me-1" /> Peak Noon
            </button>
            <button
              onClick={() => setTimeOfDay('dusk')}
              className={`btn btn-sm ${timeOfDay === 'dusk' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-white'}`}
            >
              <i className="bi bi-sunset-fill me-1" /> Dusk
            </button>
            <button
              onClick={() => setTimeOfDay('night')}
              className={`btn btn-sm ${timeOfDay === 'night' ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary text-white'}`}
            >
              <i className="bi bi-moon-stars-fill me-1" /> Night
            </button>
          </div>
        </div>

        {/* Live Telemetry KPI Metrics */}
        <div className="glass-panel p-2 px-3 rounded-3 pointer-events-auto d-flex gap-4 align-items-center text-white">
          <div>
            <div className="text-secondary smaller text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>
              Instant Generation
            </div>
            <div className="fs-5 fw-bold text-warning">
              {telemetry.solarYieldKw} <span className="small fs-6 fw-normal">kW</span>
            </div>
          </div>

          <div className="border-start border-secondary border-opacity-50 ps-3">
            <div className="text-secondary smaller text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>
              Solar Irradiance
            </div>
            <div className="fs-5 fw-bold text-info">
              {telemetry.irradiance} <span className="small fs-6 fw-normal">W/m²</span>
            </div>
          </div>

          <div className="border-start border-secondary border-opacity-50 ps-3">
            <div className="text-secondary smaller text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>
              BESS Capacity
            </div>
            <div className="fs-5 fw-bold text-success">
              {telemetry.batterySoc}% <span className="small fs-6 fw-normal">SoC</span>
            </div>
          </div>

          <div className="border-start border-secondary border-opacity-50 ps-3 d-none d-md-block">
            <div className="text-secondary smaller text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>
              Status
            </div>
            <div className="small fw-semibold text-light">{telemetry.gridStatus}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarMicrogrid3D;
