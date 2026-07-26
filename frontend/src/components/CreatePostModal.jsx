import React, { useState } from 'react';
import { X, Image, Send } from 'lucide-react';
import api from '../services/api';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [contentText, setContentText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contentText.trim()) {
      setError('Content cannot be empty');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/posts', {
        contentText: contentText.trim(),
        mediaUrl: mediaUrl.trim() || null
      });
      setContentText('');
      setMediaUrl('');
      setShowMediaInput(false);
      onPostCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
          <h3 className="font-display font-bold text-lg text-white">Create New Post</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">{error}</div>}

          <textarea
            placeholder="What is on your mind? Share your pulse..."
            rows="5"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-all resize-none"
          />

          {showMediaInput && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Add Image / Media URL</label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                showMediaInput ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>Image / Media</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
