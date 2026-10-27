import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI } from '../utils/api';
import {
  LayoutDashboard, Users, UserCheck, ClipboardList, GraduationCap,
  DollarSign, BookOpen, Calendar, FileText, Bell, User, Menu, X,
  ChevronRight, BookMarked, BarChart3, School, Settings, LogOut,
  Palette, Check
} from 'lucide-react';
import { useTheme } from '../utils/theme';

function getNavItems(role) {
  if (role === 'superadmin') {
    return [
      { path: '/', label: 'Super Dashboard', icon: LayoutDashboard },
      { path: '/superadmin/admins', label: 'Manage School Admins', icon: Users },
      { path: '/superadmin/overview', label: 'Class Wings & Branches', icon: School },
      { path: '/notifications', label: 'System Notices', icon: Bell },
      { path: '/profile', label: 'Super Admin Profile', icon: User },
    ];
  }

  if (role === 'student') {
    return [
      { path: '/', label: 'Student Portal', icon: LayoutDashboard },
      { path: '/attendance/students', label: 'My Attendance', icon: ClipboardList },
      { path: '/timetable', label: 'My Timetable', icon: Calendar },
      { path: '/assignments', label: 'My Homework', icon: BookMarked },
      { path: '/examinations', label: 'Exams & Results', icon: GraduationCap },
      { path: '/fees', label: 'My Fees', icon: DollarSign },
      { path: '/materials', label: 'Study Materials', icon: BookOpen },
      { path: '/notifications', label: 'School Notices', icon: Bell },
      { path: '/profile', label: 'Student Profile', icon: User },
    ];
  }

  if (role === 'parent') {
    return [
      { path: '/', label: 'Parent Portal', icon: LayoutDashboard },
      { path: '/attendance/students', label: 'Child Attendance', icon: ClipboardList },
      { path: '/timetable', label: 'Class Timetable', icon: Calendar },
      { path: '/assignments', label: 'Child Homework', icon: BookMarked },
      { path: '/examinations', label: 'Exams & Results', icon: GraduationCap },
      { path: '/fees', label: 'Fee Payment', icon: DollarSign },
      { path: '/materials', label: 'Study Materials', icon: BookOpen },
      { path: '/notifications', label: 'School Notices', icon: Bell },
      { path: '/profile', label: 'Parent Profile', icon: User },
    ];
  }

  if (role === 'teacher') {
    return [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/students', label: 'Students Roster', icon: Users },
      { path: '/attendance/students', label: 'Mark Attendance', icon: ClipboardList },
      { path: '/assignments', label: 'Assignments', icon: BookMarked },
      { path: '/examinations', label: 'Marks Entry', icon: GraduationCap },
      { path: '/timetable', label: 'Class Timetable', icon: Calendar },
      { path: '/materials', label: 'Study Materials', icon: BookOpen },
      { path: '/leaves', label: 'Leave Requests', icon: FileText },
      { path: '/notifications', label: 'Notices', icon: Bell },
      { path: '/profile', label: 'Faculty Profile', icon: User },
    ];
  }

  const all = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin','accountant','staff'] },
    { path: '/students', label: 'Students', icon: Users, roles: ['admin'] },
    { path: '/staff', label: 'Staff Directory', icon: UserCheck, roles: ['admin'] },
    { path: '/attendance/students', label: 'Student Attendance', icon: ClipboardList, roles: ['admin'] },
    { path: '/attendance/staff', label: 'Staff Attendance', icon: UserCheck, roles: ['admin'] },
    { path: '/examinations', label: 'Examinations', icon: GraduationCap, roles: ['admin'] },
    { path: '/fees', label: 'Fee Management', icon: DollarSign, roles: ['admin','accountant'] },
    { path: '/academic', label: 'Academic Setup', icon: School, roles: ['admin'] },
    { path: '/timetable', label: 'Timetable', icon: Calendar, roles: ['admin'] },
    { path: '/assignments', label: 'Assignments', icon: BookMarked, roles: ['admin'] },
    { path: '/materials', label: 'Study Materials', icon: BookOpen, roles: ['admin'] },
    { path: '/leaves', label: 'Leave Management', icon: FileText, roles: ['admin','staff'] },
    { path: '/reports', label: 'Financial & Reports', icon: BarChart3, roles: ['admin','accountant'] },
    { path: '/notifications', label: 'Notice Board', icon: Bell, roles: ['admin','accountant','staff'] },
    { path: '/profile', label: 'Profile', icon: User, roles: ['admin','accountant','staff'] },
  ];
  return all.filter(item => item.roles.includes(role));
}

