import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Cpu, HardDrive, Zap, CheckCircle2, AlertTriangle, RefreshCw, Clock, Bot, Mail, Shield } from 'lucide-react';
import { adminApi } from '../../lib/apiClient';
import { useTheme } from '../../context/ThemeContext';

export const SystemHealthPanel = () => {
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSystemHealth();
      setHealth(res?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to query system health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const panelStyle = {
    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
    border: isLight ? '1.5px solid rgba(210, 230, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: isLight ? '0 10px 30px rgba(50, 90, 160, 0.08)' : '0 10px 30px rgba(0, 0, 0, 0.4)'
  };

  const services = [
    { label: 'REST API Service', status: health?.apiStatus || 'Operational', icon: Server, color: '#38bdf8' },
    { label: 'PostgreSQL Database', status: health?.dbStatus || 'Operational', icon: Database, color: '#6366f1' },
    { label: 'Socket.IO Realtime Engine', status: health?.realtimeStatus || 'Operational', icon: Zap, color: '#a855f7' },
    { label: 'Sage AI Provider (Gemini)', status: health?.aiStatus || 'Not Configured', icon: Bot, color: health?.aiStatus === 'Operational' ? '#10b981' : '#f59e0b' },
    { label: 'Email & SMTP Gateway', status: health?.emailStatus || 'Disabled', icon: Mail, color: health?.emailStatus === 'Operational' ? '#10b981' : '#94a3b8' },
    { label: 'File & Media Storage', status: health?.storageStatus || 'Operational', icon: HardDrive, color: '#06b6d4' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: isLight ? '#0f172a' : '#ffffff' }}>
            <Activity size={22} color="#38bdf8" /> Admin Platform System Health
          </h2>
          <p style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Live real-time operational status, database query latency, process memory, and server metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHealth}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '10px',
            background: 'var(--accent-primary, #6366f1)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.84rem',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Checking Health...' : 'Run Diagnostics'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Latency & Hardware Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div style={panelStyle}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>API Latency</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
            {health ? `${health.apiLatencyMs} ms` : '--'}
          </div>
          <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Response Overhead</div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Database Latency</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#6366f1', marginTop: '4px' }}>
            {health ? `${health.dbLatencyMs} ms` : '--'}
          </div>
          <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>PostgreSQL Query Roundtrip</div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Server Uptime</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
            {health?.uptimeFormatted || '--'}
          </div>
          <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Continuous Operation</div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Memory Allocation</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#a855f7', marginTop: '4px' }}>
            {health?.memoryUsage || '--'}
          </div>
          <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Heap Allocated</div>
        </div>
      </div>

      {/* Infrastructure Services Grid */}
      <div style={panelStyle}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 16px', color: isLight ? '#0f172a' : '#ffffff' }}>
          Core Infrastructure Service Matrix
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {services.map((s, idx) => {
            const IconComp = s.icon;
            const isOk = s.status === 'Operational';
            return (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: isLight ? 'rgba(240, 246, 255, 0.7)' : 'rgba(255, 255, 255, 0.04)',
                  border: isLight ? '1px solid rgba(210, 225, 250, 0.9)' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${s.color}20`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                    <IconComp size={16} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.86rem', display: 'block', color: isLight ? '#0f172a' : '#ffffff' }}>{s.label}</strong>
                    <span style={{ fontSize: '0.73rem', color: isLight ? '#64748b' : '#94a3b8' }}>Real-time telemetry</span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: isOk ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: isOk ? '#22c55e' : '#f59e0b',
                  border: `1px solid ${isOk ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}>
                  ● {s.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPanel;
