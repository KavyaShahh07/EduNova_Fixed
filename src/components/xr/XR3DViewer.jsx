import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, Play, Pause, FastForward, Eye, Layers, Zap, Sliders, Info, Compass, Maximize2, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const XR3DViewer = ({ experience, onSelectHotspot, onAskSage, compact = false }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 18, y: 35 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [simPlaying, setSimPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simTime, setSimTime] = useState(0);
  const [activeHotspotId, setActiveHotspotId] = useState(null);
  const [showFormula, setShowFormula] = useState(true);

  // Dynamic Parameter Sliders
  const [paramValues, setParamValues] = useState(() => {
    const initial = {};
    experience?.parameters?.forEach(p => {
      initial[p.name] = p.default;
    });
    return initial;
  });

  useEffect(() => {
    const initial = {};
    experience?.parameters?.forEach(p => {
      initial[p.name] = p.default;
    });
    setParamValues(initial);
  }, [experience]);

  // Continuous Animation Loop
  useEffect(() => {
    let animId;
    let timeAcc = simTime;

    const renderLoop = () => {
      if (simPlaying) {
        timeAcc += 0.016 * simSpeed;
        setSimTime(Number(timeAcc.toFixed(2)));
      }

      if (autoRotate && !isDragging) {
        setRotation(prev => ({ ...prev, y: (prev.y + 0.35 * simSpeed) % 360 }));
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate, isDragging, simPlaying, simSpeed]);

  const handleMouseDown = e => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = e => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation(prev => ({
      x: Math.max(-80, Math.min(80, prev.x - dy * 0.4)),
      y: (prev.y + dx * 0.4) % 360
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = e => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(3.0, prev - e.deltaY * 0.0015)));
  };

  const resetView = () => {
    setRotation({ x: 18, y: 35 });
    setZoom(1);
    setExploded(false);
    setXrayMode(false);
  };

  const handleHotspotClick = hotspot => {
    setActiveHotspotId(hotspot.id);
    if (onSelectHotspot) onSelectHotspot(hotspot);
  };

  // ADVANCED SCIENTIFIC 3D RENDER ENGINE FOR ALL MODELS
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

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const width = canvas.width || 600;
    const height = canvas.height || 450;

    ctx.clearRect(0, 0, width, height);

    // Draw Background Grid Floor Matrix
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x < width; x += gridStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.restore();

    const cx = width / 2;
    const cy = height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);

    // Apply Y-axis pitch & X-axis rotation transformation simulation
    const radY = (rotation.y * Math.PI) / 180;
    const radX = (rotation.x * Math.PI) / 180;

    const modelId = experience?.id || 'human-heart';
    const explodeDist = exploded ? 45 : 0;

    // -------------------------------------------------------------
    // MODEL 1: RISC-V CPU SUPERSCALAR PIPELINE
    // -------------------------------------------------------------
    if (modelId.includes('cpu') || modelId.includes('pipeline')) {
      ctx.shadowColor = xrayMode ? '#38bdf8' : '#6366f1';
      ctx.shadowBlur = xrayMode ? 25 : 12;

      const stages = [
        { code: 'IF', name: 'Fetch', color: '#3b82f6' },
        { code: 'ID', name: 'Decode', color: '#06b6d4' },
        { code: 'EX', name: 'Execute', color: '#f59e0b' },
        { code: 'MEM', name: 'Memory', color: '#10b981' },
        { code: 'WB', name: 'Writeback', color: '#a855f7' }
      ];
      const stageW = compact ? 70 : 85;
      const gap = compact ? 8 : 14;
      const startX = -((stages.length * (stageW + gap)) / 2);

      // Render Stage Boxes
      stages.forEach((st, idx) => {
        const offset = idx >= 2 ? explodeDist : 0;
        const x = startX + idx * (stageW + gap) + offset;
        const y = -30;

        ctx.fillStyle = xrayMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(x, y, stageW, 60);
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, stageW, 60);

        ctx.fillStyle = st.color;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(st.code, x + 8, y + 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText(st.name, x + 8, y + 42);
      });

      // ALU & L1 Cache Blocks
      const aluX = -stageW / 2 + explodeDist;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fillRect(aluX - 30, 55, 110, 45);
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(aluX - 30, 55, 110, 45);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('ALU Core (64-bit)', aluX - 20, 82);

      // Instruction Packet Animation
      const packetIndex = (simTime * 2.5) % stages.length;
      const activeStageX = startX + packetIndex * (stageW + gap) + (packetIndex >= 2 ? explodeDist : 0) + stageW / 2;
      ctx.beginPath();
      ctx.arc(activeStageX, 0, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

    // -------------------------------------------------------------
    // MODEL 2: BINARY SEARCH TREE & AVL ROTATION
    // -------------------------------------------------------------
    } else if (modelId.includes('tree') && !modelId.includes('dbms')) {
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 15;

      const nodes = [
        { val: 50, x: 0, y: -90, color: '#3b82f6', bf: '0' },
        { val: 25, x: -90 - explodeDist, y: -20, color: '#06b6d4', bf: '+1' },
        { val: 75, x: 90 + explodeDist, y: -20, color: '#a855f7', bf: '0' },
        { val: 12, x: -140 - explodeDist, y: 55, color: '#10b981', bf: '0' },
        { val: 37, x: -45 - explodeDist, y: 55, color: '#10b981', bf: '0' },
        { val: 62, x: 45 + explodeDist, y: 55, color: '#f59e0b', bf: '0' },
        { val: 87, x: 140 + explodeDist, y: 55, color: '#f59e0b', bf: '0' }
      ];

      // Draw Edges
      ctx.beginPath();
      ctx.moveTo(0, -90); ctx.lineTo(-90 - explodeDist, -20);
      ctx.moveTo(0, -90); ctx.lineTo(90 + explodeDist, -20);
      ctx.moveTo(-90 - explodeDist, -20); ctx.lineTo(-140 - explodeDist, 55);
      ctx.moveTo(-90 - explodeDist, -20); ctx.lineTo(-45 - explodeDist, 55);
      ctx.moveTo(90 + explodeDist, -20); ctx.lineTo(45 + explodeDist, 55);
      ctx.moveTo(90 + explodeDist, -20); ctx.lineTo(140 + explodeDist, 55);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Render Node Spheres
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = xrayMode ? 'rgba(15, 23, 42, 0.9)' : n.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(n.val.toString(), n.x - 7, n.y + 4);

        // Balance Factor Badge
        ctx.fillStyle = '#fbbf24';
        ctx.font = '800 9px Inter, sans-serif';
        ctx.fillText(`BF:${n.bf}`, n.x - 12, n.y - 24);
      });

    // -------------------------------------------------------------
    // MODEL 3: DATABASE B+ TREE INDEX ARCHITECTURE
    // -------------------------------------------------------------
    } else if (modelId.includes('dbms') || modelId.includes('btree')) {
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 15;

      // Root Page
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.fillRect(-80, -105, 160, 38);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(-80, -105, 160, 38);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('Root Page [10 | 50 | 90]', -65, -81);

      // Branch Lines
      ctx.beginPath();
      ctx.moveTo(0, -67); ctx.lineTo(-120 - explodeDist, -25);
      ctx.moveTo(0, -67); ctx.lineTo(0, -25);
      ctx.moveTo(0, -67); ctx.lineTo(120 + explodeDist, -25);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Leaf Data Pages
      const leafX = [-140 - explodeDist, -45, 45, 140 + explodeDist];
      leafX.forEach((lx, i) => {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(lx - 35, -25, 70, 45);
        ctx.strokeStyle = '#10b981';
        ctx.strokeRect(lx - 35, -25, 70, 45);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(`Leaf Page ${i + 1}`, lx - 28, 0);
      });

      // Linked List Chain
      ctx.beginPath();
      ctx.moveTo(-140 - explodeDist + 35, -2);
      ctx.lineTo(140 + explodeDist - 35, -2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

    // -------------------------------------------------------------
    // MODEL 4: QUANTUM BLOCH SPHERE GEOMETRY
    // -------------------------------------------------------------
    } else if (modelId.includes('bloch') || modelId.includes('quantum')) {
      const theta = ((paramValues['Theta (θ)'] || 90) * Math.PI) / 180;
      const phi = ((paramValues['Phi (φ)'] || 45) * Math.PI) / 180;

      const r = 90;
      // 3D Bloch Sphere Outline
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = xrayMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.6)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Equatorial Ring
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.stroke();

      // Z-Axis
      ctx.beginPath(); ctx.moveTo(0, -r - 15); ctx.lineTo(0, r + 15);
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('|0⟩ (Z+)', -15, -r - 20);
      ctx.fillText('|1⟩ (Z-)', -15, r + 25);

      // State Vector Pointer |ψ⟩
      const px = r * Math.sin(theta) * Math.cos(phi);
      const py = -r * Math.cos(theta);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(px, py);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('|ψ⟩', px + 10, py);

    // -------------------------------------------------------------
    // MODEL 5: CONVEX LENS OPTICS RAY TRACING
    // -------------------------------------------------------------
    } else if (modelId.includes('optics') || modelId.includes('lens')) {
      const f = paramValues['Focal Length (f)'] || 15;
      const u = paramValues['Object Distance (u)'] || 30;

      // Principal Axis
      ctx.beginPath(); ctx.moveTo(-220, 0); ctx.lineTo(220, 0);
      ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5; ctx.stroke();

      // Convex Lens Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 90, 0, 0, Math.PI * 2);
      ctx.fillStyle = xrayMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(6, 182, 212, 0.45)';
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Focal Points (F1, F2)
      const focalPx = f * 4;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(-focalPx, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(focalPx, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('F1', -focalPx - 8, 18);
      ctx.fillText('F2', focalPx - 6, 18);

      // Object Arrow
      const objPx = Math.min(180, u * 4);
      ctx.beginPath(); ctx.moveTo(-objPx, 0); ctx.lineTo(-objPx, -50);
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#10b981'; ctx.fillText('Object', -objPx - 15, -58);

      // Incident & Refracted Light Rays
      ctx.beginPath();
      ctx.moveTo(-objPx, -50); ctx.lineTo(0, -50); ctx.lineTo(focalPx * 1.8, 40);
      ctx.moveTo(-objPx, -50); ctx.lineTo(0, 0); ctx.lineTo(focalPx * 1.8, 60);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.stroke();

    // -------------------------------------------------------------
    // MODEL 6: BOHR CARBON ATOM & ORBITAL SHELLS
    // -------------------------------------------------------------
    } else if (modelId.includes('atom') || modelId.includes('bohr')) {
      // Dense Nucleus
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = xrayMode ? 'rgba(239, 68, 68, 0.4)' : '#ef4444';
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('6P 6N', -14, 4);

      // Orbit K-Shell
      ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.stroke();

      // K Electrons
      const eK1 = simTime * 2;
      [eK1, eK1 + Math.PI].forEach(ang => {
        ctx.beginPath(); ctx.arc(Math.cos(ang) * 60, Math.sin(ang) * 60, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8'; ctx.fill();
      });

      // Orbit L-Shell
      ctx.beginPath(); ctx.arc(0, 0, 110 + explodeDist, 0, Math.PI * 2);
      ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5; ctx.stroke();

      // L Valence Electrons
      const eL1 = simTime * 1.2;
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(ang => {
        const lx = Math.cos(ang + eL1) * (110 + explodeDist);
        const ly = Math.sin(ang + eL1) * (110 + explodeDist);
        ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#a855f7'; ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
      });

    // -------------------------------------------------------------
    // MODEL 7: SOLENOID ELECTROMAGNETIC FIELD
    // -------------------------------------------------------------
    } else if (modelId.includes('solenoid') || modelId.includes('magnet')) {
      const current = paramValues['Current (I)'] || 3.5;

      // Iron Core
      ctx.fillStyle = 'rgba(100, 116, 139, 0.8)';
      ctx.fillRect(-140, -18, 280, 36);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(-140, -18, 280, 36);

      // Coil Helical Turns
      const turns = 10;
      const turnStep = 260 / turns;
      for (let i = 0; i < turns; i++) {
        const tx = -130 + i * turnStep;
        ctx.beginPath();
        ctx.ellipse(tx, 0, 8, 30, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3.5; ctx.stroke();
      }

      // Magnetic Field Vectors Animation
      const fluxAlpha = Math.min(0.9, current * 0.15);
      [-40, -25, 25, 40].forEach(yOff => {
        ctx.beginPath(); ctx.moveTo(-180, yOff); ctx.lineTo(180, yOff);
        ctx.strokeStyle = `rgba(56, 189, 248, ${fluxAlpha})`; ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
      });

    // -------------------------------------------------------------
    // MODEL 8: MICROSERVICES & SYSTEM DESIGN CLOUD
    // -------------------------------------------------------------
    } else if (modelId.includes('microservices') || modelId.includes('system')) {
      ctx.shadowColor = '#10b981'; ctx.shadowBlur = 15;

      // NGINX LB
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)'; ctx.fillRect(-170 - explodeDist, -40, 65, 80);
      ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.strokeRect(-170 - explodeDist, -40, 65, 80);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('NGINX LB', -163 - explodeDist, 5);

      // API Gateway
      ctx.fillStyle = 'rgba(99, 102, 241, 0.4)'; ctx.fillRect(-60, -40, 70, 80);
      ctx.strokeStyle = '#6366f1'; ctx.strokeRect(-60, -40, 70, 80);
      ctx.fillStyle = '#ffffff'; ctx.fillText('API Gateway', -56, 5);

      // Redis & Microservice
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)'; ctx.fillRect(60 + explodeDist, -75, 85, 50);
      ctx.fillRect(60 + explodeDist, 25, 85, 50);
      ctx.strokeStyle = '#10b981'; ctx.strokeRect(60 + explodeDist, -75, 85, 50);
      ctx.strokeRect(60 + explodeDist, 25, 85, 50);

      ctx.fillStyle = '#ffffff';
      ctx.fillText('Redis Cache', 66 + explodeDist, -45);
      ctx.fillText('Auth Service', 66 + explodeDist, 55);

      // Request Flow Animation Particles
      const pTime = (simTime * 140) % 240;
      ctx.beginPath(); ctx.arc(-170 - explodeDist + pTime, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;

    // -------------------------------------------------------------
    // MODEL 9: HUMAN HEART ANATOMY (DEFAULT / FALLBACK)
    // -------------------------------------------------------------
    } else {
      ctx.shadowColor = xrayMode ? '#38bdf8' : '#f43f5e';
      ctx.shadowBlur = xrayMode ? 25 : 15;

      const heartRate = paramValues['Heart Rate'] || 72;
      const pulseFreq = (heartRate / 60) * Math.PI * 2;
      const pulseR = 75 + Math.sin(simTime * pulseFreq) * 5;

      // Heart Muscle Base
      ctx.beginPath(); ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = xrayMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(225, 29, 72, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();

      // Aorta Trunk
      ctx.beginPath(); ctx.arc(-explodeDist, -65 - explodeDist, 32, Math.PI, 0);
      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 14; ctx.stroke();

      // Coronary Arteries Pulse
      ctx.beginPath(); ctx.arc(0, 0, pulseR + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)'; ctx.lineWidth = 2; ctx.stroke();
    }

    ctx.restore();

    return () => {
      resizeObserver.disconnect();
    };
  }, [rotation, zoom, exploded, xrayMode, simTime, experience, paramValues, isLight, compact]);

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
      style={{
        position: 'relative',
        width: '100%',
        height: compact ? '420px' : '650px',
        background: isLight
          ? 'radial-gradient(circle at center, #0f172a 0%, #050814 100%)'
          : 'radial-gradient(circle at center, #0f172a 0%, #050814 100%)',
        borderRadius: '20px',
        border: isLight ? '1.5px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(56, 189, 248, 0.35)',
        overflow: 'hidden',
        boxShadow: isLight ? '0 15px 45px rgba(100, 130, 200, 0.2)' : '0 20px 50px rgba(0, 0, 0, 0.6)',
        transition: 'all 0.3s ease'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }} />

      {/* Hotspots Overlay Buttons */}
      {showLabels && experience?.hotspots?.map(h => (
        <button
          key={h.id}
          onClick={() => handleHotspotClick(h)}
          style={{
            position: 'absolute',
            left: `${h.x}%`,
            top: `${h.y}%`,
            transform: 'translate(-50%, -50%)',
            background: activeHotspotId === h.id
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : (isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.88)'),
            color: activeHotspotId === h.id ? '#ffffff' : (isLight ? '#0f172a' : '#ffffff'),
            border: activeHotspotId === h.id
              ? '2px solid #ffffff'
              : (isLight ? '1.5px solid #0284c7' : '1px solid #38bdf8'),
            padding: compact ? '4px 8px' : '6px 12px',
            borderRadius: '20px',
            fontSize: compact ? '0.70rem' : '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0284c7' }} />
          <span>{h.name}</span>
        </button>
      ))}

      {/* Top Left Telemetry HUD */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(5, 8, 20, 0.8)',
          border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(56, 189, 248, 0.3)',
          padding: '8px 12px',
          borderRadius: '10px',
          fontSize: '0.74rem',
          color: isLight ? '#334155' : '#94a3b8',
          zIndex: 15,
          fontWeight: 600,
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{ color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Compass size={13} /> Live XR Telemetry
        </div>
        <div>Sim Time: {simTime}s</div>
        <div>Angles: X:{Math.round(rotation.x)}° Y:{Math.round(rotation.y)}°</div>
        <div>Zoom: {zoom.toFixed(2)}x</div>
      </div>

      {/* Formula & Scientific Equation Overlay */}
      {showFormula && experience?.formula && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '6px 16px',
            borderRadius: '20px',
            color: '#38bdf8',
            fontSize: '0.78rem',
            fontWeight: 800,
            zIndex: 15,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            letterSpacing: '0.5px'
          }}
        >
          {experience.formula}
        </div>
      )}

      {/* Bottom Floating Control Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
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
          {simPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => setSimSpeed(s => (s === 1 ? 2 : s === 2 ? 0.5 : 1))} style={buttonStyle}>
          <FastForward size={14} /> {simSpeed}x
        </button>
        <div style={{ width: '1px', height: '16px', background: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }} />
        <button onClick={() => setAutoRotate(!autoRotate)} style={{ ...buttonStyle, color: autoRotate ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#64748b' : '#94a3b8') }}>
          <RotateCw size={14} /> Auto
        </button>
        <button onClick={() => setExploded(!exploded)} style={{ ...buttonStyle, color: exploded ? '#d97706' : (isLight ? '#64748b' : '#94a3b8') }}>
          <Layers size={14} /> Explode
        </button>
        <button onClick={() => setXrayMode(!xrayMode)} style={{ ...buttonStyle, color: xrayMode ? '#7c3aed' : (isLight ? '#64748b' : '#94a3b8') }}>
          <Eye size={14} /> X-Ray
        </button>
        <button onClick={resetView} style={buttonStyle}>
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Active Hotspot Inspector Panel */}
      {activeHotspot && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            maxWidth: '280px',
            background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.94)',
            border: isLight ? '1.5px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            padding: '12px 14px',
            backdropFilter: 'blur(16px)',
            color: isLight ? '#0f172a' : '#fff',
            zIndex: 25,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h4 style={{ margin: 0, color: isLight ? '#0284c7' : '#38bdf8', fontSize: '0.90rem', fontWeight: 800 }}>{activeHotspot.name}</h4>
            <button onClick={() => setActiveHotspotId(null)} style={{ background: 'none', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
          <p style={{ fontSize: '0.78rem', color: isLight ? '#334155' : '#cbd5e1', margin: '0 0 8px 0', lineHeight: 1.35 }}>{activeHotspot.description}</p>
          {onAskSage && (
            <button
              onClick={() => onAskSage(`Explain the role of ${activeHotspot.name} in ${experience?.name}`)}
              style={{
                width: '100%',
                padding: '6px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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

export default XR3DViewer;
