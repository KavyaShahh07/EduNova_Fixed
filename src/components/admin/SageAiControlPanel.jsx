import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Cpu, RefreshCw, Zap, CheckCircle2, AlertTriangle, Shield, Activity, FileText } from 'lucide-react';
import { adminApi } from '../../lib/apiClient';
import { useTheme } from '../../context/ThemeContext';

export const SageAiControlPanel = () => {
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAiStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSageAiControlStatus();
      setAiData(res?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to query Sage AI control metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAiStatus();
  }, []);

  const panelStyle = {
    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
    border: isLight ? '1.5px solid rgba(210, 230, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: isLight ? '0 10px 30px rgba(50, 90, 160, 0.08)' : '0 10px 30px rgba(0, 0, 0, 0.4)'
  };

  const isConnected = aiData?.healthStatus === 'CONNECTED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: isLight ? '#0f172a' : '#ffffff' }}>
            <Bot size={22} color="#10b981" /> Sage AI Neural Control Center
          </h2>
          <p style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Monitor 24/7 AI tutoring engine health, model routing, request volume, and token performance.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAiStatus}
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
          {loading ? 'Polling AI State...' : 'Refresh AI Status'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.86rem' }}>
          {error}
        </div>
      )}

      {/* AI Health & Model Configuration Card */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: isConnected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
            border: `1.5px solid ${isConnected ? '#10b981' : '#f59e0b'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isConnected ? '#10b981' : '#f59e0b'
          }}>
            <Sparkles size={24} />
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>
              AI Service Health
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '2px 0 0', color: isLight ? '#0f172a' : '#ffffff' }}>
              {aiData?.statusText || (isConnected ? 'Connected & Operational' : 'AI Provider Not Configured')}
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            padding: '6px 14px',
            borderRadius: '999px',
            background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isConnected ? '#10b981' : '#ef4444',
            border: `1.5px solid ${isConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
          }}>
            ● {aiData?.healthStatus || (isConnected ? 'CONNECTED' : 'UNAVAILABLE')}
          </span>

          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: '10px',
            background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
            color: isLight ? '#334155' : '#cbd5e1',
            border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            Model: <strong>{aiData?.activeModel || 'gemini-1.5-flash'}</strong>
          </span>
        </div>
      </div>

      {/* AI Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div style={panelStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Requests Today</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>{aiData?.requestsToday ?? 0}</div>
          <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Past 24 hours</div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Requests This Week</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#6366f1', marginTop: '4px' }}>{aiData?.requestsWeek ?? 0}</div>
          <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Past 7 days</div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Active Conversations</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{aiData?.totalAiConversations ?? 0}</div>
          <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Student tutoring threads</div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Avg Response Time</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#a855f7', marginTop: '4px' }}>
            {isConnected ? `${aiData?.avgResponseTimeMs || 640} ms` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Neural inference time</div>
        </div>
      </div>
    </div>
  );
};

export default SageAiControlPanel;
