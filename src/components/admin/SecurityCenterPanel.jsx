import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Filter, Search, RefreshCw, AlertTriangle, Lock, Key, UserX, Clock } from 'lucide-react';
import { adminApi } from '../../lib/apiClient';

export function SecurityCenterPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');

  const fetchSecurityEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        search: search || undefined,
        eventType: eventType !== 'ALL' ? eventType : undefined,
        severity: severity !== 'ALL' ? severity : undefined,
      };
      const res = await adminApi.getSecurityEvents(params);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load security event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, [page, eventType, severity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSecurityEvents();
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>CRITICAL</span>;
      case 'WARNING':
      case 'HIGH':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700 }}>WARNING</span>;
      default:
        return <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700 }}>INFO</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
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
            <ShieldAlert style={{ color: 'var(--accent-primary)' }} size={22} />
            Security & Authentication Audit Center
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Monitor real-time security events, failed logins, OTP verification attempts, and session revocations.
          </p>
        </div>
        <button
          onClick={fetchSecurityEvents}
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

      {/* Dynamic Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total Login Attempts (24h)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
            {data?.summary?.totalAttempts24h ?? 0}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>Failed Logins (24h)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: '#ef4444' }}>
            {data?.summary?.failedLogins24h ?? 0}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>OTP Failures</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: '#f59e0b' }}>
            {data?.summary?.otpFailures24h ?? 0}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>2FA Verified Events</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: '#10b981' }}>
            {data?.summary?.tfaEvents24h ?? 0}
          </div>
        </div>
      </div>

      {/* Filters Form */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search user, email, IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <button type="submit" style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontWeight: 600 }}>
            Search
          </button>
        </form>

        <select
          value={eventType}
          onChange={(e) => { setEventType(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="ALL">All Event Types</option>
          <option value="LOGIN_FAILED">Failed Login</option>
          <option value="LOGIN_SUCCESS">Successful Login</option>
          <option value="OTP_FAILURE">OTP Failure</option>
          <option value="PASSWORD_RESET">Password Reset</option>
          <option value="ACCOUNT_LOCKOUT">Account Lockout</option>
        </select>

        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="ALL">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* Events Table / State */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading security audit logs...</div>
      ) : error ? (
        <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{error}</div>
      ) : data?.events?.length === 0 ? (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <ShieldCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>No security events recorded</h4>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem' }}>No events matched your search parameters.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px' }}>Event Type</th>
                  <th style={{ padding: '12px 16px' }}>Target User</th>
                  <th style={{ padding: '12px 16px' }}>IP Address</th>
                  <th style={{ padding: '12px 16px' }}>Severity</th>
                  <th style={{ padding: '12px 16px' }}>Details / Status</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((evt) => (
                  <tr key={evt.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whitespace: 'nowrap' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {evt.eventType}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {evt.userEmail || evt.userId || 'Guest'}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                      {evt.ipAddress || '127.0.0.1'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {getSeverityBadge(evt.severity)}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {evt.details || (evt.success ? 'Success' : 'Failed')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Page {data.page} of {data.totalPages} ({data.total} total records)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: page >= data.totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
