import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit3,
  Filter,
  Flame,
  HelpCircle,
  History,
  Info,
  Layers,
  LayoutDashboard,
  Library,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Unlock,
  UserCheck,
  UserX,
  Users,
  X,
  Zap,
  Key,
  Copy,
  QrCode,
  Film,
  Upload,
  Activity,
  BarChart2,
  Bot,
  Bell,
  Sliders,
  Database,
  Shield,
  AlertOctagon,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi, authApi } from '../../lib/apiClient';
import { MediaManager } from '../../components/materials/MediaManager';
import { SubjectSelect } from '../../components/common/SubjectSelect';
import { SystemHealthPanel } from '../../components/admin/SystemHealthPanel';
import { PlatformAnalyticsPanel } from '../../components/admin/PlatformAnalyticsPanel';
import { SageAiControlPanel } from '../../components/admin/SageAiControlPanel';
import { SecurityCenterPanel } from '../../components/admin/SecurityCenterPanel';
import { ModerationCenterPanel } from '../../components/admin/ModerationCenterPanel';
import { NotificationCenterPanel } from '../../components/admin/NotificationCenterPanel';
import { FeatureControlPanel } from '../../components/admin/FeatureControlPanel';
import { DataBackupPanel } from '../../components/admin/DataBackupPanel';

const emptyCourse = { title: '', description: '', category: '', difficulty: 'BEGINNER', thumbnail: '', instructorId: '', isPublished: false, modules: [] };
const emptySubject = { name: '', category: '', educationType: 'SCHOOL', class: '', board: '', degree: '', branch: '', semester: '', exam: '', topics: [] };
const emptyQuiz = { title: '', subjectId: '', topicId: '', difficulty: 'BEGINNER', totalQuestions: 5 };
const emptyQuestion = { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, explanation: '' };
const emptyMission = { title: '', description: '', rewardXp: 50, category: 'learning', period: 'DAILY', isActive: true };
const roles = ['ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT'];
const statuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];

const panelStyle = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '14px',
  padding: '20px',
};
const inputStyle = {
  width: '100%',
  marginTop: '6px',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
};

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
      {label}
      {children}
    </label>
  );
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading admin access...</div>;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

export function AdminDashboardPage() {
  return (
    <AdminOnly>
      <AdminWorkspace />
    </AdminOnly>
  );
}

function AdminWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTab = new URLSearchParams(location.search).get('tab') || 'overview';
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    const qTab = new URLSearchParams(location.search).get('tab') || 'overview';
    setTab(qTab);
  }, [location.search]);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState({ users: [], total: 0 });
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loginAttempts, setLoginAttempts] = useState({ attempts: [], total: 0 });
  const [loginStats, setLoginStats] = useState(null);
  const [changeLogs, setChangeLogs] = useState({ logs: [], total: 0 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loginStatusFilter, setLoginStatusFilter] = useState('');

  // Modals state
  const [activeSubjectModal, setActiveSubjectModal] = useState(null); // null | 'new' | subject
  const [activeCourseModal, setActiveCourseModal] = useState(null); // null | 'new' | course
  const [activeModuleModal, setActiveModuleModal] = useState(null); // null | course
  const [activeQuizModal, setActiveQuizModal] = useState(false); // boolean
  const [activeQuestionModal, setActiveQuestionModal] = useState(null); // null | quiz
  const [activeMissionModal, setActiveMissionModal] = useState(null); // null | 'new' | mission
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUserHistory, setViewingUserHistory] = useState(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);

  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const notify = (message, type = 'success') => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 4000);
  };

  const loadData = async () => {
    setBusy(true);
    try {
      const [metricsRes, usersRes, coursesRes, subjectsRes, quizzesRes, missionsRes, tfaRes] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getUsers({
          limit: 50,
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        }),
        adminApi.getCourses({ search: search || undefined }),
        adminApi.getSubjects({ search: search || undefined }),
        adminApi.getQuizzes({ search: search || undefined }),
        adminApi.getMissions({ search: search || undefined }),
        authApi.getTwoFactorStatus().catch(() => ({ data: null })),
      ]);

      setMetrics(metricsRes.data);
      setUsers(usersRes.data || { users: [], total: 0 });
      setCourses(coursesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setQuizzes(quizzesRes.data || []);
      setMissions(missionsRes.data || []);
      if (tfaRes?.data) setTwoFactorStatus(tfaRes.data);

      if (tab === 'logins' || tab === 'overview') {
        const [loginsRes, statsRes] = await Promise.all([
          adminApi.getLoginAttempts({ limit: 50, status: loginStatusFilter || undefined, search: search || undefined }),
          adminApi.getLoginStats(),
        ]);
        setLoginAttempts(loginsRes.data || { attempts: [], total: 0 });
        setLoginStats(statsRes.data || null);
      }

      if (tab === 'audits') {
        const logsRes = await adminApi.getUserChangeLogs({ limit: 50, search: search || undefined });
        setChangeLogs(logsRes.data || { logs: [], total: 0 });
      }
    } catch (error) {
      notify(error.message || 'Could not load admin data', 'error');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab, roleFilter, statusFilter, loginStatusFilter]);

  // ── User Management Handlers ────────────────────────────────────────────────
  const handleUpdateRole = async (id, role) => {
    try {
      await adminApi.updateUserRole(id, role);
      notify(`Role updated to ${role}`);
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not update role', 'error');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminApi.updateUserStatus(id, newStatus, 'Status updated via admin console');
      notify(`User account is now ${newStatus}`);
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not update account status', 'error');
    }
  };

  const handleUnlockAccount = async (id) => {
    try {
      const res = await adminApi.unlockUserAccount(id);
      notify(res.message || 'Account unlocked successfully');
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not unlock account', 'error');
    }
  };

  const handleRevokeSessions = async (id) => {
    if (!window.confirm('Force logout this user across all devices?')) return;
    try {
      const res = await adminApi.revokeUserSessions(id);
      notify(res.message || 'All user sessions revoked');
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not revoke sessions', 'error');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete user "${name}"? This cannot be undone.`)) return;
    try {
      const res = await adminApi.deleteUser(id);
      notify(res.message || 'User deleted successfully');
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not delete user', 'error');
    }
  };

  const handleSaveUserDetails = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    setBusy(true);
    try {
      const res = await adminApi.updateUserDetails(editingUser.id, editingUser);
      notify(res.message || 'User details updated dynamically');
      setEditingUser(null);
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not update user', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleViewUserHistory = async (id) => {
    setBusy(true);
    try {
      const res = await adminApi.getUserDetail(id);
      setViewingUserHistory(res.data);
    } catch (error) {
      notify(error.message || 'Could not load user history', 'error');
    } finally {
      setBusy(false);
    }
  };

  // ── Curriculum (Subjects & Topics) Handlers ─────────────────────────────────
  const notifyCurriculumUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('edunova_curriculum_updated'));
      window.dispatchEvent(new Event('edunova_subject_updated'));
    }
  };

  const notifyQuizUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('edunova_quiz_updated'));
    }
  };

  const notifyCourseUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('edunova_course_updated'));
    }
  };

  const handleSaveSubject = async (subjectData) => {
    setBusy(true);
    try {
      if (activeSubjectModal && activeSubjectModal.id) {
        await adminApi.updateSubject(activeSubjectModal.id, subjectData);
        notify(`Subject "${subjectData.name}" updated successfully`);
      } else {
        await adminApi.createSubject(subjectData);
        notify(`Subject "${subjectData.name}" created successfully`);
      }
      setActiveSubjectModal(null);
      notifyCurriculumUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not save subject', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Delete subject "${subjectName}" and all related topics? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminApi.deleteSubject(subjectId);
      notify(`Subject "${subjectName}" deleted`);
      notifyCurriculumUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not delete subject', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddTopic = async (subjectId, topicData) => {
    setBusy(true);
    try {
      await adminApi.addTopic(subjectId, topicData);
      notify('Topic added successfully');
      notifyCurriculumUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not add topic', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTopic = async (topicId, topicTitle) => {
    if (!window.confirm(`Delete topic "${topicTitle}"?`)) return;
    setBusy(true);
    try {
      await adminApi.deleteTopic(topicId);
      notify(`Topic "${topicTitle}" deleted`);
      notifyCurriculumUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not delete topic', 'error');
    } finally {
      setBusy(false);
    }
  };

  // ── Course & Module Handlers ────────────────────────────────────────────────
  const handleSaveCourse = async (courseData) => {
    setBusy(true);
    try {
      if (activeCourseModal && activeCourseModal.id) {
        await adminApi.updateCourse(activeCourseModal.id, courseData);
        notify(`Course "${courseData.title}" updated successfully`);
      } else {
        await adminApi.createCourse(courseData);
        notify(`Course "${courseData.title}" created successfully`);
      }
      setActiveCourseModal(null);
      notifyCourseUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not save course', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePublishCourse = async (courseId, newIsPublished) => {
    setBusy(true);
    try {
      await adminApi.updateCourse(courseId, { isPublished: newIsPublished });
      notify(`Course is now ${newIsPublished ? 'published' : 'unpublished'}`);
      notifyCourseUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not update publication state', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Delete course "${courseTitle}" and its modules? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminApi.deleteCourse(courseId);
      notify(`Course "${courseTitle}" deleted`);
      notifyCourseUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not delete course', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddModule = async (courseId, moduleData) => {
    setBusy(true);
    try {
      await adminApi.addModule(courseId, moduleData);
      notify('Module added to course successfully');
      setActiveModuleModal(null);
      notifyCourseUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not add module', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteModule = async (moduleId, moduleTitle) => {
    if (!window.confirm(`Delete module "${moduleTitle}"?`)) return;
    setBusy(true);
    try {
      await adminApi.deleteModule(moduleId);
      notify(`Module "${moduleTitle}" deleted`);
      notifyCourseUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not delete module', 'error');
    } finally {
      setBusy(false);
    }
  };

  // ── Quiz & Question Handlers ────────────────────────────────────────────────
  const handleSaveQuiz = async (quizData) => {
    setBusy(true);
    try {
      const res = await adminApi.createQuiz(quizData);
      notify(`Quiz "${quizData.title}" created successfully and published for students!`);
      setActiveQuizModal(false);
      if (quizData.subjectId) {
        setSubjectFilter(quizData.subjectId);
      }
      notifyQuizUpdated();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('edunova_curriculum_updated'));
      }
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not create quiz', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddQuestion = async (quizId, questionData) => {
    setBusy(true);
    try {
      await adminApi.addQuestion(quizId, questionData);
      notify('Question added to quiz successfully');
      setActiveQuestionModal(null);
      notifyQuizUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not add question', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (!window.confirm(`Delete quiz "${quizTitle}" and all its questions? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminApi.deleteQuiz(quizId);
      notify(`Quiz "${quizTitle}" deleted`);
      notifyQuizUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not delete quiz', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;
    setBusy(true);
    try {
      await adminApi.deleteQuizQuestion(questionId);
      notify('Question removed');
      notifyQuizUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not delete question', 'error');
    } finally {
      setBusy(false);
    }
  };

  // ── Missions Handlers ───────────────────────────────────────────────────────
  const handleSaveMission = async (missionData) => {
    setBusy(true);
    try {
      if (activeMissionModal && activeMissionModal.id) {
        await adminApi.updateMission(activeMissionModal.id, missionData);
        notify(`Mission "${missionData.title}" updated successfully`);
      } else {
        await adminApi.createMission(missionData);
        notify(`Mission "${missionData.title}" created successfully`);
      }
      setActiveMissionModal(null);
      notifyCurriculumUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not save mission', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleMissionActive = async (missionId, newIsActive) => {
    setBusy(true);
    try {
      await adminApi.updateMission(missionId, { isActive: newIsActive });
      notify(`Mission is now ${newIsActive ? 'active' : 'inactive'}`);
      notifyCurriculumUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not update mission status', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteMission = async (missionId, missionTitle) => {
    if (!window.confirm(`Delete mission "${missionTitle}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminApi.deleteMission(missionId);
      notify(`Mission "${missionTitle}" deleted`);
      notifyCurriculumUpdated();
      await loadData();
    } catch (error) {
      notify(error.message || 'Could not delete mission', 'error');
    } finally {
      setBusy(false);
    }
  };

  const navItems = [
    ['overview', 'Overview', LayoutDashboard],
    ['analytics', 'Platform Analytics', BarChart2],
    ['health', 'System Health', HeartPulse],
    ['sage-ai', 'Sage AI Control Center', Bot],
    ['users', 'Users & Access', Users],
    ['security', 'Security Center', Shield],
    ['moderation', 'Moderation Center', AlertOctagon],
    ['notifications', 'Notification Center', Bell],
    ['feature-flags', 'Feature Control', Sliders],
    ['curriculum', 'Curriculum Manager', Library],
    ['courses', 'Course Catalog', BookOpen],
    ['materials', 'Media & File Hub', Film],
    ['quizzes', 'Quiz Builder', HelpCircle],
    ['missions', 'Missions & Rewards', Zap],
    ['data-backup', 'Data & Backup', Database],
    ['logins', 'Login Attempts', ShieldAlert],
    ['audits', 'Data Change Logs', History],
  ];

  const NoticeIcon = notice?.type === 'error' ? AlertTriangle : CheckCircle2;

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 12px 80px' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          alignItems: 'flex-start',
          marginBottom: 26,
        }}
      >
        <div>
          <div
            style={{
              color: 'var(--accent-primary)',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Security & Content Administration
          </div>
          <h1 style={{ marginTop: 6, fontSize: '1.9rem', fontWeight: 800 }}>Admin Workspace & Dynamic Data Control</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Handle all user access, curriculum subjects, course modules, quizzes, and gamified missions in real-time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setTwoFactorModalOpen(true)}
            title="Configure Two-Factor Authentication"
            style={{
              display: 'inline-flex',
              gap: 8,
              alignItems: 'center',
              padding: '10px 16px',
              borderRadius: 9,
              color: twoFactorStatus?.twoFactorEnabled ? '#22c55e' : '#f59e0b',
              border: `1px solid ${twoFactorStatus?.twoFactorEnabled ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              background: twoFactorStatus?.twoFactorEnabled ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {twoFactorStatus?.twoFactorEnabled ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            2FA: {twoFactorStatus?.twoFactorEnabled ? 'ACTIVE' : 'SETUP REQUIRED'}
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                await loadData();
                notify('Admin workspace metrics & logs refreshed successfully!', 'success');
              } catch (e) {
                notify('Failed to refresh data', 'error');
              }
            }}
            title="Refresh admin workspace data"
            style={{
              display: 'inline-flex',
              gap: 8,
              alignItems: 'center',
              padding: '10px 16px',
              borderRadius: 9,
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={16} className={busy ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {notice && (
        <div
          style={{
            ...panelStyle,
            marginBottom: 18,
            borderColor: notice.type === 'error' ? '#ef4444' : '#22c55e',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <NoticeIcon size={18} color={notice.type === 'error' ? '#ef4444' : '#22c55e'} />
          <span style={{ fontWeight: 600 }}>{notice.message}</span>
        </div>
      )}

      <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {navItems.map(([key, label, Icon]) => (
          <button
            type="button"
            key={key}
            onClick={() => {
              setTab(key);
              navigate(`/admin?tab=${key}`);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 9,
              background: tab === key ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: tab === key ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <Overview metrics={metrics} onSwitchTab={setTab} />}
      {tab === 'analytics' && <PlatformAnalyticsPanel />}
      {tab === 'health' && <SystemHealthPanel />}
      {tab === 'sage-ai' && <SageAiControlPanel />}
      {tab === 'security' && <SecurityCenterPanel />}
      {tab === 'moderation' && <ModerationCenterPanel />}
      {tab === 'notifications' && <NotificationCenterPanel />}
      {tab === 'feature-flags' && <FeatureControlPanel />}
      {tab === 'data-backup' && <DataBackupPanel />}

      {tab === 'users' && (
        <UsersPanel
          users={users}
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onSearch={loadData}
          onRoleChange={handleUpdateRole}
          onStatusChange={handleUpdateStatus}
          onUnlock={handleUnlockAccount}
          onRevokeSessions={handleRevokeSessions}
          onDeleteUser={handleDeleteUser}
          onEditUser={(u) => setEditingUser({ ...u })}
          onViewHistory={handleViewUserHistory}
        />
      )}

      {tab === 'curriculum' && (
        <CurriculumManagerPanel
          subjects={subjects}
          onOpenCreateModal={() => setActiveSubjectModal('new')}
          onEditSubject={(s) => setActiveSubjectModal(s)}
          onDeleteSubject={handleDeleteSubject}
          onAddTopic={handleAddTopic}
          onDeleteTopic={handleDeleteTopic}
        />
      )}

      {tab === 'courses' && (
        <CourseCatalogPanel
          courses={courses}
          onOpenCreateModal={() => setActiveCourseModal('new')}
          onEditCourse={(c) => setActiveCourseModal(c)}
          onDeleteCourse={handleDeleteCourse}
          onTogglePublish={handleTogglePublishCourse}
          onOpenAddModuleModal={(c) => setActiveModuleModal(c)}
          onDeleteModule={handleDeleteModule}
        />
      )}

      {tab === 'materials' && (
        <MediaManager isInstructor={false} userRole="ADMIN" />
      )}

      {tab === 'quizzes' && (
        <QuizBuilderPanel
          quizzes={quizzes}
          subjects={subjects}
          onOpenCreateModal={() => setActiveQuizModal(true)}
          onDeleteQuiz={handleDeleteQuiz}
          onOpenAddQuestionModal={(q) => setActiveQuestionModal(q)}
          onDeleteQuestion={handleDeleteQuestion}
        />
      )}

      {tab === 'missions' && (
        <MissionsPanel
          missions={missions}
          onOpenCreateModal={() => setActiveMissionModal('new')}
          onEditMission={(m) => setActiveMissionModal(m)}
          onDeleteMission={handleDeleteMission}
          onToggleActive={handleToggleMissionActive}
        />
      )}

      {tab === 'logins' && (
        <LoginsPanel
          loginAttempts={loginAttempts}
          loginStats={loginStats}
          search={search}
          setSearch={setSearch}
          statusFilter={loginStatusFilter}
          setStatusFilter={setLoginStatusFilter}
          onSearch={loadData}
        />
      )}

      {tab === 'audits' && (
        <AuditsPanel changeLogs={changeLogs} search={search} setSearch={setSearch} onSearch={loadData} />
      )}

      {/* ── Modals ── */}
      {activeSubjectModal && (
        <SubjectModal
          subject={activeSubjectModal === 'new' ? emptySubject : activeSubjectModal}
          onSubmit={handleSaveSubject}
          onClose={() => setActiveSubjectModal(null)}
          busy={busy}
        />
      )}

      {activeCourseModal && (
        <CourseModal
          course={activeCourseModal === 'new' ? emptyCourse : activeCourseModal}
          onSubmit={handleSaveCourse}
          onClose={() => setActiveCourseModal(null)}
          busy={busy}
        />
      )}

      {activeModuleModal && (
        <ModuleModal
          course={activeModuleModal}
          onSubmit={(data) => handleAddModule(activeModuleModal.id, data)}
          onClose={() => setActiveModuleModal(null)}
          busy={busy}
        />
      )}

      {activeQuizModal && (
        <QuizModal
          subjects={subjects}
          onSubmit={handleSaveQuiz}
          onClose={() => setActiveQuizModal(false)}
          busy={busy}
        />
      )}

      {activeQuestionModal && (
        <QuestionModal
          quiz={activeQuestionModal}
          onSubmit={(data) => handleAddQuestion(activeQuestionModal.id, data)}
          onClose={() => setActiveQuestionModal(null)}
          busy={busy}
        />
      )}

      {activeMissionModal && (
        <MissionModal
          mission={activeMissionModal === 'new' ? emptyMission : activeMissionModal}
          onSubmit={handleSaveMission}
          onClose={() => setActiveMissionModal(null)}
          busy={busy}
        />
      )}

      {/* Dynamic Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          setUser={setEditingUser}
          onSubmit={handleSaveUserDetails}
          onClose={() => setEditingUser(null)}
          busy={busy}
        />
      )}

      {/* User History & Auditing Modal */}
      {viewingUserHistory && (
        <UserHistoryModal
          user={viewingUserHistory}
          onClose={() => setViewingUserHistory(null)}
          onUnlock={handleUnlockAccount}
          onRevokeSessions={handleRevokeSessions}
        />
      )}

      {/* Two-Factor Authentication Modal */}
      {twoFactorModalOpen && (
        <TwoFactorModal
          isOpen={twoFactorModalOpen}
          status={twoFactorStatus}
          onClose={() => setTwoFactorModalOpen(false)}
          onStatusChange={(newStatus) => setTwoFactorStatus(newStatus)}
          notify={notify}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW PANEL
// ─────────────────────────────────────────────────────────────────────────────

function Overview({ metrics, onSwitchTab }) {
  const cards = [
    ['Total Accounts', metrics?.users?.total ?? 0, Users, '#3b82f6'],
    ['Active Users', metrics?.users?.active ?? 0, UserCheck, '#22c55e'],
    ['Suspended / Banned', metrics?.users?.suspended ?? 0, UserX, '#ef4444'],
    ['Total Login Attempts', metrics?.security?.totalLoginAttempts ?? 0, ShieldAlert, '#8b5cf6'],
    ['Failed Logins', metrics?.security?.failedLoginAttempts ?? 0, AlertTriangle, '#f59e0b'],
    ['Published Courses', metrics?.content?.publishedCourses ?? 0, BookOpen, '#06b6d4'],
    ['Curriculum Subjects', metrics?.content?.totalSubjects ?? 0, Library, '#10b981'],
    ['Total Enrollments', metrics?.content?.totalEnrollments ?? 0, ShieldCheck, '#ec4899'],
  ];

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {cards.map(([label, value, Icon, color]) => (
          <div key={label} style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
              <Icon size={20} color={color} />
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 18 }}>
        {/* Recent Login Attempts */}
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.15rem' }}>Recent Login Attempts</h2>
            <button
              type="button"
              onClick={() => onSwitchTab('logins')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              View all →
            </button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {metrics?.security?.recentLoginAttempts?.length ? (
              metrics.security.recentLoginAttempts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {item.user?.name || item.identifier}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                      IP: {item.ipAddress || '127.0.0.1'} · {new Date(item.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background:
                        item.status === 'SUCCESS' ? '#22c55e20' : item.status === 'BLOCKED' ? '#f59e0b20' : '#ef444420',
                      color:
                        item.status === 'SUCCESS' ? '#22c55e' : item.status === 'BLOCKED' ? '#f59e0b' : '#ef4444',
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent logins recorded.</p>
            )}
          </div>
        </section>

        {/* Recent Admin & Profile Activity */}
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.15rem' }}>Recent User Data Changes</h2>
            <button
              type="button"
              onClick={() => onSwitchTab('audits')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              View audit trail →
            </button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {metrics?.recentChangeLogs?.length ? (
              metrics.recentChangeLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      <strong>{log.action}</strong> on {log.user?.name || 'User'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                      By: {log.changedBy?.name || 'Self'} · {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No user changes recorded yet.</p>
            )}
          </div>
        </section>
      </div>

      {/* ── System Health & AI Quick Overview Section ── */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 18 }}>
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <HeartPulse size={18} style={{ color: 'var(--accent-primary)' }} /> System Health Status
            </h2>
            <button
              type="button"
              onClick={() => onSwitchTab('health')}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Full Diagnosis →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>API Gateway</div>
              <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.9rem', marginTop: 2 }}>● Operational</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PostgreSQL Database</div>
              <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.9rem', marginTop: 2 }}>● Operational</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Socket.IO Realtime</div>
              <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.9rem', marginTop: 2 }}>● Operational</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sage AI Engine</div>
              <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.9rem', marginTop: 2 }}>● Operational</div>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} style={{ color: 'var(--accent-primary)' }} /> Sage AI Control Summary
            </h2>
            <button
              type="button"
              onClick={() => onSwitchTab('sage-ai')}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Control Center →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active AI Model</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>Gemini Pro 1.5</div>
            </div>
            <div style={{ background: 'var(--bg-primary)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Provider Health</div>
              <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.9rem', marginTop: 2 }}>Connected</div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. USERS MANAGEMENT PANEL (FULL DYNAMIC ADMIN CONTROL)
// ─────────────────────────────────────────────────────────────────────────────

function UsersPanel({
  users,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onSearch,
  onRoleChange,
  onStatusChange,
  onUnlock,
  onRevokeSessions,
  onDeleteUser,
  onEditUser,
  onViewHistory,
}) {
  return (
    <section style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 18,
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>User Accounts & Permissions</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            {users.total || 0} registered accounts. Modify roles, suspend/ban, unlock, and edit profiles dynamically.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Search user, email, phone..."
              style={{
                paddingLeft: 34,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            type="button"
            onClick={onSearch}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--accent-primary)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Search
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr>
              {['User', 'Role', 'Status', 'Security & Logins', 'Learner Type', 'Joined', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '12px 10px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.users.map((item) => {
              const isLocked = item.lockoutUntil && new Date(item.lockoutUntil) > new Date();

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 10px' }}>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {item.email || item.phone || 'No direct contact'}
                    </div>
                    {item.studentUsername && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: 'var(--bg-tertiary, #2a2a2a)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        @{item.studentUsername}
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '14px 10px' }}>
                    <select
                      value={item.role}
                      onChange={(e) => onRoleChange(item.id, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                      }}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={{ padding: '14px 10px' }}>
                    <select
                      value={item.status || 'ACTIVE'}
                      onChange={(e) => onStatusChange(item.id, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border-color)',
                        fontWeight: 700,
                        background:
                          item.status === 'SUSPENDED'
                            ? '#f59e0b20'
                            : item.status === 'BANNED'
                            ? '#ef444420'
                            : '#22c55e20',
                        color:
                          item.status === 'SUSPENDED'
                            ? '#f59e0b'
                            : item.status === 'BANNED'
                            ? '#ef4444'
                            : '#22c55e',
                      }}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={{ padding: '14px 10px' }}>
                    {isLocked ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#ef4444',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        <Lock size={14} /> Locked
                      </span>
                    ) : item.failedLoginAttempts > 0 ? (
                      <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>
                        {item.failedLoginAttempts} failed
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Clean</span>
                    )}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                      {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleDateString() : 'Never logged in'}
                    </div>
                  </td>

                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)' }}>{item.learnerType}</td>

                  <td style={{ padding: '14px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>

                  <td style={{ padding: '14px 10px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onEditUser(item)}
                        title="Edit user details"
                        style={{
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewHistory(item.id)}
                        title="View Login Attempts & Audit Logs"
                        style={{
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: 'var(--accent-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        <History size={15} />
                      </button>

                      {isLocked && (
                        <button
                          type="button"
                          onClick={() => onUnlock(item.id)}
                          title="Unlock account"
                          style={{
                            padding: '6px 8px',
                            borderRadius: 6,
                            background: '#22c55e20',
                            border: '1px solid #22c55e',
                            color: '#22c55e',
                            cursor: 'pointer',
                          }}
                        >
                          <Unlock size={15} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRevokeSessions(item.id)}
                        title="Revoke active sessions"
                        style={{
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: '#f59e0b',
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteUser(item.id, item.name)}
                        title="Permanently delete user"
                        style={{
                          padding: '6px 8px',
                          borderRadius: 6,
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LOGIN ATTEMPTS AUDITING PANEL
// ─────────────────────────────────────────────────────────────────────────────

function LoginsPanel({ loginAttempts, loginStats, search, setSearch, statusFilter, setStatusFilter, onSearch }) {
  return (
    <section style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 18,
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Authentication & Login Security Logs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            Tracks all successful, failed, and brute-force blocked login attempts across the platform.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Search email, IP, or reason..."
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />

          <button
            type="button"
            onClick={onSearch}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--accent-primary)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Search
          </button>
        </div>
      </div>

      {loginStats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-primary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Attempts</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>{loginStats.total}</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-primary)' }}>
            <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>Successful</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#22c55e' }}>
              {loginStats.successful}
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-primary)' }}>
            <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Failed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#ef4444' }}>
              {loginStats.failed}
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-primary)' }}>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>Blocked / Locked</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: '#f59e0b' }}>
              {loginStats.blocked}
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-primary)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Success Rate</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: 'var(--accent-primary)' }}>
              {loginStats.successRate}%
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr>
              {['Status', 'Identifier / User', 'IP & Location', 'User Agent', 'Failure Reason', 'Timestamp'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '12px 10px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loginAttempts.attempts.map((attempt) => (
              <tr key={attempt.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 10px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background:
                        attempt.status === 'SUCCESS'
                          ? '#22c55e20'
                          : attempt.status === 'BLOCKED'
                          ? '#f59e0b20'
                          : '#ef444420',
                      color:
                        attempt.status === 'SUCCESS'
                          ? '#22c55e'
                          : attempt.status === 'BLOCKED'
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  >
                    {attempt.status}
                  </span>
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ fontWeight: 700 }}>{attempt.user?.name || attempt.identifier}</div>
                  {attempt.user?.email && attempt.user.email !== attempt.identifier && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{attempt.identifier}</div>
                  )}
                </td>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                    {attempt.ipAddress || '127.0.0.1'}
                  </div>
                  {attempt.location && (
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title={attempt.location.formatted}
                    >
                      <span>{attempt.location.flag}</span>
                      <span>
                        {attempt.location.city ? `${attempt.location.city}, ` : ''}
                        {attempt.location.countryName || attempt.location.country}
                      </span>
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: '12px 10px',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    maxWidth: 240,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={attempt.userAgent}
                >
                  {attempt.userAgent || 'Unknown'}
                </td>
                <td style={{ padding: '12px 10px' }}>
                  {attempt.failureReason ? (
                    <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                      {attempt.failureReason}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                  )}
                </td>
                <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {new Date(attempt.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. USER CHANGE LOGS & AUDIT PANEL
// ─────────────────────────────────────────────────────────────────────────────

function AuditsPanel({ changeLogs, search, setSearch, onSearch }) {
  return (
    <section style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 18,
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>User Profile & State Change History</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            Immutable audit record of all profile edits, status alterations, and session revocations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Search action or user..."
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            onClick={onSearch}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: 'var(--accent-primary)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Search
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr>
              {['Action', 'Target User', 'Modified By', 'Origin Location', 'Changes / Diff', 'Timestamp'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '12px 10px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {changeLogs.logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 10px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {log.action}
                  </span>
                </td>

                <td style={{ padding: '12px 10px' }}>
                  <div style={{ fontWeight: 700 }}>{log.user?.name || log.userId}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{log.user?.email}</div>
                </td>

                <td style={{ padding: '12px 10px' }}>
                  {log.changedBy ? (
                    <div>
                      <div style={{ fontWeight: 600 }}>{log.changedBy.name}</div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--accent-primary)',
                          background: 'var(--accent-primary)20',
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        ADMIN
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Self-update</span>
                  )}
                </td>

                <td style={{ padding: '12px 10px' }}>
                  {log.location ? (
                    <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{log.location.flag}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {log.location.city ? `${log.location.city}, ` : ''}
                        {log.location.countryName || log.location.country}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>-</span>
                  )}
                </td>

                <td style={{ padding: '12px 10px' }}>
                  {log.details ? (
                    <pre
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        background: 'var(--bg-primary)',
                        padding: '6px 10px',
                        borderRadius: 6,
                        maxHeight: 80,
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                  )}
                </td>

                <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. EDIT USER MODAL
// ─────────────────────────────────────────────────────────────────────────────

function EditUserModal({ user, setUser, onSubmit, onClose, busy }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 999,
      }}
    >
      <div
        style={{
          ...panelStyle,
          width: '100%',
          maxWidth: 500,
          background: 'var(--bg-secondary)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Edit User Details</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <Field label="Full Name">
            <input
              required
              value={user.name || ''}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Email Address">
            <input
              type="email"
              value={user.email || ''}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Phone">
            <input
              value={user.phone || ''}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Role">
              <select
                value={user.role || 'STUDENT'}
                onChange={(e) => setUser({ ...user, role: e.target.value })}
                style={inputStyle}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Account Status">
              <select
                value={user.status || 'ACTIVE'}
                onChange={(e) => setUser({ ...user, status: e.target.value })}
                style={inputStyle}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Learner Type">
              <select
                value={user.learnerType || 'SCHOOL'}
                onChange={(e) => setUser({ ...user, learnerType: e.target.value })}
                style={inputStyle}
              >
                {['SCHOOL', 'COLLEGE', 'SKILLS', 'EXAM'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Student Username (Parent link)">
              <input
                value={user.studentUsername || ''}
                onChange={(e) => setUser({ ...user, studentUsername: e.target.value })}
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. USER HISTORY & AUDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────

function UserHistoryModal({ user, onClose, onUnlock, onRevokeSessions }) {
  const isLocked = user.lockoutUntil && new Date(user.lockoutUntil) > new Date();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 999,
      }}
    >
      <div
        style={{
          ...panelStyle,
          width: '100%',
          maxWidth: 720,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{user.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {user.email || user.phone} · Role: {user.role} · Status: {user.status}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {isLocked && (
            <button
              type="button"
              onClick={() => onUnlock(user.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: '#22c55e',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Unlock size={14} /> Unlock Account
            </button>
          )}

          <button
            type="button"
            onClick={() => onRevokeSessions(user.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} /> Revoke All Active Sessions
          </button>
        </div>

        {/* Login Attempts History */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>Recent Login History</h3>
        <div
          style={{
            maxHeight: 200,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {user.loginAttempts?.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <tbody>
                {user.loginAttempts.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                      <span
                        style={{
                          color: a.status === 'SUCCESS' ? '#22c55e' : a.status === 'BLOCKED' ? '#f59e0b' : '#ef4444',
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{a.ipAddress || '127.0.0.1'}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                      {a.failureReason || 'Normal login'}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 14, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No login attempts on record.
            </div>
          )}
        </div>

        {/* Authentication Sessions & Providers */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>Session History (Auth Providers & Timestamps)</h3>
        <div
          style={{
            maxHeight: 200,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {user.sessionLogs?.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Auth Provider</th>
                  <th style={{ padding: '8px 10px' }}>IP Address</th>
                  <th style={{ padding: '8px 10px' }}>User Agent / Device</th>
                  <th style={{ padding: '8px 10px' }}>Logged In At</th>
                </tr>
              </thead>
              <tbody>
                {user.sessionLogs.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: s.authType === 'GOOGLE' ? 'rgba(66, 133, 244, 0.15)' : s.authType === 'PHONE_OTP' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: s.authType === 'GOOGLE' ? '#4285F4' : s.authType === 'PHONE_OTP' ? '#22c55e' : '#6366f1',
                      }}>
                        {s.authType}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{s.ipAddress || '127.0.0.1'}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.userAgent}>
                      {s.userAgent || 'Unknown Device'}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                      {new Date(s.loginAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 14, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No active session logs on record.
            </div>
          )}
        </div>

        {/* Change History */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 10 }}>Account Audit & Change History</h3>
        <div
          style={{
            maxHeight: 200,
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
          }}
        >
          {user.changeLogs?.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <tbody>
                {user.changeLogs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>{l.action}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                      By: {l.changedBy?.name || 'Self'}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <pre style={{ margin: 0, fontSize: '0.72rem', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(l.details)}
                      </pre>
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                      {new Date(l.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 14, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No changes recorded for this user.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CURRICULUM MANAGER (SUBJECTS & TOPICS)
// ─────────────────────────────────────────────────────────────────────────────

function CurriculumManagerPanel({
  subjects,
  onOpenCreateModal,
  onEditSubject,
  onDeleteSubject,
  onAddTopic,
  onDeleteTopic,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [topicInputs, setTopicInputs] = useState({});
  const [search, setSearch] = useState('');
  const [eduFilter, setEduFilter] = useState('');

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTopicInputChange = (subjectId, value) => {
    setTopicInputs((prev) => ({ ...prev, [subjectId]: value }));
  };

  const submitInlineTopic = (e, subjectId) => {
    e.preventDefault();
    const title = (topicInputs[subjectId] || '').trim();
    if (!title) return;
    onAddTopic(subjectId, { title });
    setTopicInputs((prev) => ({ ...prev, [subjectId]: '' }));
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    const matchesEdu = !eduFilter || s.educationType === eduFilter;
    return matchesSearch && matchesEdu;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header with Title & Create Button */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Library size={22} color="var(--accent-primary)" /> Curriculum & Subjects Manager
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Create and maintain academic curricula, syllabus topics, and educational tracks dynamically in PostgreSQL.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 9,
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Plus size={18} /> Create New Subject
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ ...panelStyle, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search subjects by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }}
          />
        </div>
        <select
          value={eduFilter}
          onChange={(e) => setEduFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: 170, marginTop: 0 }}
        >
          <option value="">All Education Tracks</option>
          <option value="SCHOOL">School (K-12)</option>
          <option value="COLLEGE">College / University</option>
          <option value="SKILLS">Career & Skills</option>
          <option value="EXAM">Competitive Exam</option>
        </select>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredSubjects.length} of {subjects.length} subjects
        </span>
      </div>

      {/* Expandable Subject Cards */}
      <div style={{ display: 'grid', gap: 14 }}>
        {filteredSubjects.length === 0 ? (
          <div style={{ ...panelStyle, textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No curriculum subjects found. Click <strong>+ Create New Subject</strong> to create one.
          </div>
        ) : (
          filteredSubjects.map((s) => {
            const isExpanded = expandedIds.has(s.id);
            const topicCount = s.topics?.length || 0;

            return (
              <div
                key={s.id}
                style={{
                  ...panelStyle,
                  padding: '16px 20px',
                  border: isExpanded ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Subject Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(s.id)}
                      title={isExpanded ? 'Collapse topics' : 'Expand topics'}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: 6,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {s.name}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          {s.category}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background:
                              s.educationType === 'COLLEGE'
                                ? 'rgba(168, 85, 247, 0.15)'
                                : s.educationType === 'SKILLS'
                                ? 'rgba(6, 182, 212, 0.15)'
                                : 'rgba(34, 197, 94, 0.15)',
                            color:
                              s.educationType === 'COLLEGE'
                                ? '#a855f7'
                                : s.educationType === 'SKILLS'
                                ? '#06b6d4'
                                : '#22c55e',
                          }}
                        >
                          {s.educationType}
                        </span>
                        {(s.class || s.board) && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {[s.class && `Class ${s.class}`, s.board].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        {(s.degree || s.branch) && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {[s.degree, s.branch, s.semester && `Sem ${s.semester}`].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        {s.exam && (
                          <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                            Target: {s.exam}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                        {topicCount} {topicCount === 1 ? 'topic' : 'topics'} in syllabus · Updated{' '}
                        {new Date(s.updatedAt || s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => onEditSubject(s)}
                      title="Edit subject metadata"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 7,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSubject(s.id, s.name)}
                      title="Delete subject and topics"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 7,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* Expanded Topics Area */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      SYLLABUS TOPICS ({topicCount})
                    </div>

                    {topicCount === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No topics added to this subject yet. Add one below.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {s.topics.map((t, idx) => (
                          <div
                            key={t.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--accent-primary)',
                                }}
                              >
                                #{t.order || idx + 1}
                              </span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {t.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onDeleteTopic(t.id, t.title)}
                              title="Delete topic"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Add Topic Form */}
                    <form
                      onSubmit={(e) => submitInlineTopic(e, s.id)}
                      style={{ display: 'flex', gap: 8, marginTop: 8 }}
                    >
                      <input
                        required
                        placeholder="Enter new topic title..."
                        value={topicInputs[s.id] || ''}
                        onChange={(e) => handleTopicInputChange(s.id, e.target.value)}
                        style={{ ...inputStyle, marginTop: 0, flex: 1 }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: '9px 16px',
                          borderRadius: 8,
                          background: 'var(--accent-primary)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Plus size={16} /> Add Topic
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. COURSE CATALOG MANAGER (COURSES & MODULES)
// ─────────────────────────────────────────────────────────────────────────────

function CourseCatalogPanel({
  courses,
  onOpenCreateModal,
  onEditCourse,
  onDeleteCourse,
  onTogglePublish,
  onOpenAddModuleModal,
  onDeleteModule,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('');

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = !diffFilter || c.difficulty === diffFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={22} color="var(--accent-primary)" /> Course Catalog & Module Manager
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Publish, update, and manage modular courses. Changes immediately reflect in the student Course Catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 9,
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Plus size={18} /> Create Course
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ ...panelStyle, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search courses by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }}
          />
        </div>
        <select
          value={diffFilter}
          onChange={(e) => setDiffFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: 170, marginTop: 0 }}
        >
          <option value="">All Difficulties</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredCourses.length} of {courses.length} courses
        </span>
      </div>

      {/* Courses List */}
      <div style={{ display: 'grid', gap: 14 }}>
        {filteredCourses.length === 0 ? (
          <div style={{ ...panelStyle, textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No courses found. Click <strong>+ Create Course</strong> to author your first course.
          </div>
        ) : (
          filteredCourses.map((c) => {
            const isExpanded = expandedIds.has(c.id);
            const moduleCount = c.modules?.length || 0;
            const enrolledCount = c._count?.enrollments || 0;

            return (
              <div
                key={c.id}
                style={{
                  ...panelStyle,
                  padding: '18px 20px',
                  border: isExpanded ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Course Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 280 }}>
                    {c.thumbnail ? (
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 10,
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        <BookOpen size={28} />
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {c.title}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          {c.category}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background:
                              c.difficulty === 'ADVANCED'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : c.difficulty === 'INTERMEDIATE'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(34, 197, 94, 0.15)',
                            color:
                              c.difficulty === 'ADVANCED'
                                ? '#ef4444'
                                : c.difficulty === 'INTERMEDIATE'
                                ? '#3b82f6'
                                : '#22c55e',
                          }}
                        >
                          {c.difficulty}
                        </span>
                        {/* Publish Status Pill */}
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: c.isPublished ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: c.isPublished ? '#22c55e' : '#f59e0b',
                            border: `1px solid ${c.isPublished ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                          }}
                        >
                          {c.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </div>
                      {c.description && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0', lineHeight: 1.4 }}>
                          {c.description}
                        </p>
                      )}
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 6, display: 'flex', gap: 14 }}>
                        <span>📚 {moduleCount} {moduleCount === 1 ? 'module' : 'modules'}</span>
                        <span>👥 {enrolledCount} enrolled</span>
                        <span>Instructor: {c.instructor?.name || 'EduNova Faculty'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column / Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Publish/Unpublish Toggle */}
                    <button
                      type="button"
                      onClick={() => onTogglePublish(c.id, !c.isPublished)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        background: c.isPublished ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.15)',
                        border: `1px solid ${c.isPublished ? '#f59e0b' : '#22c55e'}`,
                        color: c.isPublished ? '#f59e0b' : '#22c55e',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={14} />
                      {c.isPublished ? 'Unpublish' : 'Publish'}
                    </button>

                    {/* Add Module Button */}
                    <button
                      type="button"
                      onClick={() => onOpenAddModuleModal(c)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Plus size={14} /> Add Module
                    </button>

                    {/* Edit Course */}
                    <button
                      type="button"
                      onClick={() => onEditCourse(c)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Edit3 size={14} /> Edit
                    </button>

                    {/* Delete Course */}
                    <button
                      type="button"
                      onClick={() => onDeleteCourse(c.id, c.title)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>

                    {/* Expand/Collapse Modules */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(c.id)}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: '7px 10px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Modules Area */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      COURSE MODULES ({moduleCount})
                    </div>

                    {moduleCount === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No modules created yet. Click <strong>+ Add Module</strong> above to structure lessons.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {c.modules.map((m, idx) => (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 14px',
                              borderRadius: 8,
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--accent-primary)',
                                }}
                              >
                                #{m.order || idx + 1}
                              </span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {m.title}
                              </span>
                              {m.duration > 0 && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  ⏱ {m.duration} min
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => onDeleteModule(m.id, m.title)}
                              title="Delete module"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. QUIZ BUILDER PANEL
// ─────────────────────────────────────────────────────────────────────────────

function QuizBuilderPanel({
  quizzes,
  subjects,
  onOpenCreateModal,
  onDeleteQuiz,
  onOpenAddQuestionModal,
  onDeleteQuestion,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch = !search || q.title.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = !subjectFilter || q.subjectId === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={22} color="var(--accent-primary)" /> Quiz Builder & Evaluation Engine
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Build multi-choice quizzes mapped directly to curriculum subjects and topics with automated evaluation.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 9,
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Plus size={18} /> Create New Quiz
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ ...panelStyle, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search quizzes by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }}
          />
        </div>
        <SubjectSelect
          value={subjectFilter}
          onChange={(e, val) => setSubjectFilter(val || e.target.value)}
          subjects={subjects}
          placeholder="All Subjects (Filter Quizzes)"
          style={{ width: 'auto', minWidth: 240 }}
        />
        {(subjectFilter || search) && (
          <button
            type="button"
            onClick={() => { setSubjectFilter(''); setSearch(''); }}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        )}
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredQuizzes.length} of {quizzes.length} quizzes
        </span>
      </div>

      {/* Quizzes List */}
      <div style={{ display: 'grid', gap: 14 }}>
        {filteredQuizzes.length === 0 ? (
          <div style={{ ...panelStyle, textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div>
              {subjectFilter || search ? (
                <span>No quizzes matching your current subject/title filter.</span>
              ) : (
                <span>No quizzes created yet. Click <strong>+ Create New Quiz</strong> to construct a diagnostic quiz.</span>
              )}
            </div>
            {(subjectFilter || search) && (
              <button
                type="button"
                onClick={() => { setSubjectFilter(''); setSearch(''); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Show All {quizzes.length} Quizzes
              </button>
            )}
          </div>
        ) : (
          filteredQuizzes.map((q) => {
            const isExpanded = expandedIds.has(q.id);
            const questionCount = q.questions?.length || 0;
            const attemptCount = q._count?.attempts || 0;

            return (
              <div
                key={q.id}
                style={{
                  ...panelStyle,
                  padding: '18px 20px',
                  border: isExpanded ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {q.title}
                      </span>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {q.subject?.name || 'General'}
                      </span>
                      {q.topic?.title && (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: 'rgba(6, 182, 212, 0.15)',
                            color: '#06b6d4',
                          }}
                        >
                          Topic: {q.topic.title}
                        </span>
                      )}
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background:
                            q.difficulty === 'ADVANCED'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : q.difficulty === 'INTERMEDIATE'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(34, 197, 94, 0.15)',
                          color:
                            q.difficulty === 'ADVANCED'
                              ? '#ef4444'
                              : q.difficulty === 'INTERMEDIATE'
                              ? '#3b82f6'
                              : '#22c55e',
                        }}
                      >
                        {q.difficulty}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                      {questionCount} questions configured · {attemptCount} student attempts recorded
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => onOpenAddQuestionModal(q)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Plus size={14} /> Add Question
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpand(q.id)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      Questions ({questionCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteQuiz(q.id, q.title)}
                      title="Delete quiz"
                      style={{
                        padding: '7px 10px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded Questions Area */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {questionCount === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No questions added yet. Click <strong>+ Add Question</strong> to author questions with 4 options and automated answers.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 12 }}>
                        {q.questions.map((question, qIdx) => {
                          const options = Array.isArray(question.options)
                            ? question.options
                            : typeof question.options === 'string'
                            ? JSON.parse(question.options || '[]')
                            : [];

                          return (
                            <div
                              key={question.id}
                              style={{
                                padding: '14px',
                                borderRadius: 10,
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                  <span style={{ color: 'var(--accent-primary)', marginRight: 6 }}>Q{qIdx + 1}.</span>
                                  {question.questionText}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onDeleteQuestion(question.id)}
                                  title="Delete question"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: 4,
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              {/* Options Grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                                {options.map((opt, optIdx) => {
                                  const isCorrect = optIdx === question.correctOptionIndex;
                                  return (
                                    <div
                                      key={optIdx}
                                      style={{
                                        padding: '8px 12px',
                                        borderRadius: 7,
                                        fontSize: '0.82rem',
                                        background: isCorrect ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-secondary)',
                                        border: isCorrect ? '1.5px solid #22c55e' : '1px solid var(--border-color)',
                                        color: isCorrect ? '#22c55e' : 'var(--text-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontWeight: isCorrect ? 700 : 500,
                                      }}
                                    >
                                      <span>
                                        <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                                      </span>
                                      {isCorrect && <Check size={14} color="#22c55e" />}
                                    </div>
                                  );
                                })}
                              </div>

                              {question.explanation && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 6 }}>
                                  💡 <strong>Explanation:</strong> {question.explanation}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. GAMIFICATION & MISSIONS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function MissionsPanel({
  missions,
  onOpenCreateModal,
  onEditMission,
  onDeleteMission,
  onToggleActive,
}) {
  const [periodFilter, setPeriodFilter] = useState('');
  const [search, setSearch] = useState('');

  const filteredMissions = missions.filter((m) => {
    const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchesPeriod = !periodFilter || m.period === periodFilter;
    return matchesSearch && matchesPeriod;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={22} color="var(--accent-primary)" /> Gamification & Missions Manager
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Author daily and weekly quests, define XP rewards, and toggle active status dynamically.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 9,
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
          }}
        >
          <Plus size={18} /> Create Mission
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ ...panelStyle, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search missions by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }}
          />
        </div>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: 170, marginTop: 0 }}
        >
          <option value="">All Periods</option>
          <option value="DAILY">Daily Missions</option>
          <option value="WEEKLY">Weekly Missions</option>
        </select>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredMissions.length} of {missions.length} missions
        </span>
      </div>

      {/* Missions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        {filteredMissions.length === 0 ? (
          <div style={{ ...panelStyle, gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No missions found. Click <strong>+ Create Mission</strong> to motivate students with custom XP rewards.
          </div>
        ) : (
          filteredMissions.map((m) => {
            const completionCount = m._count?.userMissions || 0;

            return (
              <div
                key={m.id}
                style={{
                  ...panelStyle,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: m.isActive ? '1px solid var(--border-color)' : '1px dashed var(--border-color)',
                  opacity: m.isActive ? 1 : 0.65,
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {m.title}
                    </h3>
                    {/* Interactive Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => onToggleActive(m.id, !m.isActive)}
                      title={m.isActive ? 'Click to deactivate' : 'Click to activate'}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        background: m.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                        border: `1px solid ${m.isActive ? '#22c55e' : '#64748b'}`,
                        color: m.isActive ? '#22c55e' : '#94a3b8',
                      }}
                    >
                      {m.isActive ? <Check size={12} /> : null}
                      {m.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>

                  {m.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '8px 0 0', lineHeight: 1.4 }}>
                      {m.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: m.period === 'DAILY' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                        color: m.period === 'DAILY' ? '#06b6d4' : '#a855f7',
                      }}
                    >
                      {m.period}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {m.category}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: 'rgba(245, 158, 11, 0.18)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                      }}
                    >
                      +{m.rewardXp} XP
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    👥 {completionCount} student {completionCount === 1 ? 'claim' : 'claims'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => onEditMission(m)}
                      title="Edit mission details"
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteMission(m.id, m.title)}
                      title="Delete mission"
                      style={{
                        padding: '5px 8px',
                        borderRadius: 6,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. MODAL DIALOGS
// ─────────────────────────────────────────────────────────────────────────────

function SubjectModal({ subject, onSubmit, onClose, busy }) {
  const [form, setForm] = useState({
    name: subject.name || '',
    category: subject.category || '',
    educationType: subject.educationType || 'SCHOOL',
    class: subject.class || '',
    board: subject.board || '',
    degree: subject.degree || '',
    branch: subject.branch || '',
    semester: subject.semester || '',
    exam: subject.exam || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          ...panelStyle,
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            {subject.id ? 'Edit Subject Details' : 'Create New Curriculum Subject'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <Field label="Subject Name *">
            <input
              required
              placeholder="e.g. Organic Chemistry, Data Structures, Modern Physics"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Category *">
              <input
                required
                placeholder="e.g. Science, Core CS, Math"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <Field label="Education Track *">
              <select
                value={form.educationType}
                onChange={(e) => setForm({ ...form, educationType: e.target.value })}
                style={inputStyle}
              >
                <option value="SCHOOL">School (K-12)</option>
                <option value="COLLEGE">College / University</option>
                <option value="SKILLS">Career & Skills</option>
                <option value="EXAM">Competitive Exam</option>
              </select>
            </Field>
          </div>

          {form.educationType === 'SCHOOL' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Class / Standard">
                <input
                  placeholder="e.g. 10, 11, 12"
                  value={form.class}
                  onChange={(e) => setForm({ ...form, class: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Board">
                <input
                  placeholder="e.g. CBSE, ICSE, State"
                  value={form.board}
                  onChange={(e) => setForm({ ...form, board: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>
          )}

          {form.educationType === 'COLLEGE' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Degree">
                  <input
                    placeholder="e.g. B.Tech, BCA, B.Sc"
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Branch">
                  <input
                    placeholder="e.g. Computer Science"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <Field label="Semester">
                <input
                  placeholder="e.g. 1, 3, 5"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </>
          )}

          {form.educationType === 'EXAM' && (
            <Field label="Target Examination">
              <input
                placeholder="e.g. JEE Mains, NEET, CMAT, GATE"
                value={form.exam}
                onChange={(e) => setForm({ ...form, exam: e.target.value })}
                style={inputStyle}
              />
            </Field>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 800,
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {subject.id ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CourseModal({ course, onSubmit, onClose, busy }) {
  const [form, setForm] = useState({
    title: course.title || '',
    category: course.category || '',
    difficulty: course.difficulty || 'BEGINNER',
    description: course.description || '',
    thumbnail: course.thumbnail || '',
    isPublished: course.isPublished !== undefined ? course.isPublished : true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          ...panelStyle,
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            {course.id ? 'Edit Course Details' : 'Create New Course'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <Field label="Course Title *">
            <input
              required
              placeholder="e.g. Full-Stack Web Development Mastery"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Category *">
              <input
                required
                placeholder="e.g. Web Development, AI, Physics"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <Field label="Difficulty Level *">
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                style={inputStyle}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea
              rows={3}
              placeholder="Comprehensive syllabus overview, learning outcomes..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Thumbnail Image URL">
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Publish immediately (visible to all students in Course Catalog)
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 800,
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {course.id ? 'Save Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModuleModal({ course, onSubmit, onClose, busy }) {
  const [form, setForm] = useState({
    title: '',
    duration: 30,
    order: (course.modules?.length || 0) + 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: form.title,
      duration: parseInt(form.duration, 10) || 0,
      order: parseInt(form.order, 10) || 1,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          ...panelStyle,
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-secondary)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Add Course Module</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: 2 }}>{course.title}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <Field label="Module Title *">
            <input
              required
              placeholder="e.g. Module 1: Introduction to Reactive State"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Duration (Minutes)">
              <input
                type="number"
                min="0"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <Field label="Module Order (#)">
              <input
                type="number"
                min="1"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 800,
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              Add Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuizModal({ subjects, onSubmit, onClose, busy }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [totalQuestions, setTotalQuestions] = useState(5);

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const availableTopics = selectedSubject?.topics || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      subjectId,
      topicId: topicId || null,
      title,
      difficulty,
      totalQuestions: parseInt(totalQuestions, 10) || 5,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          ...panelStyle,
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg-secondary)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Create New Quiz</h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <Field label="Curriculum Subject *">
            <SubjectSelect
              value={subjectId}
              onChange={(e, val) => {
                setSubjectId(val || e.target.value);
                setTopicId('');
              }}
              subjects={subjects}
              placeholder="Select Curriculum Subject..."
            />
          </Field>

          {availableTopics.length > 0 && (
            <Field label="Curriculum Topic (Optional)">
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                style={inputStyle}
              >
                <option value="">General Subject Quiz (All Topics)</option>
                {availableTopics.map((top) => (
                  <option key={top.id} value={top.id}>
                    #{top.order} - {top.title}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Quiz Title *">
            <input
              required
              placeholder="e.g. Diagnostic Evaluation: Thermodynamics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Difficulty *">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={inputStyle}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </Field>

            <Field label="Target Total Questions">
              <input
                type="number"
                min="1"
                max="50"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 800,
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              Create Quiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionModal({ quiz, onSubmit, onClose, busy }) {
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [explanation, setExplanation] = useState('');

  const handleOptionChange = (idx, val) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (options.some((o) => !o.trim())) {
      alert('Please fill out all 4 option choices.');
      return;
    }
    onSubmit({
      questionText,
      options,
      correctOptionIndex,
      explanation: explanation || null,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          ...panelStyle,
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Add Multiple Choice Question</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: 2 }}>{quiz.title}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <Field label="Question Text *">
            <textarea
              required
              rows={3}
              placeholder="e.g. What is the derivative of sin(2x) with respect to x?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
              Options (Select the radio button for the correct answer) *
            </label>
            <div style={{ display: 'grid', gap: 8 }}>
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-primary)',
                    border: correctOptionIndex === idx ? '1.5px solid #22c55e' : '1px solid var(--border-color)',
                  }}
                >
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctOptionIndex === idx}
                    onChange={() => setCorrectOptionIndex(idx)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: correctOptionIndex === idx ? '#22c55e' : 'var(--text-muted)', width: 20 }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <input
                    required
                    placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    style={{ ...inputStyle, marginTop: 0, flex: 1, border: 'none', background: 'transparent', padding: '4px 0' }}
                  />
                  {correctOptionIndex === idx && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#22c55e' }}>Correct Answer</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Field label="Answer Explanation (Optional)">
            <textarea
              rows={2}
              placeholder="Detailed step-by-step reasoning or formula breakdown..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 800,
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              Add Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MissionModal({ mission, onSubmit, onClose, busy }) {
  const [form, setForm] = useState({
    title: mission.title || '',
    description: mission.description || '',
    rewardXp: mission.rewardXp || 50,
    category: mission.category || 'learning',
    period: mission.period || 'DAILY',
    isActive: mission.isActive !== undefined ? mission.isActive : true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      rewardXp: parseInt(form.rewardXp, 10) || 50,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          ...panelStyle,
          width: '100%',
          maxWidth: 500,
          background: 'var(--bg-secondary)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            {mission.id ? 'Edit Mission' : 'Create Gamified Mission'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <Field label="Mission Title *">
            <input
              required
              placeholder="e.g. Master Trigonometry Ratios, 3-Day Study Streak"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={2}
              placeholder="Instructions and requirements for completing this quest..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Period *">
              <select
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                style={inputStyle}
              >
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
              </select>
            </Field>

            <Field label="Category *">
              <input
                required
                placeholder="e.g. learning, streak, quiz"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Reward XP *">
            <input
              type="number"
              min="0"
              required
              value={form.rewardXp}
              onChange={(e) => setForm({ ...form, rewardXp: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Active (students can view and earn XP immediately)
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 800,
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {mission.id ? 'Save Mission' : 'Create Mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TWO-FACTOR AUTHENTICATION (2FA) MODAL
// ─────────────────────────────────────────────────────────────────────────────

function TwoFactorModal({ isOpen, status, onClose, onStatusChange, notify }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Setup flow state
  const [setupData, setSetupData] = useState(null); // { secret, qrCodeDataUrl, otpauthUrl }
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Active view: 'setup' | 'manage' | 'confirm_disable' | 'confirm_regen' | 'recovery_reveal'
  const [view, setView] = useState(status?.twoFactorEnabled ? 'manage' : 'setup');
  const [confirmInput, setConfirmInput] = useState('');

  useEffect(() => {
    if (!status?.twoFactorEnabled) {
      setView('setup');
      setSubmitting(true);
      setError('');
      authApi
        .setupTwoFactor()
        .then((res) => {
          setSetupData(res.data);
        })
        .catch((err) => {
          setError(err.message || 'Failed to initiate 2FA setup');
        })
        .finally(() => setSubmitting(false));
    } else {
      setView('manage');
    }
  }, [status?.twoFactorEnabled]);

  const handleEnable = async (e) => {
    e.preventDefault();
    if (!totpCode || totpCode.trim().length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await authApi.enableTwoFactor({ code: totpCode.trim(), secret: setupData.secret });
      onStatusChange({ twoFactorEnabled: true, recoveryCodesLeft: res.data?.recoveryCodes?.length || 8 });
      setRecoveryCodes(res.data?.recoveryCodes || []);
      setView('recovery_reveal');
      notify('Two-Factor Authentication successfully enabled!');
    } catch (err) {
      setError(err.message || 'Failed to verify 2FA code. Please check device clock.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (!confirmInput.trim()) {
      setError('Please enter your 6-digit code or account password');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const val = confirmInput.trim();
      const isDigits = /^\d{6}$/.test(val);
      const payload = isDigits ? { code: val } : { password: val };
      await authApi.disableTwoFactor(payload);
      onStatusChange({ twoFactorEnabled: false, recoveryCodesLeft: 0 });
      notify('Two-Factor Authentication has been disabled');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateCodes = async (e) => {
    e.preventDefault();
    if (!confirmInput.trim()) {
      setError('Please enter your 6-digit code or account password');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const val = confirmInput.trim();
      const isDigits = /^\d{6}$/.test(val);
      const payload = isDigits ? { code: val } : { password: val };
      const res = await authApi.generateNewRecoveryCodes(payload);
      setRecoveryCodes(res.data?.recoveryCodes || []);
      onStatusChange({ twoFactorEnabled: true, recoveryCodesLeft: res.data?.recoveryCodes?.length || 8 });
      setView('recovery_reveal');
      notify('New backup recovery codes generated!');
    } catch (err) {
      setError(err.message || 'Failed to regenerate recovery codes');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, type = 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          ...panelStyle,
          width: '100%',
          maxWidth: 540,
          background: 'var(--bg-secondary)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          border: '1px solid var(--border-color)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: status?.twoFactorEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: status?.twoFactorEnabled ? '#22c55e' : '#3b82f6',
              }}
            >
              <Lock size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Two-Factor Authentication (2FA)</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                RFC 6238 Time-Based One-Time Password (TOTP)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.88rem',
              marginBottom: 16,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* VIEW 1: SETUP (QR CODE + VERIFY) */}
        {view === 'setup' && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Scan the QR code with an authenticator app (such as Google Authenticator, Microsoft Authenticator, or 1Password) and enter the 6-digit verification code below.
            </p>

            {submitting && !setupData ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                <p>Generating cryptographically secure secret and QR code...</p>
              </div>
            ) : setupData ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 16,
                  }}
                >
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="2FA QR Code"
                    style={{ width: 190, height: 190, display: 'block' }}
                  />
                  <span style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 8, fontWeight: 600 }}>
                    EduNova Admin Protection
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    marginBottom: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Manual Secret Key
                    </div>
                    <code style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.06em' }}>
                      {setupData.secret}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(setupData.secret, 'secret')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: copiedSecret ? '#22c55e' : 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                    {copiedSecret ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <form onSubmit={handleEnable}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Enter 6-Digit Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    style={{
                      ...inputStyle,
                      textAlign: 'center',
                      fontSize: '1.4rem',
                      letterSpacing: '0.3em',
                      fontWeight: 800,
                      padding: '10px',
                      marginBottom: 16,
                    }}
                    autoFocus
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || totpCode.length !== 6}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        fontWeight: 800,
                        border: 'none',
                        cursor: submitting || totpCode.length !== 6 ? 'not-allowed' : 'pointer',
                        opacity: submitting || totpCode.length !== 6 ? 0.7 : 1,
                      }}
                    >
                      {submitting ? 'Verifying...' : 'Verify & Enable 2FA'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW 2: RECOVERY CODES REVEAL */}
        {view === 'recovery_reveal' && (
          <div>
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: 8,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={32} color="#22c55e" style={{ margin: '0 auto 6px' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#22c55e' }}>
                2FA Successfully Enabled
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Save your backup recovery codes in a secure location.
              </p>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              If you lose your phone or access to your authenticator app, each of these backup codes can be used once to log in to your account.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                background: 'var(--bg-primary)',
                padding: 14,
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                marginBottom: 16,
              }}
            >
              {recoveryCodes?.map((code, idx) => (
                <div
                  key={idx}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'var(--bg-secondary)',
                    textAlign: 'center',
                    color: 'var(--text-primary)',
                  }}
                >
                  {code}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => copyToClipboard(recoveryCodes?.join('\n') || '', 'codes')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: copiedCodes ? '#22c55e' : 'var(--text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                }}
              >
                {copiedCodes ? <Check size={16} /> : <Copy size={16} />}
                {copiedCodes ? 'All Codes Copied!' : 'Copy All Codes'}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: MANAGE ACTIVE 2FA */}
        {view === 'manage' && (
          <div>
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <ShieldCheck size={36} color="#22c55e" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#22c55e' }}>
                  Two-Factor Authentication is Active
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Your account is guarded with TOTP verification and backup recovery codes.
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-primary)',
                padding: 14,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Active Recovery Codes:
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: status?.recoveryCodesLeft > 2 ? '#22c55e' : '#f59e0b',
                  }}
                >
                  {status?.recoveryCodesLeft ?? '8'} remaining
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setConfirmInput('');
                  setView('confirm_regen');
                }}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Regenerate Backup Recovery Codes
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setConfirmInput('');
                  setView('confirm_disable');
                }}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 8,
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Disable Two-Factor Authentication
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: CONFIRM REGENERATE CODES */}
        {view === 'confirm_regen' && (
          <form onSubmit={handleRegenerateCodes}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Regenerating recovery codes will invalidate all existing recovery codes. Enter your current 6-digit TOTP code or password to authorize.
            </p>

            <Field label="6-Digit Code or Password">
              <input
                type="password"
                required
                placeholder="6-digit code or account password"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                style={inputStyle}
                autoFocus
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setView('manage')}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontWeight: 800,
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Regenerating...' : 'Confirm & Regenerate'}
              </button>
            </div>
          </form>
        )}

        {/* VIEW 5: CONFIRM DISABLE 2FA */}
        {view === 'confirm_disable' && (
          <form onSubmit={handleDisable}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: 16,
              }}
            >
              <strong>Warning:</strong> Disabling two-factor authentication leaves your administrative account vulnerable to credential stuffing and phishing attacks.
            </div>

            <Field label="6-Digit TOTP Code or Account Password">
              <input
                type="password"
                required
                placeholder="Enter current 6-digit code or password"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                style={inputStyle}
                autoFocus
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setView('manage')}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 800,
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Disabling...' : 'Confirm & Disable 2FA'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