function getBottomNavItems(role) {
  const map = {
    superadmin: ['/', '/superadmin/admins', '/superadmin/overview', '/profile'],
    admin: ['/', '/students', '/attendance/students', '/fees', '/notifications'],
    teacher: ['/', '/students', '/attendance/students', '/assignments', '/profile'],
    student: ['/', '/attendance/students', '/assignments', '/examinations', '/fees'],
    parent: ['/', '/attendance/students', '/fees', '/examinations', '/profile'],
    accountant: ['/', '/fees', '/reports', '/notifications', '/profile'],
    staff: ['/', '/leaves', '/notifications', '/profile'],
  };
  const paths = map[role] || ['/', '/notifications', '/profile'];
  const items = getNavItems(role);
  return items.filter(item => paths.includes(item.path));
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const { theme, setTheme, themes } = useTheme();

  const navItems = getNavItems(user?.role);
  const bottomNavItems = getBottomNavItems(user?.role);

  useEffect(() => {
    notificationsAPI.getAll().then(res => {
      setUnreadCount(res.data.unreadCount || 0);
    }).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.theme-picker-container')) {
        setThemePickerOpen(false);
      }
    };
    if (themePickerOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [themePickerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (user) => {
    if (!user) return '?';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
  };

  const getRoleBadge = (role) => {
    const map = {
      superadmin: 'Super Admin',
      admin: 'Admin',
      teacher: 'Teacher',
      student: 'Student',
      parent: 'Parent',
      accountant: 'Accountant',
      staff: 'Staff'
    };
    return map[role] || role;
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-logo">
          <div className="logo-icon">S</div>
          <span>School ERP</span>
        </div>
        <div className="header-actions">
          {/* Institutional Theme Picker */}
          <div className="theme-picker-container" style={{ position: 'relative' }}>
            <button
              className="theme-btn-trigger"
              onClick={() => setThemePickerOpen(!themePickerOpen)}
              title="Change Color Theme"
              type="button"
            >
              <Palette size={16} />
              <span style={{ fontSize: '0.78rem' }}>Theme</span>
              <span
                className="theme-dot"
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: themes.find(t => t.id === theme)?.primaryColor || 'var(--primary)'
                }}
              />
            </button>

            {themePickerOpen && (
              <div className="theme-dropdown" onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: '6px 8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                  Institutional Theme
                </div>
                {themes.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-option ${theme === t.id ? 'active' : ''}`}
                    onClick={() => {
                      setTheme(t.id);
                      setThemePickerOpen(false);
                    }}
                  >
                    <div className="theme-swatch-badge">
                      <span className="theme-dot" style={{ backgroundColor: t.primaryColor }} />
                      <div>
                        <div style={{ fontWeight: theme === t.id ? 700 : 500 }}>{t.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t.badge}</div>
                      </div>
                    </div>
                    {theme === t.id && <Check size={14} color="var(--primary)" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="header-badge" onClick={() => navigate('/notifications')} title="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </div>
          <div className="avatar" onClick={() => navigate('/profile')} title="Profile">
            {getInitials(user)}
          </div>
        </div>
      </header>

      {/* Sidebar (Desktop) */}
      <nav className="sidebar">
        <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--gray-100)', marginBottom: '8px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--gray-900)' }}>
            {user?.firstName} {user?.lastName}
          </div>
          {user?.profileInfo?.designation && (
            <div style={{ fontSize: '0.73rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px', lineHeight: 1.3 }}>
              {user.profileInfo.designation}
            </div>
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>{getRoleBadge(user?.role)}</span>
            {(user?.profileInfo?.staff_id || user?.profileInfo?.student_id) && (
              <span style={{ fontSize: '0.68rem', color: 'var(--gray-600)', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                {user.profileInfo.staff_id || user.profileInfo.student_id}
              </span>
            )}
          </div>
        </div>

        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}>
            <item.icon size={18} className="icon" />
            {item.label}
          </Link>
        ))}

        <div style={{ borderTop: '1px solid var(--gray-200)', margin: '8px 0', paddingTop: '8px' }}>
          <button
            onClick={handleLogout}
            className="sidebar-item"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', textAlign: 'left' }}
          >
            <LogOut size={18} className="icon" />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="bottom-nav">
        {bottomNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
