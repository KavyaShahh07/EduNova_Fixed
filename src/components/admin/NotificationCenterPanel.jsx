import React, { useState, useEffect } from 'react';
import { Bell, Megaphone, Send, CheckCircle2, Clock, Plus, RefreshCw, Users } from 'lucide-react';
import { adminApi } from '../../lib/apiClient';

export function NotificationCenterPanel() {
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Announcement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getNotificationStats();
      setStats(res.data.stats || null);
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      setError(err.message || 'Failed to load notification statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    setSending(true);
    try {
      await adminApi.createAnnouncement({ title, message, audience });
      setIsModalOpen(false);
      setTitle('');
      setMessage('');
      setAudience('ALL');
      fetchData();
    } catch (err) {
      alert(err.message || 'Could not send system announcement');
    } finally {
      setSending(false);
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
            <Bell style={{ color: 'var(--accent-primary)' }} size={22} />
            Platform Notification & Announcement Center
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Monitor real system notification activity and broadcast targeted announcements across user cohorts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Create Announcement
          </button>
          <button
            onClick={fetchData}
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
      </div>

      {/* Dynamic Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Total In-App Notifications</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
            {stats?.totalInAppNotifications ?? 0}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>Delivered Notifications</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: '#10b981' }}>
            {stats?.deliveredNotifications ?? 0}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}>System Announcements</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: 'var(--accent-primary)' }}>
            {stats?.totalAnnouncements ?? 0}
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600 }}>Email Notification Service</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px', color: stats?.emailServiceStatus === 'Operational' ? '#10b981' : '#f59e0b' }}>
            {stats?.emailServiceStatus || 'Operational'}
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Megaphone size={18} style={{ color: 'var(--accent-primary)' }} />
          Recent Broadcast System Announcements
        </h4>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No platform announcements created yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.map((anc) => (
              <div key={anc.id} style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(59,130,246,0.15)',
                      color: '#3b82f6',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      Audience: {anc.audience}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Sent on {new Date(anc.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h5 style={{ margin: '4px 0', fontSize: '0.95rem' }}>{anc.title}</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{anc.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {isModalOpen && (
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
          <form onSubmit={handleCreateAnnouncement} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Create System Announcement</h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Announcement Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled System Maintenance Notice"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Target Audience Cohort
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="ALL">All Platform Users</option>
                <option value="SCHOOL">School Students</option>
                <option value="COLLEGE">College Students</option>
                <option value="SKILLS">Skills & Career Learners</option>
                <option value="EXAM">Competitive Exam Prep</option>
                <option value="PARENTS">Parents Portal</option>
                <option value="INSTRUCTORS">Instructors & Mentors</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Message Content
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the broadcast message body..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={14} /> Send Broadcast
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
