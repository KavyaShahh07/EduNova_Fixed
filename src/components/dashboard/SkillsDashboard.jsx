import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, Rocket, ArrowRight, Brain, Sparkles, BookOpen, Flame, Clock, Award, Layers } from 'lucide-react';
import { Button } from '../common/Button';
import { analyticsApi, subjectApi } from '../../lib/apiClient';
import { MySubjectsWidget } from './MySubjectsWidget';
import { DashboardNotesWidget } from './widgets/DashboardNotesWidget';
import { InteractiveARSpatialLabWidget } from '../xr/InteractiveARSpatialLabWidget';
import { useTheme } from '../../context/ThemeContext';
import { subjectService } from '../../services/subjectService';

export const SkillsDashboard = ({ learner }) => {
  const navigate = useNavigate();
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [overview, setOverview] = useState(null);
  const [subjects, setSubjects] = useState(() => subjectService.getSelectedSubjects('skills'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [overviewRes, subjectsRes] = await Promise.allSettled([
          analyticsApi.getOverview(),
          subjectApi.getEnrolledSubjects(),
        ]);

        if (isMounted) {
          if (overviewRes.status === 'fulfilled' && overviewRes.value?.success) {
            setOverview(overviewRes.value.data);
          }
          if (subjectsRes.status === 'fulfilled' && subjectsRes.value?.success && Array.isArray(subjectsRes.value.data) && subjectsRes.value.data.length > 0) {
            const skillsSubs = subjectsRes.value.data.filter(s => {
              const type = (s.subject?.educationType || s.educationType || '').toLowerCase();
              return !type || type === 'skills';
            });
            if (skillsSubs.length > 0) {
              setSubjects(skillsSubs);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load skills dashboard analytics:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const userName = learner?.name?.split(' ')[0] || 'Learner';
  const streakDays = overview?.learner?.streakDays ?? learner?.streakDays ?? 0;
  const level = overview?.learner?.level ?? learner?.level ?? 1;
  const xp = overview?.learner?.xp ?? learner?.xp ?? 0;
  const completedHours = overview?.studyHours?.completedHours || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        background: isLight
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(236, 253, 245, 0.88) 100%)'
          : 'linear-gradient(135deg, rgba(10, 32, 28, 0.85) 0%, rgba(12, 18, 45, 0.92) 100%)',
        borderRadius: '26px',
        border: isLight ? '1.5px solid rgba(52, 211, 153, 0.35)' : '1.5px solid rgba(52, 211, 153, 0.35)',
        padding: '28px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: isLight
          ? '0 16px 45px rgba(52, 211, 153, 0.12), inset 0 1.5px 2px rgba(255, 255, 255, 0.9)'
          : '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 1.5px rgba(52, 211, 153, 0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(52, 211, 153, 0.2)',
              color: isLight ? '#059669' : '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.4)'
            }}>
              💻 Full Stack & AI Skills Track
            </span>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: isLight ? '#b45309' : '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.4)'
            }}>
              🔥 {streakDays} Day Streak
            </span>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: isLight ? '#7c3aed' : '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.4)'
            }}>
              Lvl {level} • {xp} XP
            </span>
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
            Welcome back, {userName} 👋
          </h1>
          <p style={{ color: isLight ? '#475569' : '#cbd5e1', fontSize: '0.94rem', margin: '6px 0 0', maxWidth: '640px', lineHeight: 1.5 }}>
            Master production tech, design systems, and practical industry engineering skills with live code swaps.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button onClick={() => navigate('/skill-exchange')} style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)' }}>
            Explore Peer Skill Swap <Sparkles size={16} />
          </Button>
          <button
            onClick={() => navigate('/courses')}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.18)',
              color: isLight ? '#0f172a' : '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}
          >
            Browse Skill Tracks
          </button>
        </div>
      </div>

      {/* 2. Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '22px' }}>
        {/* Left Column (8 Cols) */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '22px' }} className="col-span-12">
          
          {/* Active Skill Tracks Widget */}
          <MySubjectsWidget trackType="skills" customSubjects={subjects} title="My Skill & Career Tracks" />

          {/* Dynamic Interactive 3D AR & System Architecture Lab Widget */}
          <InteractiveARSpatialLabWidget trackType="skills" title="Cloud Microservices & Robotics 3D Lab" />
        </div>

        {/* Right Column (4 Cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '22px' }} className="col-span-12">
          
          {/* Quick Notes & Annotations Widget */}
          <DashboardNotesWidget />

          {/* Skill Building Tracker */}
          <div style={{
            background: isLight ? 'rgba(255, 255, 255, 0.88)' : 'linear-gradient(135deg, rgba(25, 32, 65, 0.72) 0%, rgba(14, 18, 45, 0.85) 100%)',
            padding: '24px',
            borderRadius: '24px',
            border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.14)',
            textAlign: 'center',
            backdropFilter: 'blur(28px)',
            boxShadow: isLight ? '0 12px 35px rgba(100, 130, 200, 0.12)' : '0 15px 40px rgba(0, 0, 0, 0.45)'
          }}>
            <h4 style={{ fontSize: '0.92rem', color: isLight ? '#64748b' : '#94a3b8', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>
              Practical Code Time
            </h4>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff' }}>
              {completedHours}h <span style={{ fontSize: '1rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>logged</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: isLight ? '#475569' : '#cbd5e1', marginTop: '8px', lineHeight: 1.5 }}>
              Active skill growth: Full Stack Web Development & Cloud DevOps containerization.
            </p>
            <Button size="sm" onClick={() => navigate('/skill-exchange')} style={{ width: '100%', marginTop: '14px', background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              Open Skill Exchange <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsDashboard;
