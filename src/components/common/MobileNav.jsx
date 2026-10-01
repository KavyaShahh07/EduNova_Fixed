import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Bot,
  CheckSquare,
  Gamepad2,
  User,
  ShieldCheck,
  ShieldAlert,
  Users,
  HelpCircle,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const MobileNav = () => {
  const { isParent, user } = useAuth();
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';
  const location = useLocation();

  const isParentMode = isParent || location.pathname.startsWith('/parent');
  const isAdmin = user?.role === 'ADMIN';
  const isInstructor = user?.role === 'INSTRUCTOR';

  let navs = [];

  if (isAdmin) {
    navs = [
      { label: 'Admin', path: '/admin?tab=overview', icon: ShieldCheck },
      { label: 'Users', path: '/admin?tab=users', icon: Users },
      { label: 'Courses', path: '/admin?tab=courses', icon: BookOpen },
      { label: 'Quizzes', path: '/admin?tab=quizzes', icon: HelpCircle },
      { label: 'Security', path: '/admin?tab=logins', icon: ShieldAlert },
      { label: 'Profile', path: '/profile', icon: User }
    ];
  } else if (isInstructor) {
    navs = [
      { label: 'Studio', path: '/instructor/dashboard', icon: LayoutDashboard },
      { label: 'Courses', path: '/instructor/courses', icon: BookOpen },
      { label: 'Students', path: '/instructor/students', icon: Users },
      { label: 'Quizzes', path: '/instructor/assessments', icon: CheckSquare },
      { label: 'Sage AI', path: '/ai-assistant', icon: Bot },
      { label: 'Profile', path: '/profile', icon: User }
    ];
  } else if (isParentMode) {
    navs = [
      { label: 'Overview', path: '/parent/dashboard', icon: LayoutDashboard },
      { label: 'Progress', path: '/parent/performance', icon: TrendingUp },
      { label: 'Child', path: '/parent/child-profile', icon: User },
      { label: 'Sage AI', path: '/ai-assistant', icon: Bot },
      { label: 'Controls', path: '/parent/settings', icon: Settings }
    ];
  } else {
    // STUDENT
    navs = [
      { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Tasks', path: '/tasks', icon: CheckSquare },
      { label: 'Subjects', path: '/my-subjects', icon: BookOpen },
      { label: 'Sage AI', path: '/ai-assistant', icon: Bot },
      { label: 'Games', path: '/games', icon: Gamepad2 },
      { label: 'Profile', path: '/profile', icon: User }
    ];
  }

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
    <nav
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: '12px',
        left: '12px',
        right: '12px',
        height: '64px',
        borderRadius: '24px',
        background: isLight
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 246, 255, 0.88) 100%)'
          : 'linear-gradient(135deg, rgba(15, 23, 52, 0.92) 0%, rgba(9, 13, 35, 0.96) 100%)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: isLight ? '1.5px solid rgba(255, 255, 255, 0.98)' : '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: isLight
          ? '0 12px 35px rgba(64, 100, 160, 0.2), inset 0 1px 1px rgba(255, 255, 255, 1)'
          : '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
        zIndex: 9999
      }}
    >
      {navs.map((n) => {
        const Icon = n.icon;
        const isActive = checkIsActive(n.path);

        return (
          <NavLink
            key={n.path}
            to={n.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 8px',
              borderRadius: '16px',
              background: isActive
                ? (isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.16)')
                : 'transparent',
              border: isActive
                ? (isLight ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(56, 189, 248, 0.35)')
                : '1px solid transparent',
              color: isActive ? '#06b6d4' : (isLight ? '#64748b' : '#94a3b8'),
              fontSize: '0.66rem',
              fontWeight: isActive ? 800 : 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? '0 0 14px rgba(6, 182, 212, 0.25)' : 'none'
            }}
          >
            <Icon size={18} color={isActive ? '#06b6d4' : (isLight ? '#64748b' : '#94a3b8')} />
            <span>{n.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileNav;
