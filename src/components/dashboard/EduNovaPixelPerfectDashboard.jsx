import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  BookOpen,
  Flame,
  Target,
  ArrowRight,
  ArrowUpRight,
  Play,
  MoreVertical,
  Calendar,
  BarChart2,
  Atom,
  FlaskConical,
  BookMarked,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Dna,
  Users,
  Check,
  Award,
  Zap,
  Brain,
  Layers,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLearner } from '../../context/LearnerContext';
import { useLearning } from '../../context/LearningContext';
import { useSubjects } from '../../hooks/useSubjects';
import { useTheme } from '../../context/ThemeContext';
import { GlobalSearchInput } from '../common/GlobalSearchInput';
import { EduNovaHeroBanner } from '../common/EduNovaHeroBanner';
// universalSubjects removed — subjects are loaded exclusively from backend enrollments
import { SubjectCard } from '../subjects/SubjectCard';
import { InteractiveQuiz } from '../subjects/InteractiveQuiz';
import { CreateCurriculumModal } from '../courses/CreateCurriculumModal';
import { curriculumService } from '../../services/curriculumService';
import { MySubjectsWidget } from './MySubjectsWidget';
import { NotesWidget } from '../notes/NotesWidget';
import { useUserProgress } from '../../hooks/useUserProgress';
import { getDynamicAvatar } from '../../utils/avatarUtils';
import { progressService } from '../../services/progressService';
import { useDynamicGreeting } from '../../hooks/useDynamicGreeting';
import { courseApi, taskApi, analyticsApi, notificationApi, progressApi, exchangeApi } from '../../lib/apiClient';

