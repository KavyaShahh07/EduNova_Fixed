import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDynamicGreeting } from '../../hooks/useDynamicGreeting';
import {
  GraduationCap,
  Brain,
  Flame,
  Clock,
  Zap,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Button } from '../common/Button';
import { analyticsApi, subjectApi } from '../../lib/apiClient';
import { MySubjectsWidget } from './MySubjectsWidget';
import { DashboardNotesWidget } from './widgets/DashboardNotesWidget';
import { InteractiveARSpatialLabWidget } from '../xr/InteractiveARSpatialLabWidget';
import { useTheme } from '../../context/ThemeContext';
import { subjectService } from '../../services/subjectService';

export const CollegeDashboard = ({ learner }) => {
  const navigate = useNavigate();
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [overview, setOverview] = useState(null);
  const [subjects, setSubjects] = useState(() => subjectService.getSelectedSubjects('college'));
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
            const collegeSubs = subjectsRes.value.data.filter(s => {
              const type = (s.subject?.educationType || s.educationType || '').toLowerCase();
              return !type || type === 'college';
            });
            if (collegeSubs.length > 0) {
              setSubjects(collegeSubs);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load college dashboard analytics:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const userName = learner?.name?.split(' ')[0] || 'Learner';
  const dynamicGreeting = useDynamicGreeting(userName);
  const degree = learner?.education?.degree || learner?.degree || 'B.Tech CSE';
  const streakDays = overview?.learner?.streakDays ?? learner?.streakDays ?? 0;
  const level = overview?.learner?.level ?? learner?.level ?? 1;
  const xp = overview?.learner?.xp ?? learner?.xp ?? 0;

  const completedHours = overview?.studyHours?.completedHours || 0;
  const overallAccuracy = overview?.assessmentSummary?.overallAccuracy || '85%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. WELCOME HERO SECTION */}
      <div style={{
        background: isLight
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(243, 232, 255, 0.88) 100%)'
          : 'linear-gradient(135deg, rgba(20, 16, 45, 0.88) 0%, rgba(12, 18, 45, 0.92) 100%)',
        borderRadius: '26px',
        border: isLight ? '1.5px solid rgba(168, 85, 247, 0.35)' : '1.5px solid rgba(168, 85, 247, 0.35)',
        padding: '28px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: isLight
          ? '0 16px 45px rgba(168, 85, 247, 0.12), inset 0 1.5px 2px rgba(255, 255, 255, 0.9)'
          : '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 1.5px rgba(168, 85, 247, 0.2)',
        position: 'relative',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: isLight ? '#7c3aed' : '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.4)'
            }}>
              🎓 {degree} Core Program
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
              background: 'rgba(56, 189, 248, 0.2)',
              color: isLight ? '#0284c7' : '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)'
            }}>
              Lvl {level} • {xp} XP
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
            {dynamicGreeting.title}
          </h1>
          <p style={{ color: isLight ? '#475569' : '#cbd5e1', fontSize: '0.94rem', margin: '6px 0 0', maxWidth: '640px', lineHeight: 1.5 }}>
            {dynamicGreeting.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2, flexWrap: 'wrap' }}>
          <Button
            onClick={() => navigate('/my-subjects')}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              boxShadow: '0 6px 20px rgba(168, 85, 247, 0.35)'
            }}
          >
            <BookOpen size={16} /> My Degree Subjects
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/ai-assistant')}
            style={{ border: isLight ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.18)' }}
          >
            <Brain size={16} color="#a855f7" /> Consult Sage AI
          </Button>
        </div>
      </div>

      {/* 2. PROGRESS METRICS BAR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        padding: '18px 22px',
        borderRadius: '24px',
        background: isLight ? 'rgba(255, 255, 255, 0.88)' : 'linear-gradient(135deg, rgba(20, 26, 55, 0.72) 0%, rgba(12, 17, 40, 0.84) 100%)',
        backdropFilter: 'blur(28px)',
        border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: isLight ? '0 10px 30px rgba(100, 130, 200, 0.1)' : '0 15px 40px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={20} color="#a855f7" />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Semester Subjects</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff' }}>{subjects.length} Active Modules</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={20} color="#f59e0b" />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Study Streak</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f59e0b' }}>{streakDays} Days</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="#10b981" />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Study Time</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981' }}>{completedHours} hrs</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#06b6d4" />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>XP & Rank</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7' }}>Lvl {level} ({xp} XP)</div>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '22px' }}>
        {/* Left Column (8 Cols) */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '22px' }} className="col-span-12">
          
          {/* Active Enrolled College Subjects Widget */}
          <MySubjectsWidget trackType="college" customSubjects={subjects} title="Degree Core Subjects" />

          {/* Dynamic Interactive 3D AR & Spatial Architecture Lab Widget */}
          <InteractiveARSpatialLabWidget trackType="college" title="College & Engineering 3D Spatial Systems Lab" />
        </div>

        {/* Right Column (4 Cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '22px' }} className="col-span-12">
          
          {/* Quick Notes & Annotations Widget */}
          <DashboardNotesWidget />

          {/* Academic Study Hours Widget */}
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
              Academic Study Hours
            </h4>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff' }}>
              {completedHours}h <span style={{ fontSize: '1rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>completed</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: isLight ? '#475569' : '#cbd5e1', marginTop: '8px', lineHeight: 1.5 }}>
              Assessment accuracy across semester courses: <strong style={{ color: '#10B981' }}>{overallAccuracy}</strong>
            </p>
            <Button size="sm" onClick={() => navigate('/study-planner')} style={{ width: '100%', marginTop: '14px', background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
              Open Study Planner <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeDashboard;
