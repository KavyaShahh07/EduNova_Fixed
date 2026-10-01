import React, { useState, useRef, useEffect } from 'react';
import { Compass, RotateCw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Smartphone, Play, Pause, Eye, Layers, RefreshCw, Zap, Sliders, Maximize2 } from 'lucide-react';
import { requestDeviceOrientationPermission } from '../../services/xrCapabilityService';
import { useTheme } from '../../context/ThemeContext';

export const XR360Viewer = ({ experience, onSelectHotspot, onAskSage }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // 360 Object Rotation Coordinates (Yaw: 0-360deg, Pitch: -60 to 60deg)
  const [yaw, setYaw] = useState(35);
  const [pitch, setPitch] = useState(15);
  const [zoom, setZoom] = useState(1);

  // Physics Velocity Momentum Inertia
  const velocityRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [simPlaying, setSimPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simTime, setSimTime] = useState(0);
  const [activeHotspotId, setActiveHotspotId] = useState(null);

  // Mobile Gyroscopic Sensors
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [gyroSupported, setGyroSupported] = useState(false);

  useEffect(() => {
    if (window.DeviceOrientationEvent) setGyroSupported(true);
  }, []);

  const handleToggleGyro = async () => {
    if (gyroEnabled) {
      setGyroEnabled(false);
      window.removeEventListener('deviceorientation', handleOrientation);
    } else {
      const granted = await requestDeviceOrientationPermission();
      if (granted) {
        setGyroEnabled(true);
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }
  };

  const handleOrientation = e => {
    if (e.alpha !== null && e.alpha !== undefined && e.beta !== null && e.beta !== undefined) {
      const targetYaw = (e.alpha + 360) % 360;
      const targetPitch = Math.max(-60, Math.min(60, e.beta - 45));

      setYaw(prev => {
        const diff = ((targetYaw - prev + 540) % 360) - 180;
        return (prev + diff * 0.25 + 360) % 360;
      });
      setPitch(prev => Math.max(-60, Math.min(60, prev + (targetPitch - prev) * 0.25)));
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Continuous 60fps Physics & Smooth 360 Orbit Loop with Momentum Damping
  useEffect(() => {
    let animId;
    let timeAcc = simTime;

    const renderLoop = () => {
      if (simPlaying) {
        timeAcc += 0.016 * simSpeed;
        setSimTime(Number(timeAcc.toFixed(2)));
      }

      // Inertial Damping physics when drag ends
      if (!isDraggingRef.current) {
        if (Math.abs(velocityRef.current.x) > 0.05 || Math.abs(velocityRef.current.y) > 0.05) {
          setYaw(prev => (prev + velocityRef.current.x + 360) % 360);
          setPitch(prev => Math.max(-60, Math.min(60, prev - velocityRef.current.y)));

          // Friction damping
          velocityRef.current.x *= 0.92;
          velocityRef.current.y *= 0.92;
        } else if (autoOrbit && !gyroEnabled) {
          // Continuous smooth 360 auto-orbit rotation
          setYaw(prev => (prev + 0.45 * simSpeed) % 360);
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [autoOrbit, gyroEnabled, simPlaying, simSpeed]);

  // BUTTERY-SMOOTH POINTER (MOUSE & TOUCH) DRAG ROTATION LISTENERS
  const handlePointerDown = e => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = e => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const rotSensitivity = 0.45;
    const newVelX = dx * rotSensitivity;
    const newVelY = dy * rotSensitivity;

    velocityRef.current = { x: newVelX, y: newVelY };

    setYaw(prev => (prev + newVelX + 360) % 360);
    setPitch(prev => Math.max(-60, Math.min(60, prev - newVelY)));

    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = e => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  const handleWheel = e => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(3.0, prev - e.deltaY * 0.0015)));
  };

  const handleKeyDown = e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') setYaw(prev => (prev - 10 + 360) % 360);
    if (e.key === 'ArrowRight' || e.key === 'd') setYaw(prev => (prev + 10) % 360);
    if (e.key === 'ArrowUp' || e.key === 'w') setPitch(prev => Math.min(60, prev + 10));
    if (e.key === 'ArrowDown' || e.key === 's') setPitch(prev => Math.max(-60, prev - 10));
  };

  const resetView = () => {
    setYaw(35);
    setPitch(15);
    setZoom(1);
    velocityRef.current = { x: 0, y: 0 };
    setExploded(false);
    setXrayMode(false);
  };

  const handleHotspotClick = hotspot => {
    setActiveHotspotId(hotspot.id);
    if (onSelectHotspot) onSelectHotspot(hotspot);
  };

  // HYPER-REALISTIC SCIENTIFIC 3D OBJECT CANVAS RENDER ENGINE
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateDimensions = () => {
      if (canvas.parentElement) {
        const newW = canvas.parentElement.clientWidth || 600;
        const newH = canvas.parentElement.clientHeight || 450;
        if (canvas.width !== newW || canvas.height !== newH) {
          canvas.width = newW;
          canvas.height = newH;
        }
      }
    };
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => updateDimensions());
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const width = canvas.width || 600;
    const height = canvas.height || 450;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // 1. Draw 360° Studio Stage Floor & Degree Hash Ring
    ctx.save();
    ctx.translate(cx, cy + 140 * zoom);
    const radY = (yaw * Math.PI) / 180;
    const radX = (pitch * Math.PI) / 180;

    const ringScaleY = Math.max(0.12, Math.abs(Math.cos(radX)));
    ctx.scale(zoom, zoom * 0.38 * ringScaleY);

    ctx.beginPath();
    ctx.arc(0, 0, 210, 0, Math.PI * 2);
    ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.35)' : 'rgba(168, 85, 247, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 360 Degree Cardinal Hash Marks
    const cardinalLabels = [
      { text: '0° Front', angle: 0 },
      { text: '90° Right', angle: Math.PI / 2 },
      { text: '180° Back', angle: Math.PI },
      { text: '270° Left', angle: (3 * Math.PI) / 2 }
    ];

    cardinalLabels.forEach(cl => {
      const a = cl.angle - radY;
      const lx = Math.sin(a) * 210;
      const ly = Math.cos(a) * 210;

      ctx.beginPath();
      ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#0284c7' : '#c084fc';
      ctx.fill();

      ctx.fillStyle = isLight ? '#0284c7' : '#38bdf8';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(cl.text, lx - 18, ly + 18);
    });
    ctx.restore();

    // 2. Render HYPER-REALISTIC 360° Target OBJECT
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);

    const modelId = experience?.id || 'human-heart';
    const explodeDist = exploded ? 45 : 0;

    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    // =========================================================================
    // 360 MODEL 1: REALISTIC ANATOMICAL HUMAN HEART (3D MYOCARDIUM & VESSELS)
    // =========================================================================
    if (modelId.includes('heart')) {
      const heartRate = 72;
      const pulsePhase = (simTime * (heartRate / 60) * Math.PI * 2);
      const pulseScale = 1 + Math.sin(pulsePhase) * 0.04;
      const rotScaleX = 0.65 + 0.35 * Math.abs(cosY);

      // Cardiac Systole/Diastole Shadow
      ctx.save();
      ctx.scale(rotScaleX * pulseScale, pulseScale);

      if (xrayMode) {
        // X-Ray Translucent Myocardium View
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 30;

        ctx.beginPath();
        ctx.ellipse(0, 10, 70, 95, -0.15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner 4 Chambers (Left/Right Atria & Ventricles)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.fillRect(-45 - explodeDist, 10, 38, 55); // Right Ventricle
        ctx.fillRect(8 + explodeDist, 10, 42, 60);  // Left Ventricle

        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.fillRect(-42 - explodeDist, -45, 32, 35); // Right Atrium
        ctx.fillRect(10 + explodeDist, -45, 35, 35);  // Left Atrium

        // Mitral & Tricuspid Valves
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-35 - explodeDist, -10, 20, 6);
        ctx.fillRect(18 + explodeDist, -10, 20, 6);

      } else {
        // REALISTIC 3D ORGANIC MYOCARDIUM MUSCLE TISSUE
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 20;

        // Ventricular Apex & Muscle Body Gradient
        const muscleGrad = ctx.createRadialGradient(-20, -10, 10, 0, 10, 95);
        muscleGrad.addColorStop(0, '#f87171');
        muscleGrad.addColorStop(0.4, '#dc2626');
        muscleGrad.addColorStop(0.8, '#991b1b');
        muscleGrad.addColorStop(1, '#450a0a');

        ctx.beginPath();
        // Realistic Heart Anatomy Contour (Left Ventricle Apex, Right Ventricle, Atria)
        ctx.moveTo(0, 105); // Apex tip
        ctx.bezierCurveTo(-65, 80, -85, 10, -75, -35); // Right border
        ctx.bezierCurveTo(-65, -75, -20, -85, 0, -65);  // Superior border
        ctx.bezierCurveTo(20, -85, 75, -75, 85, -30);  // Left atrium border
        ctx.bezierCurveTo(95, 15, 75, 75, 0, 105);    // Left ventricle border
        ctx.closePath();

        ctx.fillStyle = muscleGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Interventricular Sulcus Groove & Muscle Striation Lines
        ctx.beginPath();
        ctx.moveTo(-10, -40);
        ctx.quadraticCurveTo(-15, 20, -25, 95);
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // CORONARY ARTERIAL NETWORK (LAD Artery & Cardiac Veins)
        const artX = sinY * 20;
        ctx.beginPath();
        ctx.moveTo(-10 + artX, -40);
        ctx.lineTo(-12 + artX, -10);
        ctx.lineTo(-24 + artX, 35);
        ctx.lineTo(-20 + artX, 85);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.stroke();

        // Branching Coronary Capillaries
        ctx.beginPath();
        ctx.moveTo(-12 + artX, -10); ctx.lineTo(-32 + artX, 10);
        ctx.moveTo(-24 + artX, 35); ctx.lineTo(10 + artX, 55);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Cardiac Venous Network (Blue Lines)
        ctx.beginPath();
        ctx.moveTo(15 + artX, -25);
        ctx.lineTo(25 + artX, 20);
        ctx.lineTo(18 + artX, 70);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // 3D AORTIC ARCH & TUBULAR BRANCH VESSELS (TUBES AT TOP)
      const aortaX = -explodeDist * cosY;

      // Aorta Main Trunk Arch (Scarlet Red Tube)
      ctx.beginPath();
      ctx.arc(aortaX - 8, -75 - explodeDist, 32, Math.PI * 0.9, Math.PI * 0.1, false);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Aorta Specular Light Reflection Ring
      ctx.beginPath();
      ctx.arc(aortaX - 8, -75 - explodeDist, 32, Math.PI * 0.85, Math.PI * 0.15, false);
      ctx.strokeStyle = 'rgba(254, 202, 202, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 3 Distinct Aortic Branch Vessels (Brachiocephalic, Carotid, Subclavian)
      const branchX = [-24 + aortaX, -8 + aortaX, 10 + aortaX];
      branchX.forEach(bx => {
        ctx.beginPath();
        ctx.moveTo(bx, -102 - explodeDist);
        ctx.lineTo(bx + 2, -125 - explodeDist);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        ctx.stroke();
      });

      // PULMONARY ARTERY TRUNK (CYAN/BLUE TUBE CROSSING AORTA)
      ctx.beginPath();
      ctx.moveTo(-35 + aortaX, -45 - explodeDist);
      ctx.quadraticCurveTo(aortaX, -70 - explodeDist, 35 + aortaX, -60 - explodeDist);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 14;
      ctx.stroke();

      // Superior Vena Cava (Blue Venous Return Tube)
      ctx.beginPath();
      ctx.moveTo(-48 + aortaX, -50 - explodeDist);
      ctx.lineTo(-48 + aortaX, -110 - explodeDist);
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 12;
      ctx.stroke();

      ctx.restore();

    // =========================================================================
    // 360 MODEL 2: RISC-V CPU PIPELINE (ISOMETRIC 3D METALLIC CHIP STAGES)
    // =========================================================================
    } else if (modelId.includes('cpu') || modelId.includes('pipeline')) {
      ctx.shadowColor = xrayMode ? '#38bdf8' : '#6366f1';
      ctx.shadowBlur = xrayMode ? 25 : 14;

      // 3D PCB Silicon Chip Base Substrate
      ctx.fillStyle = isLight ? '#1e293b' : '#0f172a';
      ctx.fillRect(-180, 45, 360, 20);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(-180, 45, 360, 20);

      const stages = [
        { name: 'IF (Fetch)', color: '#3b82f6' },
        { name: 'ID (Decode)', color: '#06b6d4' },
        { name: 'EX (Execute)', color: '#f59e0b' },
        { name: 'MEM (Access)', color: '#10b981' },
        { name: 'WB (Write)', color: '#a855f7' }
      ];
      const stageW = 68;
      const gap = 8;
      const startX = -((stages.length * (stageW + gap)) / 2);

      stages.forEach((st, idx) => {
        const offset = idx >= 2 ? explodeDist : 0;
        const rawX = startX + idx * (stageW + gap) + offset;
        const rotatedX = rawX * cosY;
        const depthScale = 0.8 + 0.2 * Math.cos(radY + (idx * 0.4));
        const y = -35 + (rawX * sinY * 0.2);

        // 3D Extruded Top Face
        ctx.fillStyle = st.color;
        ctx.beginPath();
        ctx.moveTo(rotatedX, y);
        ctx.lineTo(rotatedX + 12, y - 10);
        ctx.lineTo(rotatedX + stageW * depthScale + 12, y - 10);
        ctx.lineTo(rotatedX + stageW * depthScale, y);
        ctx.closePath();
        ctx.fill();

        // Front Face
        ctx.fillStyle = xrayMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(30, 41, 59, 0.95)';
        ctx.fillRect(rotatedX, y, stageW * depthScale, 60);
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(rotatedX, y, stageW * depthScale, 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(st.name, rotatedX + 6, y + 34);
      });

      // 3D Gold ALU Core
      const aluX = (-stageW / 2 + explodeDist) * cosY;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.fillRect(aluX - 30, 70, 110, 45);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
      ctx.strokeRect(aluX - 30, 70, 110, 45);
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('ALU Core (64-bit)', aluX - 20, 97);

    // =========================================================================
    // 360 MODEL 3: 3D BINARY SEARCH TREE & AVL ROTATION (SHADED SPHERES)
    // =========================================================================
    } else if (modelId.includes('tree') && !modelId.includes('dbms')) {
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 15;

      const rawNodes = [
        { val: 50, x: 0, y: -95, color: '#3b82f6' },
        { val: 25, x: -90 - explodeDist, y: -20, color: '#06b6d4' },
        { val: 75, x: 90 + explodeDist, y: -20, color: '#a855f7' },
        { val: 12, x: -140 - explodeDist, y: 55, color: '#10b981' },
        { val: 37, x: -45 - explodeDist, y: 55, color: '#10b981' },
        { val: 62, x: 45 + explodeDist, y: 55, color: '#f59e0b' },
        { val: 87, x: 140 + explodeDist, y: 55, color: '#f59e0b' }
      ];

      const rotNodes = rawNodes.map(n => ({
        ...n,
        rx: n.x * cosY,
        ry: n.y + (n.x * sinY * 0.2),
        rz: -n.x * sinY
      }));

      // Sort nodes by Z depth so back nodes render behind front nodes
      rotNodes.sort((a, b) => a.rz - b.rz);

      // Edges
      ctx.beginPath();
      ctx.moveTo(rotNodes[0].rx, rotNodes[0].ry); ctx.lineTo(rotNodes[1].rx, rotNodes[1].ry);
      ctx.moveTo(rotNodes[0].rx, rotNodes[0].ry); ctx.lineTo(rotNodes[2].rx, rotNodes[2].ry);
      ctx.moveTo(rotNodes[1].rx, rotNodes[1].ry); ctx.lineTo(rotNodes[3].rx, rotNodes[3].ry);
      ctx.moveTo(rotNodes[1].rx, rotNodes[1].ry); ctx.lineTo(rotNodes[4].rx, rotNodes[4].ry);
      ctx.moveTo(rotNodes[2].rx, rotNodes[2].ry); ctx.lineTo(rotNodes[5].rx, rotNodes[5].ry);
      ctx.moveTo(rotNodes[2].rx, rotNodes[2].ry); ctx.lineTo(rotNodes[6].rx, rotNodes[6].ry);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Render Shaded Spheres
      rotNodes.forEach(n => {
        const sphereGrad = ctx.createRadialGradient(n.rx - 5, n.ry - 5, 2, n.rx, n.ry, 20);
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.4, n.color);
        sphereGrad.addColorStop(1, '#0f172a');

        ctx.beginPath();
        ctx.arc(n.rx, n.ry, 20, 0, Math.PI * 2);
        ctx.fillStyle = xrayMode ? 'rgba(15, 23, 42, 0.9)' : sphereGrad;
        ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(n.val.toString(), n.rx - 7, n.ry + 4);
      });

    // =========================================================================
    // 360 MODEL 4: QUANTUM BLOCH SPHERE (3D GLASS ORB & SUPERPOSITION VECTOR)
    // =========================================================================
    } else if (modelId.includes('bloch') || modelId.includes('quantum')) {
      const r = 90;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * Math.abs(cosY) + 10, r, 0, 0, Math.PI * 2);
      ctx.fillStyle = xrayMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.7)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5; ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, r * Math.abs(cosY) + 10, r * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; ctx.stroke();

      // Z-Axis
      ctx.beginPath(); ctx.moveTo(0, -r - 15); ctx.lineTo(0, r + 15);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('|0⟩ (Z+)', -15, -r - 20);
      ctx.fillText('|1⟩ (Z-)', -15, r + 25);

      // Superposition State Vector |ψ⟩
      const px = Math.sin(radY) * r;
      const py = -Math.cos(radY) * r * 0.8;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(px, py);
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7'; ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;

    // =========================================================================
    // 360 MODEL 5: MICROSERVICES CLOUD (ISOMETRIC TOWER CONTAINERS)
    // =========================================================================
    } else if (modelId.includes('microservices') || modelId.includes('system')) {
      ctx.shadowColor = '#10b981'; ctx.shadowBlur = 15;

      const lbX = (-160 - explodeDist) * cosY;
      const gwX = (-50) * cosY;
      const svcX = (70 + explodeDist) * cosY;

      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.fillRect(lbX - 30, -35, 60, 70);
      ctx.strokeStyle = '#06b6d4'; ctx.strokeRect(lbX - 30, -35, 60, 70);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.45)';
      ctx.fillRect(gwX - 30, -35, 60, 70);
      ctx.strokeStyle = '#6366f1'; ctx.strokeRect(gwX - 30, -35, 60, 70);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.fillRect(svcX - 35, -65, 75, 45);
      ctx.fillRect(svcX - 35, 20, 75, 45);
      ctx.strokeStyle = '#10b981'; ctx.strokeRect(svcX - 35, -65, 75, 45); ctx.strokeRect(svcX - 35, 20, 75, 45);

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('NGINX', lbX - 16, 5);
      ctx.fillText('Gateway', gwX - 20, 5);
      ctx.fillText('Redis', svcX - 15, -40);
      ctx.fillText('Auth Svc', svcX - 20, 45);

    // =========================================================================
    // 360 MODEL 6: BOHR ATOM & NUCLEUS (3D PROTON/NEUTRON CLUSTER & SHELLS)
    // =========================================================================
    } else if (modelId.includes('atom') || modelId.includes('bohr')) {
      // 3D Proton / Neutron Packed Nucleus Cluster
      ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.fillText('6P 6N', -14, 4);

      // K-Shell
      const rK = 65;
      ctx.beginPath(); ctx.ellipse(0, 0, rK * Math.abs(cosY) + 10, rK, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.stroke();

      // L-Shell
      const rL = 115 + explodeDist;
      ctx.beginPath(); ctx.ellipse(0, 0, rL * Math.abs(cosY) + 15, rL, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5; ctx.stroke();

      // Orbiting Valence Electrons
      const eL = simTime * 1.5;
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(ang => {
        const lx = Math.cos(ang + eL) * (rL * Math.abs(cosY) + 15);
        const ly = Math.sin(ang + eL) * rL;
        ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7'; ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
      });

    // =========================================================================
    // 360 MODEL 7: SOLENOID ELECTROMAGNETIC CORE & COPPER COILS
    // =========================================================================
    } else if (modelId.includes('solenoid') || modelId.includes('magnet')) {
      // Metallic Iron Core Cylinder
      const coreGrad = ctx.createLinearGradient(0, -25, 0, 25);
      coreGrad.addColorStop(0, '#64748b');
      coreGrad.addColorStop(0.5, '#f8fafc');
      coreGrad.addColorStop(1, '#334155');

      ctx.fillStyle = coreGrad;
      ctx.fillRect(-140 * cosY, -20, 280 * cosY, 40);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.strokeRect(-140 * cosY, -20, 280 * cosY, 40);

      // Copper Coil Wrappings
      for (let i = 0; i < 10; i++) {
        const tx = (-120 + i * 26) * cosY;
        ctx.beginPath(); ctx.ellipse(tx, 0, 10 * Math.abs(cosY) + 2, 35, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3.5; ctx.stroke();
      }

    } else {
      // GENERIC HOLOGRAM SPHERE FALLBACK
      ctx.beginPath();
      ctx.ellipse(0, 0, 80 * Math.abs(cosY) + 10, 80, 0, 0, Math.PI * 2);
      ctx.fillStyle = xrayMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(59, 130, 246, 0.7)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3; ctx.stroke();
    }

    ctx.restore();

    return () => resizeObserver.disconnect();
  }, [yaw, pitch, zoom, exploded, xrayMode, simTime, experience, isLight]);

  const activeHotspot = experience?.hotspots?.find(h => h.id === activeHotspotId);

  const buttonStyle = {
    background: 'none',
    border: 'none',
    color: isLight ? '#0f172a' : '#ffffff',
    fontSize: '0.76rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 8px',
    borderRadius: '8px'
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      style={{
        position: 'relative',
        width: '100%',
        height: '680px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: isLight
          ? 'radial-gradient(circle at center, #0f172a 0%, #050814 100%)'
          : 'radial-gradient(circle at center, #0f172a 0%, #050814 100%)',
        border: isLight ? '1.5px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(168, 85, 247, 0.35)',
        boxShadow: isLight ? '0 15px 45px rgba(100, 130, 200, 0.2)' : '0 20px 50px rgba(0, 0, 0, 0.6)',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        outline: 'none'
      }}
    >
      {/* Target 3D Object Canvas */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />

      {/* Synchronized Hotspots with 360 Depth Fade */}
      {showLabels && experience?.hotspots?.map(h => {
        const radY = (yaw * Math.PI) / 180;
        const radX = (pitch * Math.PI) / 180;

        // Calculate 3D sphere coordinate offsets
        const relX = (h.x - 50) * 3.2;
        const relY = (h.y - 50) * 3.2;
        const relZ = h.importance === 'High' ? 35 : -15;

        // Rotate along Y (Yaw) and X (Pitch)
        const rotX = relX * Math.cos(radY) + relZ * Math.sin(radY);
        const rotZ = -relX * Math.sin(radY) + relZ * Math.cos(radY);
        const rotY = relY * Math.cos(radX) - rotZ * Math.sin(radX);

        const projX = 50 + (rotX / 3.2);
        const projY = 50 + (rotY / 3.2);

        // Hide or dim hotspot when rotated to back of 360 object
        const isFront = rotZ > -15;
        const opacity = isFront ? 1.0 : 0.25;

        return (
          <button
            key={h.id}
            onClick={() => handleHotspotClick(h)}
            style={{
              position: 'absolute',
              left: `${projX}%`,
              top: `${projY}%`,
              transform: 'translate(-50%, -50%)',
              background: activeHotspotId === h.id
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : (isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.88)'),
              color: activeHotspotId === h.id ? '#ffffff' : (isLight ? '#0f172a' : '#ffffff'),
              border: activeHotspotId === h.id
                ? '2px solid #ffffff'
                : (isLight ? '1.5px solid #a855f7' : '1px solid #c084fc'),
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
              zIndex: isFront ? 12 : 5,
              opacity,
              pointerEvents: isFront ? 'auto' : 'none',
              transition: 'opacity 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }} />
            <span>{h.name}</span>
          </button>
        );
      })}

      {/* Top Left Telemetry HUD */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(5, 8, 20, 0.8)',
          border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(168, 85, 247, 0.3)',
          padding: '10px 14px',
          borderRadius: '12px',
          fontSize: '0.76rem',
          color: isLight ? '#334155' : '#94a3b8',
          zIndex: 15,
          backdropFilter: 'blur(12px)',
          pointerEvents: 'none'
        }}
      >
        <div style={{ color: '#a855f7', fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Compass size={14} /> 360° Cursor Pointer Angle
        </div>
        <div>Object Yaw: {Math.round(yaw)}° (360° Orbit)</div>
        <div>Object Pitch: {Math.round(pitch)}°</div>
        <div>Scale Zoom: {zoom.toFixed(2)}x</div>
      </div>

      {/* Mobile Gyroscopic Toggle */}
      {gyroSupported && (
        <button
          onClick={handleToggleGyro}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: gyroEnabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            border: gyroEnabled ? '1.5px solid #34d399' : '1px solid rgba(255, 255, 255, 0.2)',
            padding: '8px 14px',
            borderRadius: '20px',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(12px)',
            zIndex: 20,
            boxShadow: gyroEnabled ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none'
          }}
        >
          <Smartphone size={15} />
          <span>{gyroEnabled ? '📱 Gyro Active (Click to Return Normal)' : '📱 Enable Mobile Gyro'}</span>
        </button>
      )}

      {/* Bottom Floating Control Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.88)',
          padding: '6px 14px',
          borderRadius: '30px',
          border: isLight ? '1px solid rgba(199, 210, 254, 0.9)' : '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(16px)',
          zIndex: 20,
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
        }}
      >
        <button onClick={() => setSimPlaying(!simPlaying)} style={buttonStyle}>
          {simPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button onClick={() => setAutoOrbit(!autoOrbit)} style={{ ...buttonStyle, color: autoOrbit ? '#a855f7' : (isLight ? '#64748b' : '#94a3b8') }}>
          <RotateCw size={15} /> 360° Orbit
        </button>
        <button onClick={() => setExploded(!exploded)} style={{ ...buttonStyle, color: exploded ? '#d97706' : (isLight ? '#64748b' : '#94a3b8') }}>
          <Layers size={15} /> Explode
        </button>
        <button onClick={() => setXrayMode(!xrayMode)} style={{ ...buttonStyle, color: xrayMode ? '#7c3aed' : (isLight ? '#64748b' : '#94a3b8') }}>
          <Eye size={15} /> X-Ray
        </button>
        <button onClick={resetView} style={buttonStyle}>
          <RefreshCw size={15} /> Reset
        </button>
      </div>

      {/* Manual D-Pad Rotation Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 36px)',
          gridTemplateRows: 'repeat(2, 36px)',
          gap: '4px',
          zIndex: 20
        }}
      >
        <div />
        <button onClick={() => setPitch(p => Math.min(60, p + 15))} style={arrowBtnStyle}>
          <ArrowUp size={16} />
        </button>
        <div />
        <button onClick={() => setYaw(y => (y - 15 + 360) % 360)} style={arrowBtnStyle}>
          <ArrowLeft size={16} />
        </button>
        <button onClick={() => setPitch(p => Math.max(-60, p - 15))} style={arrowBtnStyle}>
          <ArrowDown size={16} />
        </button>
        <button onClick={() => setYaw(y => (y + 15) % 360)} style={arrowBtnStyle}>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Hotspot Inspector Card */}
      {activeHotspot && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '70px',
            maxWidth: '280px',
            background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.94)',
            border: isLight ? '1.5px solid rgba(168, 85, 247, 0.45)' : '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '16px',
            padding: '12px 14px',
            backdropFilter: 'blur(16px)',
            color: isLight ? '#0f172a' : '#fff',
            zIndex: 25,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h4 style={{ margin: 0, color: '#a855f7', fontSize: '0.90rem', fontWeight: 800 }}>{activeHotspot.name}</h4>
            <button onClick={() => setActiveHotspotId(null)} style={{ background: 'none', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
          <p style={{ fontSize: '0.78rem', color: isLight ? '#334155' : '#cbd5e1', margin: '0 0 8px 0', lineHeight: 1.35 }}>{activeHotspot.description}</p>
          {onAskSage && (
            <button
              onClick={() => onAskSage(`Explain ${activeHotspot.name} in 360 perspective for ${experience?.name}`)}
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '6px'
              }}
            >
              <Zap size={13} /> Ask Sage AI About This
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const arrowBtnStyle = {
  background: 'rgba(15, 23, 42, 0.85)',
  border: '1px solid rgba(168, 85, 247, 0.4)',
  color: '#ffffff',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justify: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)'
};

export default XR360Viewer;
