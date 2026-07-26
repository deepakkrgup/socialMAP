import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, UserPlus, Mail, Check, Bell } from 'lucide-react';
import api from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

export default function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { subscribeToNotifications } = useWebSocket();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    return subscribeToNotifications((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
  }, [subscribeToNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    onClose();

    if (notif.type === 'LIKE' || notif.type === 'COMMENT') {
      navigate(`/posts/${notif.entityId}`);
    } else if (notif.type === 'FOLLOW') {
      navigate(`/profile/${notif.actor.username}`);
    } else if (notif.type === 'MESSAGE') {
      navigate('/messages');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'COMMENT':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'FOLLOW':
        return <UserPlus className="w-4 h-4 text-indigo-400" />;
      case 'MESSAGE':
        return <Mail className="w-4 h-4 text-violet-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown Container */}
      <div className="absolute right-0 mt-2 w-80 glass-panel border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in max-h-[450px] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
          <span className="font-semibold text-sm">Notifications</span>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>

        {loading && notifications.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">No notifications yet</div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex gap-3 p-2.5 rounded-xl transition-all cursor-pointer border ${
                  n.isRead
                    ? 'bg-transparent border-transparent hover:bg-white/5'
                    : 'bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10'
                }`}
              >
                <div className="relative">
                  <img
                    src={n.actor.profilePictureUrl}
                    alt={n.actor.username}
                    className="w-9 h-9 rounded-full object-cover border border-white/10"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-white/10 rounded-full p-1 shadow-md">
                    {getIcon(n.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white mr-1">
                      {n.actor.displayName || n.actor.username}
                    </span>
                    {n.type === 'LIKE' && 'liked your post'}
                    {n.type === 'COMMENT' && 'commented on your post'}
                    {n.type === 'FOLLOW' && 'started following you'}
                    {n.type === 'MESSAGE' && 'sent you a message'}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
