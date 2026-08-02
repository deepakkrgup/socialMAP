import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import api from '../services/api';

export default function PostCard({ post, onPostDeleted }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const isOwner = user?.id === post.user.id;

  const handleLike = async () => {
    setLikeAnimating(true);
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      const { data } = await api.post(`/api/posts/${post.id}/like`);
      // Align with actual backend response
      setLiked(data.liked);
    } catch (error) {
      // Revert if error
      setLiked(post.isLiked);
      setLikesCount(post.likesCount);
    } finally {
      setTimeout(() => setLikeAnimating(false), 500);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/api/posts/${post.id}`);
        onPostDeleted(post.id);
      } catch (error) {
        console.error('Failed to delete post', error);
      }
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl mb-4 border border-white/5 transition-all duration-300 hover:border-white/10">
      {/* Post Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <Link to={`/profile/${post.user.username}`} className="flex items-center gap-3 group">
          <img
            src={post.user.profilePictureUrl}
            alt={post.user.username}
            className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-indigo-500/50 transition-all"
          />
          <div>
            <h4 className="font-semibold text-sm text-white group-hover:text-indigo-400 transition-colors">
              {post.user.displayName}
            </h4>
            <p className="text-xs text-slate-500">@{post.user.username}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(post.createdAt).toLocaleDateString()}
          </span>

          {isOwner && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
              title="Delete Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="space-y-3">
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{post.contentText}</p>
        
        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden border border-white/5 max-h-[350px] bg-slate-950/30">
            <img
              src={post.mediaUrl}
              alt="Post Media"
              className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-500 cursor-zoom-in"
              onError={(e) => {
                e.target.style.display = 'none'; // hide broken images silently
              }}
            />
          </div>
        )}
      </div>

      {/* Post Engagement Actions */}
      <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/5">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs transition-colors group ${
            liked ? 'text-rose-500 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              liked ? 'fill-rose-500 text-rose-500' : 'group-hover:scale-110'
            } ${likeAnimating ? 'animate-heart-pulse' : ''}`}
          />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 text-xs transition-colors group ${
            showComments ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>{commentsCount}</span>
        </button>
      </div>

      {/* Comments Section Drawer */}
      {showComments && (
        <CommentSection postId={post.id} postOwnerId={post.user.id} />
      )}
    </div>
  );
}

