import React, { useState, useEffect } from 'react';
import { Sliders, ToggleLeft, ToggleRight, Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { adminApi } from '../../lib/apiClient';

export function FeatureControlPanel() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingKey, setUpdatingKey] = useState(null);

  const fetchFlags = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getFeatureFlags();
      setFlags(res.data.flags || []);
    } catch (err) {
      setError(err.message || 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (key, currentStatus, currentAudience) => {
    setUpdatingKey(key);
    try {
      await adminApi.toggleFeatureFlag({
        key,
        enabled: !currentStatus,
        audience: currentAudience
      });
      await fetchFlags();
    } catch (err) {
      alert(err.message || 'Failed to update feature flag');
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleAudienceChange = async (key, currentStatus, newAudience) => {
    setUpdatingKey(key);
    try {
      await adminApi.toggleFeatureFlag({
        key,
        enabled: currentStatus,
        audience: newAudience
      });
      await fetchFlags();
    } catch (err) {
      alert(err.message || 'Failed to update feature audience');
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders style={{ color: 'var(--accent-primary)' }} size={22} />
            Platform Feature Control & Rollout Management
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Dynamically toggle module availability and assign target cohort access level. Changes are enforced server-side.
          </p>
        </div>
        <button
          onClick={fetchFlags}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading feature configurations...</div>
      ) : error ? (
        <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {flags.map((flag) => (
            <div key={flag.key} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{flag.name}</h4>
                  <button
                    disabled={updatingKey === flag.key}
                    onClick={() => handleToggle(flag.key, flag.enabled, flag.audience)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: flag.enabled ? '#10b981' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}
                  >
                    {flag.enabled ? (
                      <>
                        <ToggleRight size={32} /> ON
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={32} /> OFF
                      </>
                    )}
                  </button>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Key: <code>{flag.key}</code>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {flag.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Audience:</span>
                <select
                  disabled={updatingKey === flag.key}
                  value={flag.audience || 'EVERYONE'}
                  onChange={(e) => handleAudienceChange(flag.key, flag.enabled, e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <option value="EVERYONE">Everyone</option>
                  <option value="SCHOOL">School</option>
                  <option value="COLLEGE">College</option>
                  <option value="SKILLS">Skills</option>
                  <option value="EXAM">Exam Prep</option>
                  <option value="PARENTS">Parents</option>
                  <option value="INSTRUCTORS">Instructors</option>
                  <option value="BETA_USERS">Beta Users Only</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
