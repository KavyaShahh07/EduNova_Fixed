import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle, XCircle, Shield, UserX, MessageSquare, Flag, RefreshCw, Eye } from 'lucide-react';
import { adminApi } from '../../lib/apiClient';

export function ModerationCenterPanel() {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getModerationReports({
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setReports(res.data.reports || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      setError(err.message || 'Failed to load moderation reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleAction = async (actionType) => {
    if (!activeReportModal) return;
    setSubmitting(true);
    try {
      await adminApi.actionModerationReport(activeReportModal.id, {
        action: actionType,
        reason: actionReason || `Admin executed ${actionType} action.`
      });
      setActiveReportModal(null);
      setActionReason('');
      fetchReports();
    } catch (err) {
      alert(err.message || 'Moderation action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Card */}
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
            <AlertOctagon style={{ color: 'var(--accent-primary)' }} size={22} />
            Moderation & Content Review Center
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Review user-flagged content, community discussions, skill exchange profiles, and execute safe moderation actions.
          </p>
        </div>
        <button
          onClick={fetchReports}
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

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>Pending Reports</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: '#f59e0b' }}>
            {summary?.pending ?? 0}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>Resolved Actions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: '#10b981' }}>
            {summary?.resolved ?? 0}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Dismissed Reports</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
            {summary?.dismissed ?? 0}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}>Total Reports</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
            {summary?.total ?? 0}
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status Filter:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem'
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {/* Moderation List / Empty State */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading moderation items...</div>
      ) : error ? (
        <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</div>
      ) : reports.length === 0 ? (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <CheckCircle size={36} style={{ margin: '0 auto 12px', color: '#10b981' }} />
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>No moderation reports found</h4>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem' }}>No user-reported content matches your active filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map((rep) => (
            <div key={rep.id} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: rep.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                    color: rep.status === 'PENDING' ? '#f59e0b' : '#10b981'
                  }}>
                    {rep.status}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Type: <strong>{rep.targetType}</strong>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Reported on {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Reason: {rep.reason}</h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Reported by: {rep.reporterName || 'Anonymous User'} | Target ID: {rep.targetId}
                </div>
              </div>
              <button
                onClick={() => setActiveReportModal(rep)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Eye size={14} /> Review Report
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {activeReportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>Review Moderation Report</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Target: <strong>{activeReportModal.targetType}</strong> ({activeReportModal.targetId})
            </p>
            <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <strong>Reported Reason:</strong> {activeReportModal.reason}
            </div>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Admin Note / Action Reason:
            </label>
            <textarea
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="State the reason for this administrative moderation decision..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAction('DISMISS')}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                Dismiss Report
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAction('WARN')}
                style={{ padding: '8px 14px', borderRadius: '8px', background: '#f59e0b', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Warn User
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleAction('SUSPEND')}
                style={{ padding: '8px 14px', borderRadius: '8px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Suspend Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
