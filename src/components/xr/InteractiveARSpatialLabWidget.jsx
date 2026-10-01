import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Glasses, Sparkles, Layers, ArrowRight, Eye, RotateCw, Zap, Cpu, Atom, Activity, Database, Flame, CheckCircle2 } from 'lucide-react';
import { XR3DViewer } from './XR3DViewer';
import { getModelsByContext, XR_MODELS } from '../../data/xrModels';
import { useTheme } from '../../context/ThemeContext';

export const InteractiveARSpatialLabWidget = ({ trackType = 'school', currentSubject = '', title = '' }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);

  useEffect(() => {
    const trackModels = getModelsByContext({ educationType: trackType, subject: currentSubject });
    if (trackModels.length > 0) {
      setModels(trackModels);
      setSelectedModel(trackModels[0]);
    } else {
      const fallback = XR_MODELS.filter(m => trackType === 'school' ? m.educationTypes.includes('school') : m.id !== 'human-heart');
      setModels(fallback);
      setSelectedModel(fallback[0] || XR_MODELS[0]);
    }
  }, [trackType, currentSubject]);

  if (!selectedModel) return null;

  const getTrackColor = () => {
    switch (trackType) {
      case 'school': return { primary: '#0284c7', glow: 'rgba(6, 182, 212, 0.25)', border: 'rgba(6, 182, 212, 0.4)' };
      case 'college': return { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.25)', border: 'rgba(168, 85, 247, 0.4)' };
      case 'exam': return { primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', border: 'rgba(245, 158, 11, 0.4)' };
      case 'skills': return { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', border: 'rgba(16, 185, 129, 0.4)' };
      default: return { primary: '#0284c7', glow: 'rgba(6, 182, 212, 0.25)', border: 'rgba(6, 182, 212, 0.4)' };
    }
  };

  const themeColors = getTrackColor();

  return (
    <div
      style={{
        background: isLight
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 246, 255, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(8, 12, 28, 0.94) 100%)',
        borderRadius: '24px',
        border: isLight ? `1.5px solid ${themeColors.border}` : `1px solid ${themeColors.border}`,
        padding: '22px',
        backdropFilter: 'blur(28px)',
        boxShadow: isLight
          ? `0 12px 35px ${themeColors.glow}, inset 0 1px 2px rgba(255, 255, 255, 0.9)`
          : `0 18px 45px rgba(0, 0, 0, 0.5), inset 0 1px 1px ${themeColors.glow}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%'
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.70rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                background: themeColors.glow,
                color: themeColors.primary,
                border: `1px solid ${themeColors.border}`
              }}
            >
              ✦ Live 3D Spatial Lab
            </span>
            <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>
              {selectedModel.category} • {selectedModel.topic}
            </span>
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Glasses size={22} color={themeColors.primary} />
            {title || `Interactive 3D Spatial Module: ${selectedModel.name}`}
          </h3>
        </div>

        {/* Model Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={selectedModel.id}
            onChange={e => {
              const m = models.find(mod => mod.id === e.target.value);
              if (m) setSelectedModel(m);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              background: isLight ? 'rgba(240, 246, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
              border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(56, 189, 248, 0.3)',
              color: isLight ? '#0f172a' : '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => navigate('/xr-studio', { state: { selectedModelId: selectedModel.id } })}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${themeColors.primary}, #6366f1)`,
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: `0 4px 15px ${themeColors.glow}`
            }}
          >
            Launch Full Studio 🥽 <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Embedded Interactive 3D Canvas */}
      <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
        <XR3DViewer experience={selectedModel} compact={true} onAskSage={() => navigate('/ai-assistant', { state: { initialPrompt: `Explain ${selectedModel.name} in detail` } })} />
      </div>

      {/* Model Description & Quick Stats Footer */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: isLight ? 'rgba(240, 246, 255, 0.7)' : 'rgba(15, 23, 42, 0.6)',
          padding: '12px 16px',
          borderRadius: '14px',
          border: isLight ? '1px solid rgba(210, 225, 250, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <p style={{ fontSize: '0.84rem', color: isLight ? '#334155' : '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
            <strong style={{ color: isLight ? '#0f172a' : '#ffffff' }}>Overview: </strong>
            {selectedModel.description}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 700 }}>
            Hotspots: <strong style={{ color: themeColors.primary }}>{selectedModel.hotspots?.length || 0} Points</strong>
          </div>
          <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 700 }}>
            Explode: <strong style={{ color: '#10b981' }}>{selectedModel.hasExplodedView ? 'Available' : 'N/A'}</strong>
          </div>
          <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 700 }}>
            X-Ray: <strong style={{ color: '#a855f7' }}>{selectedModel.hasXrayView ? 'Available' : 'N/A'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveARSpatialLabWidget;
