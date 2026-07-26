import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../services/api';

export default function EditProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user.profilePictureUrl || '');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(user.coverPhotoUrl || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.put('/api/users/me', {
        displayName: displayName.trim(),
        bio: bio.trim(),
        profilePictureUrl: profilePictureUrl.trim(),
        coverPhotoUrl: coverPhotoUrl.trim()
      });
      onProfileUpdated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
          <h3 className="font-display font-bold text-lg text-white">Edit Profile</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">{error}</div>}

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-2.5 text-sm text-white focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Bio</label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-2.5 text-sm text-white focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Profile Image URL</label>
            <input
              type="url"
              value={profilePictureUrl}
              onChange={(e) => setProfilePictureUrl(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-2.5 text-sm text-white focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Cover Photo URL</label>
            <input
              type="url"
              value={coverPhotoUrl}
              onChange={(e) => setCoverPhotoUrl(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-2.5 text-sm text-white focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
