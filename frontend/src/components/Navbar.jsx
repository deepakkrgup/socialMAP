import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Mail, Sun, Moon, LogOut, User, Menu, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWebSocket } from '../context/WebSocketContext';
import NotificationDropdown from './NotificationDropdown';
import api from '../services/api';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { subscribeToNotifications } = useWebSocket();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnreadNotifications(data.unreadCount);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(() => {
      setUnreadNotifications((prev) => prev + 1);
    });
  }, [user, subscribeToNotifications]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNotificationClick = () => {
    setIsNotifOpen(!isNotifOpen);
    setUnreadNotifications(0); // optimistically reset unread badge
  };

  return (
    <nav className="glass-panel sticky top-0 z-40 w-full border-b border-white/5 backdrop-blur-md px-4 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden text-slate-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-400 via-purple-500 to-rose-400 bg-clip-text text-transparent">
          <Flame className="w-7 h-7 text-indigo-500 fill-indigo-500/20" />
          SocialMAP
        </Link>
      </div>

      {/* Global Search Bar */}
      {user && (
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative w-1/3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search users or display names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
          />
        </form>
      )}

      {/* Nav Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {user && (
          <>
            {/* Messages Quicklink */}
            <Link
              to="/messages"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all relative"
              title="Inbox"
            >
              <Mail className="w-5 h-5" />
            </Link>

            {/* Notifications Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full border border-slate-900 animate-pulse">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
            </div>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1 focus:outline-none"
              >
                <img
                  src={user.profilePictureUrl}
                  alt={user.username}
                  className="w-9 h-9 rounded-full object-cover border border-white/10 hover:border-indigo-500/50 transition-all cursor-pointer"
                />
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 glass-panel border border-white/10 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
                    <Link
                      to={`/profile/${user.username}`}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/5 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
