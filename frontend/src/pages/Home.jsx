import React, { useEffect, useState } from 'react';
import { Flame, Compass, MessageSquare, Send, Image, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { PostSkeleton } from '../components/SkeletonLoader';
import api from '../services/api';

export default function Home() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState('global'); // 'global' or 'feed'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Composer state
  const [composerText, setComposerText] = useState('');
  const [composerMedia, setComposerMedia] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerError, setComposerError] = useState('');

  const fetchPosts = async (pageNumber = 0, isInitial = false) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/posts`, {
        params: {
          page: pageNumber,
          size: 10,
          type: feedType
        }
      });
      
      if (isInitial) {
        setPosts(data.content);
      } else {
        setPosts((prev) => [...prev, ...data.content]);
      }
      setHasMore(!data.last);
    } catch (error) {
      console.error('Failed to load posts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchPosts(0, true);
  }, [feedType]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, false);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!composerText.trim()) return;

    setComposerLoading(true);
    setComposerError('');
    try {
      const { data } = await api.post('/api/posts', {
        contentText: composerText.trim(),
        mediaUrl: composerMedia.trim() || null
      });
      setComposerText('');
      setComposerMedia('');
      setShowMediaInput(false);
      
      // Prepends to feed instantly if global
      setPosts((prev) => [data, ...prev]);
    } catch (err) {
      setComposerError('Failed to publish post');
    } finally {
      setComposerLoading(false);
    }
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Tab Filter switcher */}
      <div className="flex border-b border-white/5 pb-2">
        <button
          onClick={() => setFeedType('global')}
          className={`flex-1 text-center pb-2.5 font-medium text-sm transition-all border-b-2 ${
            feedType === 'global'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          For You
        </button>
        <button
          onClick={() => setFeedType('feed')}
          className={`flex-1 text-center pb-2.5 font-medium text-sm transition-all border-b-2 ${
            feedType === 'feed'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Following
        </button>
      </div>

      {/* Quick Composer */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5">
        <form onSubmit={handleCreatePost} className="space-y-4">
          {composerError && (
            <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
              {composerError}
            </div>
          )}
          <div className="flex gap-4">
            <img
              src={user?.profilePictureUrl}
              alt={user?.username}
              className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
            />
            <div className="flex-1">
              <textarea
                placeholder="What is happening today?"
                rows="3"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {showMediaInput && (
            <input
              type="url"
              placeholder="Paste image/media URL here..."
              value={composerMedia}
              onChange={(e) => setComposerMedia(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
            />
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                showMediaInput ? 'bg-indigo-500/15 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>Add Image</span>
            </button>

            <button
              type="submit"
              disabled={composerLoading || !composerText.trim()}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{composerLoading ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
        ))}

        {loading && (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-16 bg-white/2 rounded-2xl border border-white/5">
            <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-300 text-sm">No Posts Available</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              {feedType === 'feed'
                ? 'Follow other users to see their posts in this feed, or check out the global "For You" page.'
                : 'Be the first to share an update on Pulse!'}
            </p>
          </div>
        )}

        {hasMore && !loading && posts.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="w-full text-center py-3 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-xs text-slate-400 font-semibold rounded-xl transition-all cursor-pointer"
          >
            Load More Posts
          </button>
        )}
      </div>
    </div>
  );
}
