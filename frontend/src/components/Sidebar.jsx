import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Bell, Mail, User, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onCreatePostClick, isOpen, onClose }) {
  const { user } = useAuth();

  if (!user) return null;

  const links = [
    { to: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { to: '/explore', label: 'Explore', icon: <Compass className="w-5 h-5" /> },
    { to: '/messages', label: 'Messages', icon: <Mail className="w-5 h-5" /> },
    { to: `/profile/${user.username}`, label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full py-4 px-3 justify-between">
      <div className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <button
          onClick={() => {
            onCreatePostClick();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Post</span>
        </button>

        {/* User Card inside Sidebar */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
          <img
            src={user.profilePictureUrl}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover border border-white/10"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
            <p className="text-xs text-slate-500 truncate">@{user.username}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer Container */}
      <aside
        className={`fixed top-[61px] bottom-0 left-0 w-64 glass-panel border-r border-white/5 md:sticky md:top-[70px] md:h-[calc(100vh-80px)] z-30 transition-transform duration-300 md:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
