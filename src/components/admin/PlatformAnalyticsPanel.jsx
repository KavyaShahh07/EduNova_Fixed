import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Clock, Award, BookOpen, Zap, Target, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { adminApi } from '../../lib/apiClient';
import { useTheme } from '../../context/ThemeContext';

export const PlatformAnalyticsPanel = () => {
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPlatformAnalytics({ period });
      setData(res?.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const panelStyle = {
    background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
    border: isLight ? '1.5px solid rgba(210, 230, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: isLight ? '0 10px 30px rgba(50, 90, 160, 0.08)' : '0 10px 30px rgba(0, 0, 0, 0.4)'
  };

  const userAct = data?.userActivity || {};
  const learnAct = data?.learningActivity || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Date Filter */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: isLight ? '#0f172a' : '#ffffff' }}>
            <TrendingUp size={22} color="#6366f1" /> Platform Analytics & Learning Telemetry
          </h2>
          <p style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Aggregated PostgreSQL metrics for student engagements, study duration, quiz accuracy, and track trends.
          </p>
        </div>

        {/* Date Period Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '12px', border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.1)' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: 'all', label: 'All Time' }
          ].map(p => {
            const isActive = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: isActive ? 'var(--accent-primary, #6366f1)' : 'transparent',
                  color: isActive ? '#ffffff' : (isLight ? '#475569' : '#cbd5e1'),
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.86rem' }}>
          {error}
        </div>
      )}

      {/* User Activity Metric Cards */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 12px', color: isLight ? '#0f172a' : '#ffffff' }}>
          User & Identity Metrics ({period})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div style={panelStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Total Users</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', marginTop: '4px' }}>{userAct.totalUsers ?? '--'}</div>
            <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Registered Accounts</div>
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Active Accounts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>{userAct.activeUsers ?? '--'}</div>
            <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Status ACTIVE</div>
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>New Signups</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{userAct.newUsers ?? '--'}</div>
            <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Created in selected range</div>
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Onboarding Rate</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#a855f7', marginTop: '4px' }}>{userAct.onboardingCompletionRate !== undefined ? `${userAct.onboardingCompletionRate}%` : '--'}</div>
            <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Profiles Complete</div>
          </div>
        </div>
      </div>

      {/* Learning Activity Metric Cards */}
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 12px', color: isLight ? '#0f172a' : '#ffffff' }}>
          Learning & Quiz Engagement
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div style={panelStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Total Study Hours</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#6366f1', marginTop: '4px' }}>{learnAct.totalStudyHours ?? '0.0'} hrs</div>
            <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Recorded sessions</div>
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Quiz Attempts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>{learnAct.quizAttemptsCount ?? 0}</div>
            <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Completed quizzes</div>
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Avg Quiz Accuracy</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{learnAct.avgQuizAccuracy !== undefined ? `${learnAct.avgQuizAccuracy}%` : '0%'}</div>
            <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Passing ratio</div>
          </div>
          <div style={panelStyle}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Total XP Awarded</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ec4899', marginTop: '4px' }}>{learnAct.totalXpEarned ?? 0} XP</div>
            <div style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Gamification rewards</div>
          </div>
        </div>
      </div>

      {/* Empty State Banner if 0 sessions recorded */}
      {learnAct.studySessionsCount === 0 && (
        <div style={{ ...panelStyle, textAlign: 'center', padding: '24px', color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.86rem' }}>
          <AlertCircle size={20} style={{ marginBottom: '6px' }} />
          <div>No learning study sessions recorded for the selected range ({period}).</div>
        </div>
      )}
    </div>
  );
};

export default PlatformAnalyticsPanel;
