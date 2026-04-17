import { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Users, LayoutDashboard, Receipt, LogOut, BarChart2,
  Megaphone, PieChart, AlertTriangle, Store, ShieldCheck,
  Sun, Moon, Bell, X, CheckCheck, Menu, ChevronLeft
} from 'lucide-react';

const ShopCRMLogo = () => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-crm-teal to-crm-cyan flex items-center justify-center shadow-lg shadow-crm-cyan/30 shrink-0">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="9" r="3" fill="white" opacity="0.9"/>
        <circle cx="15" cy="9" r="3" fill="white" opacity="0.6"/>
        <path d="M3 19c0-3.314 2.686-6 6-6h6c3.314 0 6 2.686 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      </svg>
    </div>
    <div>
      <h2 className="text-xl font-extrabold bg-gradient-to-r from-crm-teal via-crm-cyan to-crm-accent bg-clip-text text-transparent leading-none">
        ShopCRM
      </h2>
      <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Premium Edition</p>
    </div>
  </div>
);

const Sidebar = () => {
  const { user, logout, isAdmin, canManage } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, always: true },
    { name: 'Customers', path: '/customers', icon: <Users size={20} />, always: true },
    { name: 'Billing', path: '/billing', icon: <Receipt size={20} />, always: true },
    { name: 'Analytics', path: '/analytics', icon: <BarChart2 size={20} />, always: true },
    { name: 'Segments', path: '/segments', icon: <PieChart size={20} />, always: true },
    { name: 'Campaigns', path: '/campaigns', icon: <Megaphone size={20} />, show: canManage },
    { name: 'Retention', path: '/retention', icon: <AlertTriangle size={20} />, show: canManage },
    { name: 'Stores', path: '/stores', icon: <Store size={20} />, show: isAdmin },
    { name: 'Users', path: '/admin/users', icon: <ShieldCheck size={20} />, show: isAdmin },
  ].filter(l => l.always || l.show);

  return (
    <div
      className="glass m-4 mr-0 flex flex-col justify-between overflow-hidden relative z-10 shrink-0 transition-all duration-300"
      style={{ width: collapsed ? '72px' : '264px' }}
    >
      <div className="absolute top-0 left-0 w-full h-32 pointer-events-none -z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(20,184,166,0.12), transparent)', filter: 'blur(20px)' }}
      />

      <div>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
          {!collapsed && <ShopCRMLogo />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="mt-3 flex flex-col gap-1 px-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path ||
              (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <NavLink
                key={link.path}
                to={link.path}
                title={collapsed ? link.name : ''}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-crm-teal/20 to-crm-cyan/20 border border-crm-teal/30'
                    : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-crm-teal to-crm-cyan rounded-full" />
                )}
                <div className={`shrink-0 transition-all duration-200 ${
                  isActive ? 'text-crm-cyan scale-110' : 'group-hover:text-crm-teal group-hover:scale-105'
                }`} style={{ color: isActive ? '' : 'var(--text-muted)' }}>
                  {link.icon}
                </div>
                {!collapsed && (
                  <span className={`font-semibold text-sm transition-colors ${
                    isActive ? 'text-white' : ''
                  }`} style={{ color: isActive ? '#fff' : 'var(--text-secondary)' }}>
                    {link.name}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="p-3 flex flex-col gap-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/10 transition-all duration-200 w-full"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div className="shrink-0">
            {theme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-crm-cyan" />}
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            title="Notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/10 transition-all duration-200 w-full relative"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="relative shrink-0">
              <Bell size={19} className={unreadCount > 0 ? 'text-crm-cyan' : ''} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span className="text-sm font-semibold">Notifications</span>}
          </button>

          {/* Notification Dropdown */}
          {notifOpen && (
            <div
              className="absolute bottom-full left-0 mb-2 w-80 glass rounded-xl shadow-2xl z-50 animate-slide-down overflow-hidden"
              style={{ border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-crm-cyan hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} style={{ color: 'var(--text-muted)' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                ) : (
                  notifications.slice(0, 10).map((n, i) => (
                    <div key={n._id || i} className={`p-3 text-xs ${!n.isRead ? 'bg-crm-cyan/5' : ''}`}>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                      <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                      <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info + Logout */}
        {!collapsed && (
          <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          title="Logout"
          className="group flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 border border-transparent hover:border-red-500/20"
        >
          <div className="shrink-0 group-hover:-translate-x-0.5 transition-transform">
            <LogOut size={19} />
          </div>
          {!collapsed && <span className="font-semibold text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
