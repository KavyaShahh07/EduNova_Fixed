import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Glasses, Brain, Flame, Clock, Award, Target, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { analyticsApi, subjectApi } from '../../lib/apiClient';
import { MySubjectsWidget } from './MySubjectsWidget';
import { DashboardNotesWidget } from './widgets/DashboardNotesWidget';
import { InteractiveARSpatialLabWidget } from '../xr/InteractiveARSpatialLabWidget';
import { useDynamicGreeting } from '../../hooks/useDynamicGreeting';
import { useTheme } from '../../context/ThemeContext';
import { subjectService } from '../../services/subjectService';

export const SchoolDashboard = ({ learner }) => {
  const navigate = useNavigate();
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [overview, setOverview] = useState(null);
  const [subjects, setSubjects] = useState(() => subjectService.getSelectedSubjects('school'));
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
            const schoolSubs = subjectsRes.value.data.filter(s => {
              const type = (s.subject?.educationType || s.educationType || '').toLowerCase();
              return !type || type === 'school';
            });
            if (schoolSubs.length > 0) {
              setSubjects(schoolSubs);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load school dashboard analytics:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const streakDays = overview?.learner?.streakDays ?? learner?.streakDays ?? 0;
  const level = overview?.learner?.level ?? learner?.level ?? 1;
  const xp = overview?.learner?.xp ?? learner?.xp ?? 0;
  const board = learner?.education?.board || learner?.board || 'CBSE Class 10';
  const userName = learner?.name?.split(' ')[0] || 'Learner';
  const dynamicGreeting = useDynamicGreeting(userName);

  const completedHours = overview?.studyHours?.completedHours || 0;
  const plannedHours = overview?.studyHours?.plannedHours || 0;
  const overallAccuracy = overview?.assessmentSummary?.overallAccuracy || '82%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        background: isLight
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(235, 248, 255, 0.90) 100%)'
          : 'linear-gradient(135deg, rgba(12, 30, 60, 0.85) 0%, rgba(14, 18, 45, 0.92) 100%)',
        borderRadius: '26px',
        border: isLight ? '1.5px solid rgba(6, 182, 212, 0.35)' : '1.5px solid rgba(6, 182, 212, 0.35)',
        padding: '28px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: isLight
          ? '0 16px 45px rgba(6, 182, 212, 0.12), inset 0 1.5px 2px rgba(255, 255, 255, 0.9)'
          : '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 1.5px rgba(6, 182, 212, 0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(6, 182, 212, 0.2)',
              color: isLight ? '#0284c7' : '#38bdf8',
              border: '1px solid rgba(6, 182, 212, 0.4)'
            }}>
              🏫 {board} Curriculum Track
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
            {dynamicGreeting.title}
          </h1>
          <p style={{ color: isLight ? '#475569' : '#cbd5e1', fontSize: '0.94rem', margin: '6px 0 0', maxWidth: '640px', lineHeight: 1.5 }}>
            {dynamicGreeting.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button onClick={() => navigate('/ai-assistant', { state: { initialPrompt: 'Explain how to solve quadratic equations using the discriminant formula' } })} style={{ background: 'linear-gradient(135deg, #0284c7, #6366f1)' }}>
            <Brain size={16} /> Consult Sage AI Tutor
          </Button>
          <button
            onClick={() => navigate('/xr-studio')}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.18)',
              color: isLight ? '#0f172a' : '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}
          >
            🥽 Launch 3D Lab
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
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
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="#06b6d4" />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Study Time</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff' }}>{completedHours}h completed</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={20} color="#10b981" />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Quiz Accuracy</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981' }}>{overallAccuracy}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={20} color="#f59e0b" />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Study Streak</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f59e0b' }}>{streakDays} Days</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} color="#a855f7" />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Level & XP</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#a855f7' }}>Lvl {level} ({xp} XP)</div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '22px' }}>
        {/* Left Column (8 Cols) */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '22px' }} className="col-span-12">
          
          {/* Enrolled Subjects & Syllabus Progress Widget */}
          <MySubjectsWidget trackType="school" customSubjects={subjects} title="School Curriculum Subjects" />

          {/* Dynamic Interactive 3D AR & Spatial Science Lab Widget */}
          <InteractiveARSpatialLabWidget trackType="school" title="School Science & Physics 3D Spatial Lab" />
        </div>

        {/* Right Column (4 Cols) */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '22px' }} className="col-span-12">
          
          {/* Quick Notes & Annotations Widget */}
          <DashboardNotesWidget />

          {/* Study Goal Progress Widget */}
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
              Class 10 Syllabus Study Time
            </h4>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff' }}>
              {completedHours}h <span style={{ fontSize: '1rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 600 }}>completed</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: isLight ? '#475569' : '#cbd5e1', marginTop: '8px', lineHeight: 1.5 }}>
              {plannedHours > 0 ? `${plannedHours}h planned in your weekly study schedule.` : 'Schedule your daily focus blocks to maintain your streak.'}
            </p>
            <Button size="sm" onClick={() => navigate('/study-planner')} style={{ width: '100%', marginTop: '14px', background: 'linear-gradient(135deg, #0284c7, #6366f1)' }}>
              Open Study Planner <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;