export const EduNovaPixelPerfectDashboard = ({ initialTrackProp }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { learner, switchLearnerType, switchDemoProfile } = useLearner() || {};
  const { xp: learningXp, level: learningLevel, streakDays: learningStreak, earnXp } = useLearning() || {};
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const { selectedSubjects = [] } = useSubjects() || {};

  // Dynamic User Progress state (0% baseline for new users, updates as user learns, practices, submits assignments)
  const {
    progress: userProgress,
    learning: dynamicLearning,
    practice: dynamicPractice,
    assignments: dynamicAssignments,
    attendance: dynamicAttendance,
    recordLearning,
    recordAttendance
  } = useUserProgress();

  // State re-render trigger for dynamic subject & curriculum updates
  const [, setCurriculumTick] = useState(0);

  useEffect(() => {
    const handleCurriculumUpdate = () => setCurriculumTick(prev => prev + 1);
    window.addEventListener('edunova_curriculum_updated', handleCurriculumUpdate);
    window.addEventListener('edunova_subject_updated', handleCurriculumUpdate);
    return () => {
      window.removeEventListener('edunova_curriculum_updated', handleCurriculumUpdate);
      window.removeEventListener('edunova_subject_updated', handleCurriculumUpdate);
    };
  }, []);

  // Sync attendance with active streak
  useEffect(() => {
    if (typeof learningStreak === 'number') {
      progressService.recordAttendance(user?.id || user?.email, learningStreak);
    }
  }, [learningStreak, user?.id, user?.email]);

  // Helper for circular gauge SVG strokeDashoffset calculation (r=22 -> circumference ≈ 138)
  const getGaugeOffset = (pct) => {
    const safePct = Math.min(100, Math.max(0, Number(pct) || 0));
    return Math.round(138 - (138 * safePct / 100));
  };

  // Active track state (defaults to route prop or student's profile learnerType)
  const initialTrack = (initialTrackProp || learner?.learnerType || user?.learnerType || 'school').toLowerCase();
  const [activeTrackTab, setActiveTrackTab] = useState(initialTrack);
  const [activeQuizModal, setActiveQuizModal] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sync track when route changes
  useEffect(() => {
    if (initialTrackProp) {
      setActiveTrackTab(initialTrackProp.toLowerCase());
    }
  }, [initialTrackProp]);

  const handleTrackTabSelect = (trackKey) => {
    setActiveTrackTab(trackKey);
    if (switchLearnerType) {
      switchLearnerType(trackKey);
    }
    navigate(`/dashboard/${trackKey}`, { replace: true });
  };

  const startTopicQuiz = (subjectId, subjectName, topicName) => {
    const quizObj = {
      id: `quiz_${Date.now()}`,
      subjectId: subjectId || 'sub_gen',
      topicName: topicName || 'Diagnostic Quiz',
      subjectName: subjectName || 'General',
      mode: 'Practice',
      questions: [
        {
          id: 'q1',
          question: `Which core principle defines ${topicName || 'this topic'}?`,
          options: [
            { id: 'A', text: 'Equilibrium & Conservation Principles' },
            { id: 'B', text: 'Second-order Empirical Shift' },
            { id: 'C', text: 'Linear Vector Disruption' },
            { id: 'D', text: 'Static Noise Isolation' }
          ],
          correctOptionId: 'A',
          explanation: 'Conservation and equilibrium laws form the bedrock of fundamental problem-solving.',
          topic: topicName
        },
        {
          id: 'q2',
          question: `When executing steps in ${topicName || 'practice problems'}, what is the most important check?`,
          options: [
            { id: 'A', text: 'Verify unit dimensional consistency' },
            { id: 'B', text: 'Skip boundary condition checks' },
            { id: 'C', text: 'Randomly estimate final scalar values' },
            { id: 'D', text: 'Ignore zero-division cases' }
          ],
          correctOptionId: 'A',
          explanation: 'Dimensional consistency ensures physical and mathematical validity across calculations.',
          topic: topicName
        },
        {
          id: 'q3',
          question: `What is the diagnostic benchmark for ${topicName || 'mastery'}?`,
          options: [
            { id: 'A', text: 'Accuracy above 85% with steady speed' },
            { id: 'B', text: 'Memorization of textbook paragraph headers' },
            { id: 'C', text: 'Time spent reviewing solution keys' },
            { id: 'D', text: 'Number of repeated attempts' }
          ],
          correctOptionId: 'A',
          explanation: 'Fluency is marked by high first-attempt accuracy and efficient resolution time.',
          topic: topicName
        }
      ]
    };
    setActiveQuizModal(quizObj);
  };


  // Dynamically filter subjects according to active track tab & custom user curriculums
  const trackSubjects = curriculumService.getCurriculumSubjects({ learnerType: activeTrackTab, userProgress });

  const displaySubjects = Array.isArray(selectedSubjects) && selectedSubjects.length > 0
    ? selectedSubjects
    : (trackSubjects.length > 0 ? trackSubjects : []);

  const activeSubject = displaySubjects[0] || null;
  const isSubjectInProgress = Boolean(activeSubject && typeof activeSubject.progress === 'number' && activeSubject.progress > 0);

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [dbTasks, setDbTasks] = useState([]);
  const [dbStudySessions, setDbStudySessions] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dbExchanges, setDbExchanges] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [coursesRes, tasksRes, sessionsRes, notifsRes, exchangesRes] = await Promise.allSettled([
          courseApi.getMyEnrolled(),
          taskApi.getTasks({ limit: 20 }),
          analyticsApi.getStudySessions({ limit: 10 }),
          notificationApi.getNotifications({ limit: 10 }),
          exchangeApi.getExchanges({ limit: 5 }),
        ]);

        if (!isMounted) return;

        if (coursesRes.status === 'fulfilled' && coursesRes.value?.success && Array.isArray(coursesRes.value.data)) {
          setEnrolledCourses(coursesRes.value.data);
        }

        if (tasksRes.status === 'fulfilled' && tasksRes.value?.success && Array.isArray(tasksRes.value.data)) {
          setDbTasks(tasksRes.value.data);
        }

        if (sessionsRes.status === 'fulfilled' && sessionsRes.value?.success && Array.isArray(sessionsRes.value.data)) {
          setDbStudySessions(sessionsRes.value.data);
        }

        if (notifsRes.status === 'fulfilled' && notifsRes.value?.success && Array.isArray(notifsRes.value.data)) {
          const list = notifsRes.value.data;
          setNotificationsList(list);
          setUnreadCount(list.filter(n => !n.isRead && !n.read).length);
        }

        if (exchangesRes.status === 'fulfilled' && exchangesRes.value?.success && Array.isArray(exchangesRes.value.data)) {
          setDbExchanges(exchangesRes.value.data);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, [user?.id]);

  const activeCourseProgress = enrolledCourses.length > 0
    ? (enrolledCourses.find(ec => (ec.course?.category || '').toLowerCase() === activeTrackTab.toLowerCase()) || enrolledCourses[0])
    : null;

  const activeCourse = activeCourseProgress ? {
    id: activeCourseProgress.course?.id || activeCourseProgress.courseId,
    title: activeCourseProgress.course?.title || 'Enrolled Course',
    subtitle: `${activeCourseProgress.course?.category || 'Education'} • ${activeCourseProgress.course?.instructor?.name || 'EduNova'}`,
    image: activeCourseProgress.course?.thumbnailUrl || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=300&q=80',
    progress: activeCourseProgress.progress || 0,
    lessonsDone: (activeCourseProgress.completedModuleIds || []).length,
    totalLessons: activeCourseProgress.course?.modules?.length || (activeCourseProgress.completedModuleIds || []).length || 1,
    isContinue: (activeCourseProgress.progress || 0) > 0,
  } : null;

  const todaysSchedule = dbStudySessions.map(session => ({
    time: session.plannedDate ? new Date(session.plannedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible',
    title: session.subject?.name ? `${session.subject.name} Study Session` : (session.topic || 'Study Session'),
    color: '#38bdf8',
    status: session.isCompleted ? 'Completed' : 'Scheduled',
    action: () => navigate('/study-planner')
  }));

  const [searchQuery, setSearchQuery] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  // Header Dropdown Interactive States
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const headerControlsRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerControlsRef.current && !headerControlsRef.current.contains(event.target)) {
        setShowNotificationsMenu(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
    } catch (e) {
      // non-blocking
    }
    setNotificationsList(prev => prev.map(item => ({ ...item, isRead: true, unread: false })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    try {
      setShowProfileMenu(false);
      if (logout) await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  const userName = learner?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Learner';
  const fullName = learner?.name || user?.name || 'EduNova Learner';
  const dynamicGreeting = useDynamicGreeting(userName);
  const userAvatar = getDynamicAvatar(user || learner, fullName);
  const xp = learner?.xp ?? learningXp ?? user?.xp ?? 0;
  const level = learner?.level ?? learningLevel ?? user?.level ?? 1;
  const streak = learner?.streakDays ?? learningStreak ?? user?.streakDays ?? 0;
  const goalsCount = Array.isArray(learner?.goals) ? learner.goals.length : 0;

  const handlePromptClick = (text) => {
    navigate('/ai-assistant', { state: { initialPrompt: text } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '0 4px 40px 4px' }}>
      
      {/* DASHBOARD MAIN GRID */}
      <div className="edunova-responsive-dashboard-grid">
        
        {/* LEFT & CENTER COLUMN (MAIN CONTENT) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* A. HERO WELCOME BANNER WITH 3D GLASS ORB */}
          <EduNovaHeroBanner
            title={dynamicGreeting.title}
            subtitle={dynamicGreeting.subtitle}
            stats={[
              { label: `Level ${level}`, subtext: `${xp} / ${level * 500} XP`, icon: BookOpen, color: '#2dd4bf', iconBg: 'rgba(20, 184, 166, 0.25)', progress: Math.min(100, (xp / (level * 500)) * 100) },
              { label: `${streak}`, subtext: 'Day Streak', icon: Flame, color: '#f59e0b', iconBg: 'rgba(245, 158, 11, 0.25)' },
              { label: `${goalsCount}`, subtext: 'Learning Goals', icon: Target, color: '#38bdf8', iconBg: 'rgba(56, 189, 248, 0.25)' }
            ]}
          />



          {/* Quick Action Shortcuts Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            padding: '12px 18px',
            borderRadius: '20px',
            background: isLight ? 'rgba(255, 255, 255, 0.82)' : 'linear-gradient(135deg, rgba(30, 45, 90, 0.65) 0%, rgba(18, 25, 60, 0.78) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.20)',
            boxShadow: isLight ? '0 10px 30px rgba(100, 130, 200, 0.12)' : '0 10px 30px rgba(0, 0, 0, 0.35)'
          }}>
            {[
              { label: 'Take AI Quiz', icon: Target, color: '#06b6d4', action: () => handlePromptClick('Generate a 5-question diagnostic quiz') },
              { label: 'Peer Skill Swap', icon: Users, color: '#a855f7', action: () => navigate('/skill-exchange') },
              { label: 'Launch 3D XR Lab', icon: Atom, color: '#38bdf8', action: () => navigate('/xr-studio') },
              { label: 'AI Study Planner', icon: Calendar, color: '#34d399', action: () => navigate('/study-planner') },
              { label: 'Knowledge Map', icon: Dna, color: '#f59e0b', action: () => navigate('/constellation') }
            ].map((act) => {
              const IconComponent = act.icon;
              return (
                <button
                  key={act.label}
                  onClick={act.action}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    background: isLight ? 'rgba(240, 246, 255, 0.85)' : 'rgba(255, 255, 255, 0.06)',
                    border: isLight ? '1px solid rgba(210, 225, 250, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                    color: isLight ? '#18345F' : '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <IconComponent size={15} color={act.color} />
                  {act.label}
                </button>
              );
            })}
          </div>

          {/* My Subjects Widget Matching Reference Design */}
          <MySubjectsWidget trackType={activeTrackTab} customSubjects={selectedSubjects} />


          {/* D. CONTINUE LEARNING VIDEO CARD OR EMPTY STATE */}
          <div style={{
            borderRadius: '24px',
            background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(235, 244, 255, 0.82) 100%)' : 'linear-gradient(135deg, rgba(30, 45, 90, 0.72) 0%, rgba(18, 25, 60, 0.82) 60%, rgba(35, 25, 80, 0.75) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.22)',
            padding: '22px',
            boxShadow: isLight ? '0 15px 40px rgba(100, 130, 200, 0.15)' : '0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1.5px 2px rgba(255, 255, 255, 0.3)'
          }}>
            {activeCourse ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: activeCourse.isContinue ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={16} color={activeCourse.isContinue ? '#6366f1' : '#10b981'} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: isLight ? '#18345F' : '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                      {activeCourse.isContinue ? 'Continue Learning' : 'Recommended For You'}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      position: 'relative',
                      width: '110px',
                      height: '70px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <img
                        src={activeCourse.image}
                        alt={activeCourse.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.85)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 15px rgba(99, 102, 241, 0.6)'
                      }}>
                        <Play size={14} color="#ffffff" style={{ marginLeft: '2px' }} />
                      </div>
                    </div>

                    <div>
                      <strong style={{ display: 'block', fontSize: '1.05rem', color: isLight ? '#18345F' : '#ffffff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }} title={activeCourse.title}>
                        {activeCourse.title}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: isLight ? '#5D7192' : '#94a3b8', display: 'block', marginBottom: '10px' }}>{activeCourse.subtitle}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '140px', height: '5px', background: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(activeCourse.progress, activeCourse.isContinue ? 15 : 0)}%`, height: '100%', background: activeCourse.isContinue ? '#38bdf8' : '#34d399' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: isLight ? '#5D7192' : '#cbd5e1' }}>{activeCourse.lessonsDone} / {activeCourse.totalLessons} lessons</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (activeCourse?.id) {
                        navigate(`/courses/${activeCourse.id}`);
                      } else {
                        navigate('/courses');
                      }
                    }}
                    style={{
                      padding: '11px 24px',
                      borderRadius: '9999px',
                      background: activeCourse.isContinue
                        ? 'linear-gradient(90deg, #36C7F4 0%, #4F8CFF 50%, #8B6CFF 100%)'
                        : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: activeCourse.isContinue
                        ? '0 6px 20px rgba(79, 140, 255, 0.35)'
                        : '0 6px 20px rgba(6, 182, 212, 0.4)'
                    }}
                  >
                    {activeCourse.isContinue ? 'Continue' : 'Start Lesson'} <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: isLight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366f1'
                  }}>
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#18345F' : '#ffffff' }}>
                      No Courses Enrolled Yet
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: isLight ? '#5D7192' : '#94a3b8' }}>
                      Enroll in courses to track lessons, watch interactive video tutorials, and monitor completion progress.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/courses')}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                  }}
                >
                  Explore Courses <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* E. MY SMART NOTES DASHBOARD WIDGET */}
          <NotesWidget onOpenCreateModal={() => navigate('/notes')} />
        </div>

        {/* RIGHT COLUMN (WIDGETS & SIDE PANELS) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* A. SAGE AI TUTOR CARD */}
          <div style={{
            borderRadius: '24px',
            background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(235, 244, 255, 0.82) 100%)' : 'linear-gradient(135deg, rgba(30, 45, 90, 0.72) 0%, rgba(18, 25, 60, 0.82) 60%, rgba(35, 25, 80, 0.75) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.22)',
            padding: '18px 20px',
            boxShadow: isLight ? '0 15px 40px rgba(100, 130, 200, 0.15)' : '0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1.5px 2px rgba(255, 255, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="#ffffff" />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.98rem', color: isLight ? '#18345F' : '#ffffff' }}>Sage AI Tutor</strong>
                  <span style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} /> Online
                  </span>
                </div>
              </div>
              <ChevronRight size={18} color={isLight ? '#5D7192' : '#94a3b8'} style={{ cursor: 'pointer' }} onClick={() => navigate('/ai-assistant')} />
            </div>

            {/* AI Welcome Speech Bubble */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '16px',
              background: isLight ? 'rgba(235, 243, 255, 0.9)' : 'rgba(255, 255, 255, 0.06)',
              border: isLight ? '1px solid rgba(210, 225, 250, 0.9)' : '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.84rem',
              color: isLight ? '#18345F' : '#f1f5f9',
              lineHeight: '1.4'
            }}>
              Hi {userName}! 👋<br />
              What would you like to learn today?
            </div>

            {/* Prompt Quick Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Explain this topic', 'Create study plan', 'Help with homework', 'Explore career options'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '9999px',
                    background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.06)',
                    border: isLight ? '1px solid rgba(210, 225, 250, 0.9)' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isLight ? '#3B5998' : '#cbd5e1',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Sage AI Ask Input with Diagonal Arrow Circle Send */}
            <div style={{ position: 'relative', marginTop: '4px' }}>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePromptClick(aiPrompt)}
                placeholder="Ask anything..."
                style={{
                  width: '100%',
                  padding: '10px 46px 10px 16px',
                  borderRadius: '9999px',
                  background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid rgba(210, 225, 250, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                  color: isLight ? '#18345F' : '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={() => handlePromptClick(aiPrompt)}
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)'
                }}
              >
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          {/* B. TODAY'S SCHEDULE (MATCHING SCREENSHOT 2) */}
          <div style={{
            borderRadius: '24px',
            background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(235, 244, 255, 0.82) 100%)' : 'linear-gradient(135deg, rgba(30, 45, 90, 0.72) 0%, rgba(18, 25, 60, 0.82) 60%, rgba(35, 25, 80, 0.75) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.22)',
            padding: '20px',
            boxShadow: isLight ? '0 15px 40px rgba(100, 130, 200, 0.15)' : '0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1.5px 2px rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(34, 211, 238, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} color="#22d3ee" />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#18345F' : '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                  Today's Schedule
                </h3>
              </div>
              <button
                onClick={() => navigate('/study-planner')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                View All <ArrowRight size={12} />
              </button>
            </div>

            {/* Schedule Items List or Empty State */}
            {todaysSchedule.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                textAlign: 'center',
                borderRadius: '16px',
                background: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.03)',
                border: isLight ? '1px dashed rgba(34, 211, 238, 0.35)' : '1px dashed rgba(34, 211, 238, 0.2)',
                gap: '8px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'rgba(34, 211, 238, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22d3ee'
                }}>
                  <Calendar size={18} />
                </div>
                <strong style={{ fontSize: '0.9rem', color: isLight ? '#18345F' : '#ffffff' }}>
                  No Sessions Scheduled Today
                </strong>
                <p style={{ margin: 0, fontSize: '0.76rem', color: isLight ? '#5D7192' : '#94a3b8', maxWidth: '240px' }}>
                  Plan your focus blocks to maintain your streak.
                </p>
                <button
                  onClick={() => navigate('/study-planner')}
                  style={{
                    marginTop: '4px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    background: 'rgba(34, 211, 238, 0.2)',
                    border: '1px solid rgba(34, 211, 238, 0.4)',
                    color: isLight ? '#0891b2' : '#22d3ee',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Schedule Session
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {todaysSchedule.map((sch, sIdx) => (
                  <div
                    key={sch.title + sIdx}
                    onClick={sch.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '14px',
                      background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.05)',
                      border: isLight ? '1px solid rgba(220, 230, 245, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = isLight ? 'rgba(235, 243, 255, 0.9)' : 'rgba(255, 255, 255, 0.09)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.05)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <span style={{ color: isLight ? '#5D7192' : '#94a3b8', fontSize: '0.74rem', width: '65px', fontWeight: 600, flexShrink: 0 }}>{sch.time}</span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sch.color, flexShrink: 0, boxShadow: `0 0 10px ${sch.color}` }} />
                      <span style={{ color: isLight ? '#18345F' : '#ffffff', fontWeight: 600, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sch.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '999px', background: `${sch.color}20`, color: isLight ? '#18345F' : sch.color, fontWeight: 700 }}>
                        {sch.status}
                      </span>
                      <ChevronRight size={14} color={isLight ? '#5D7192' : '#94a3b8'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* C. PROGRESS OVERVIEW (3 CIRCULAR SVG GAUGES) */}
          <div style={{
            borderRadius: '24px',
            background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(235, 244, 255, 0.82) 100%)' : 'linear-gradient(135deg, rgba(20, 26, 58, 0.75) 0%, rgba(12, 17, 40, 0.85) 100%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.12)',
            padding: '20px',
            boxShadow: isLight ? '0 15px 40px rgba(100, 130, 200, 0.15)' : '0 20px 50px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={16} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#18345F' : '#ffffff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                  Progress Overview
                </h3>
              </div>
              <button
                onClick={() => navigate('/analytics')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                View Details <ArrowRight size={12} />
              </button>
            </div>

            {/* 3 Circular Ring SVG Gauges Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
              
              {/* Ring 1: Dynamic Learning */}
              <div>
                <div style={{ position: 'relative', width: '56px', height: '56px', margin: '0 auto 6px auto' }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke={isLight ? 'rgba(210, 225, 250, 0.8)' : 'rgba(255,255,255,0.1)'} strokeWidth="5" />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="5"
                      strokeDasharray="138"
                      strokeDashoffset={getGaugeOffset(dynamicLearning)}
                      strokeLinecap="round"
                      transform="rotate(-90 28 28)"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: isLight ? '#18345F' : '#ffffff' }}>
                    {dynamicLearning}%
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', color: isLight ? '#5D7192' : '#94a3b8' }}>Learning</span>
              </div>

              {/* Ring 2: Dynamic Practice */}
              <div>
                <div style={{ position: 'relative', width: '56px', height: '56px', margin: '0 auto 6px auto' }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke={isLight ? 'rgba(210, 225, 250, 0.8)' : 'rgba(255,255,255,0.1)'} strokeWidth="5" />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="5"
                      strokeDasharray="138"
                      strokeDashoffset={getGaugeOffset(dynamicPractice)}
                      strokeLinecap="round"
                      transform="rotate(-90 28 28)"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: isLight ? '#18345F' : '#ffffff' }}>
                    {dynamicPractice}%
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', color: isLight ? '#5D7192' : '#94a3b8' }}>Practice</span>
              </div>

              {/* Ring 3: Dynamic Assignments */}
              <div>
                <div style={{ position: 'relative', width: '56px', height: '56px', margin: '0 auto 6px auto' }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke={isLight ? 'rgba(210, 225, 250, 0.8)' : 'rgba(255,255,255,0.1)'} strokeWidth="5" />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="none"
                      stroke="#fb923c"
                      strokeWidth="5"
                      strokeDasharray="138"
                      strokeDashoffset={getGaugeOffset(dynamicAssignments)}
                      strokeLinecap="round"
                      transform="rotate(-90 28 28)"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: isLight ? '#18345F' : '#ffffff' }}>
                    {dynamicAssignments}%
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', color: isLight ? '#5D7192' : '#94a3b8' }}>Assignments</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE QUIZ MODAL OVERLAY */}
      {activeQuizModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8, 12, 28, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(20, 26, 58, 0.95) 0%, rgba(10, 14, 34, 0.98) 100%)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
            padding: '32px'
          }}>
            <button
              onClick={() => setActiveQuizModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 700,
                zIndex: 10
              }}
            >
              ✕
            </button>
            <InteractiveQuiz
              quiz={activeQuizModal}
              onReset={() => setActiveQuizModal(null)}
              onReconfigure={() => setActiveQuizModal(null)}
              subjectName={activeQuizModal.subjectName}
            />
          </div>
        </div>
      )}

      {/* CREATE CURRICULUM MODAL */}
      <CreateCurriculumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCurriculumCreated={(newCurriculum) => {
          if (newCurriculum && newCurriculum.educationType) {
            setActiveTrackTab(newCurriculum.educationType);
          }
        }}
      />
    </div>
  );
};

export default EduNovaPixelPerfectDashboard;
