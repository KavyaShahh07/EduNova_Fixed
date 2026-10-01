import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  FileText,
  GraduationCap,
  Sparkles,
  Glasses,
  Network,
  Repeat,
  LayoutGrid,
  FlaskConical,
  TrendingUp,
  Award,
  Users,
  User,
  Settings,
  ChevronRight,
  ChevronLeft,
  CheckSquare,
  Gamepad2,
  ShieldCheck,
  ShieldAlert,
  Library,
  HelpCircle,
  Zap,
  History,
  Compass,
  HeartHandshake,
  Sliders,
  LayoutDashboard,
  Film,
  BarChart2,
  HeartPulse,
  Bot,
  Shield,
  AlertOctagon,
  Bell,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Sidebar = () => {
  const { isParent, user } = useAuth();
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isParentMode = isParent || location.pathname.startsWith('/parent');
  const isAdmin = user?.role === 'ADMIN';
  const isInstructor = user?.role === 'INSTRUCTOR';

  // ── Role Specific Navigation Sets ───────────────────────────────────────────
  let roleTitle = 'STUDENT PORTAL';
  let roleSubtitle = user?.learnerType ? `${user.learnerType} Learner` : 'Academic Track';
  let roleBadgeBg = isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.16)';
  let roleBadgeColor = isLight ? '#0284c7' : '#38bdf8';
  let roleBadgeBorder = isLight ? 'rgba(2, 132, 199, 0.25)' : 'rgba(56, 189, 248, 0.3)';
  let RoleIcon = Sparkles;

  let navItems = [];

  if (isAdmin) {
    roleTitle = 'ADMIN CONSOLE';
    roleSubtitle = 'System & Governance';
    roleBadgeBg = isLight ? 'rgba(124, 58, 237, 0.12)' : 'rgba(168, 85, 247, 0.16)';
    roleBadgeColor = isLight ? '#7c3aed' : '#c084fc';
    roleBadgeBorder = isLight ? 'rgba(124, 58, 237, 0.25)' : 'rgba(168, 85, 247, 0.3)';
    RoleIcon = ShieldCheck;

    navItems = [
      { label: 'Admin Overview', path: '/admin?tab=overview', icon: LayoutDashboard },
      { label: 'Platform Analytics', path: '/admin?tab=analytics', icon: BarChart2 },
      { label: 'System Health', path: '/admin?tab=health', icon: HeartPulse },
      { label: 'Sage AI Control Center', path: '/admin?tab=sage-ai', icon: Bot },
      { label: 'User & Access Control', path: '/admin?tab=users', icon: Users },
      { label: 'Security Center', path: '/admin?tab=security', icon: Shield },
      { label: 'Moderation Center', path: '/admin?tab=moderation', icon: AlertOctagon },
      { label: 'Notification Center', path: '/admin?tab=notifications', icon: Bell },
      { label: 'Feature Control', path: '/admin?tab=feature-flags', icon: Sliders },
      { label: 'Curriculum Manager', path: '/admin?tab=curriculum', icon: Library },
      { label: 'Course Catalog', path: '/admin?tab=courses', icon: BookOpen },
      { label: 'Media & File Hub', path: '/admin?tab=materials', icon: Film },
      { label: 'Quiz Builder', path: '/admin?tab=quizzes', icon: HelpCircle },
      { label: 'Missions & Rewards', path: '/admin?tab=missions', icon: Zap },
      { label: 'Data & Backup', path: '/admin?tab=data-backup', icon: Database },
      { label: 'Login Attempts', path: '/admin?tab=logins', icon: ShieldAlert },
      { label: 'Data Change Logs', path: '/admin?tab=audits', icon: History },
      { label: 'Admin Profile', path: '/profile', icon: User },
      { label: 'Platform Settings', path: '/settings', icon: Settings }
    ];
  } else if (isInstructor) {
    roleTitle = 'INSTRUCTOR STUDIO';
    roleSubtitle = 'Teaching & Courseware';
    roleBadgeBg = isLight ? 'rgba(37, 99, 235, 0.12)' : 'rgba(96, 165, 250, 0.16)';
    roleBadgeColor = isLight ? '#2563eb' : '#60a5fa';
    roleBadgeBorder = isLight ? 'rgba(37, 99, 235, 0.25)' : 'rgba(96, 165, 250, 0.3)';
    RoleIcon = GraduationCap;

    navItems = [
      { label: 'Studio Overview', path: '/instructor/dashboard', icon: Home },
      { label: 'Assigned Courses', path: '/instructor/courses', icon: BookOpen },
      { label: 'Upload Media & Videos', path: '/instructor/materials', icon: Film },
      { label: 'Enrolled Students', path: '/instructor/students', icon: Users },
      { label: 'Assessments & Quizzes', path: '/instructor/assessments', icon: CheckSquare },
      { label: 'Smart Notes', path: '/notes', icon: FileText },
      { label: 'Curriculum Explorer', path: '/courses', icon: GraduationCap },
      { label: 'Sage AI Assistant', path: '/ai-assistant', icon: Sparkles },
      { label: 'Instructor Profile', path: '/profile', icon: User },
      { label: 'Settings', path: '/settings', icon: Settings }
    ];
  } else if (isParentMode) {
    roleTitle = 'PARENT COMPANION';
    roleSubtitle = user?.studentUsername ? `Child: @${user.studentUsername}` : 'Student Supervision';
    roleBadgeBg = isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(52, 211, 153, 0.16)';
    roleBadgeColor = isLight ? '#059669' : '#34d399';
    roleBadgeBorder = isLight ? 'rgba(16, 185, 129, 0.25)' : 'rgba(52, 211, 153, 0.3)';
    RoleIcon = HeartHandshake;

    navItems = [
      { label: 'Parent Dashboard', path: '/parent/dashboard', icon: Home },
      { label: 'Child Performance', path: '/parent/performance', icon: TrendingUp },
      { label: 'Child Academic Profile', path: '/parent/child-profile', icon: User },
      { label: 'Companion Controls', path: '/parent/settings', icon: Sliders },
      { label: 'Parent Sage AI Advisor', path: '/ai-assistant', icon: Sparkles },
      { label: 'Explore Curriculum', path: '/courses', icon: GraduationCap },
      { label: 'Account Settings', path: '/settings', icon: Settings }
    ];
  } else {
    // STUDENT ROLE (Complete Learning Suite)
    navItems = [
      { label: 'Dashboard', path: '/dashboard', icon: Home },
      { label: 'My Subjects', path: '/my-subjects', icon: BookOpen },
      { label: 'My Courses', path: '/courses', icon: GraduationCap },
      { label: 'Assignments & Tasks', path: '/tasks', icon: CheckSquare },
      { label: 'Interactive Quizzes', path: '/quizzes', icon: HelpCircle },
      { label: 'Game Center', path: '/games', icon: Gamepad2 },
      { label: 'Smart Notes', path: '/notes', icon: FileText },
      { label: 'Sage AI Tutor', path: '/ai-assistant', icon: Sparkles },
      { label: 'Study Planner', path: '/study-planner', icon: LayoutGrid },
      { label: 'Virtual Science Labs', path: '/labs', icon: FlaskConical },
      { label: 'XR Studio (Spatial)', path: '/xr-studio', icon: Glasses },
      { label: 'Knowledge Constellation', path: '/constellation', icon: Network },
      { label: 'Peer Skill Exchange', path: '/skill-exchange', icon: Repeat },
      { label: 'Progress Analytics', path: '/analytics', icon: TrendingUp },
      { label: 'Missions & Rewards', path: '/achievements', icon: Award },
      { label: 'Community Forum', path: '/community', icon: Users },
      { label: 'Student Profile', path: '/profile', icon: User },
      { label: 'Settings', path: '/settings', icon: Settings }
    ];
  }

  const sidebarWidth = isCollapsed ? '76px' : '260px';

  const checkIsActive = (itemPath) => {
    if (itemPath.includes('?')) {
      const [pathPart, queryPart] = itemPath.split('?');
      if (location.pathname === pathPart) {
        if (!location.search && queryPart === 'tab=overview') return true;
        return location.search === `?${queryPart}`;
      }
      return false;
    }
    if (itemPath === '/parent/dashboard' && (location.pathname === '/parent-dashboard' || location.pathname === '/parent')) {
      return true;
    }
    return location.pathname === itemPath;
  };

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        flexShrink: 0,
        height: 'calc(100vh - 32px)',
        margin: '16px 0 16px 16px',
        position: 'relative',
        background: isLight
          ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 246, 255, 0.88) 100%)'
          : 'linear-gradient(180deg, rgba(25, 35, 75, 0.75) 0%, rgba(15, 20, 48, 0.88) 100%)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: isLight ? '1.5px solid rgba(255, 255, 255, 0.98)' : '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: '28px',
        display: 'flex',
        flexDirection: 'column',
        padding: isCollapsed ? '20px 8px' : '20px 14px',
        gap: '4px',
        overflow: 'hidden',
        overflowX: 'hidden',
        boxShadow: isLight
          ? '0 20px 60px rgba(64, 100, 160, 0.14), inset 0 1.5px 2px rgba(255, 255, 255, 1)'
          : '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50
      }}
      className="desktop-only"
    >
      {/* Sticky Fixed Header Container */}
      <div style={{ flexShrink: 0, paddingBottom: '8px' }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 10px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '13px',
              background: isLight
                ? 'linear-gradient(135deg, #e0f2fe 0%, #f3e8ff 100%)'
                : 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(168, 85, 247, 0.25) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isLight ? '1.5px solid rgba(2, 132, 199, 0.35)' : '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: isLight
                ? '0 6px 18px rgba(2, 132, 199, 0.18)'
                : '0 8px 24px rgba(56, 189, 248, 0.35)',
              flexShrink: 0
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#090d16',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
              }}>
                <img
                  src="/edunova_icon.png"
                  alt="EduNova Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%'
                  }}
                />
              </div>
            </div>
            {!isCollapsed && (
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: isLight ? '#0f172a' : '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-heading)'
                }}>
                  EduNova
                </h2>
                <span style={{ fontSize: '0.70rem', color: isLight ? '#0284c7' : '#94a3b8', fontWeight: 700, display: 'block', marginTop: '1px' }}>
                  Learn Beyond Boundaries
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.08)',
              border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isLight ? '#0f172a' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Dynamic Role Badge Identifier */}
        {!isCollapsed && (
          <div style={{
            margin: '4px 2px 10px 2px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: roleBadgeBg,
            border: `1px solid ${roleBadgeBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <RoleIcon size={15} color={roleBadgeColor} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: roleBadgeColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1.2
              }}>
                {roleTitle}
              </div>
              <div style={{
                fontSize: '0.64rem',
                color: isLight ? '#64748b' : '#94a3b8',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {roleSubtitle}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links List (Scrollable Area) */}
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '2px'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = checkIsActive(item.path);

          return (
            <NavLink
              key={item.path + item.label}
              to={item.path}
              title={item.label}
              className={() => (isItemActive ? 'active' : '')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: isCollapsed ? '9px 0' : '9px 12px',
                borderRadius: '14px',
                fontSize: '0.84rem',
                fontWeight: isItemActive ? 800 : 600,
                color: isItemActive ? '#ffffff' : (isLight ? '#0f172a' : '#94a3b8'),
                background: isItemActive
                  ? (isLight
                    ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #7c3aed 100%)'
                    : 'linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)')
                  : 'transparent',
                boxShadow: isItemActive
                  ? (isLight ? '0 8px 22px rgba(2, 132, 199, 0.38), inset 0 1px 1.5px rgba(255, 255, 255, 0.4)' : '0 8px 22px rgba(79, 140, 255, 0.35)')
                  : 'none',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                textDecoration: 'none'
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '9px',
                background: isItemActive ? 'rgba(255, 255, 255, 0.22)' : (isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(255, 255, 255, 0.04)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={15} color={isItemActive ? '#ffffff' : (isLight ? '#0284c7' : '#94a3b8')} style={{ flexShrink: 0 }} />
              </div>
              {!isCollapsed && (
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: isItemActive ? '#ffffff' : (isLight ? '#0f172a' : '#ffffff'),
                  fontWeight: isItemActive ? 800 : 600
                }}>
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Promo / User Role Indicator */}
      {!isCollapsed && (
        <NavLink
          to="/profile"
          title="View Profile & Governance Settings"
          style={{
            marginTop: 'auto',
            padding: '10px 12px',
            borderRadius: '16px',
            background: isLight ? 'rgba(255, 255, 255, 0.70)' : 'rgba(255, 255, 255, 0.08)',
            border: isLight ? '1px solid rgba(255, 255, 255, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isLight ? '0 6px 16px rgba(64, 100, 160, 0.06)' : '0 6px 16px rgba(0,0,0,0.2)',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(139, 108, 255, 0.25), rgba(54, 199, 244, 0.25))',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <RoleIcon size={16} color={isAdmin ? "#c084fc" : "#0284c7"} />
            </div>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: '0.78rem', color: isLight ? '#18345F' : '#ffffff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || (isAdmin ? 'System Admin' : 'EduNova User')}
              </strong>
              <span style={{ fontSize: '0.68rem', color: isLight ? '#5D7192' : '#94a3b8' }}>
                {user?.role || 'STUDENT'}
              </span>
            </div>
          </div>
          <div style={{ color: isLight ? '#18345F' : '#ffffff', display: 'flex' }}>
            <ChevronRight size={15} />
          </div>
        </NavLink>
      )}
    </aside>
  );
};

export default Sidebar;
