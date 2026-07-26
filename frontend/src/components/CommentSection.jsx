import React, { useEffect, useState } from 'react';
import { MessageSquare, Heart, Trash2, CornerDownRight, Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CommentSection({ postId, postOwnerId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [inputText, setInputText] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/api/posts/${postId}/comments`);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/api/posts/${postId}/comments`, {
        content: inputText.trim()
      });
      setInputText('');
      setComments((prev) => [...prev, data]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/api/posts/${postId}/comments`, {
        content: replyText.trim(),
        parentCommentId: parentId
      });
      setReplyText('');
      setReplyToId(null);
      
      // Update replies in tree local state
      const updateReplies = (list) => {
        return list.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), data] };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateReplies(c.replies) };
          }
          return c;
        });
      };
      setComments((prev) => updateReplies(prev));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const { data } = await api.post(`/api/comments/${commentId}/like`);
      const updateLikes = (list) => {
        return list.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              isLiked: data.liked,
              likesCount: data.liked ? c.likesCount + 1 : c.likesCount - 1
            };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateLikes(c.replies) };
          }
          return c;
        });
      };
      setComments((prev) => updateLikes(prev));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/comments/${commentId}`);
      const removeComment = (list) => {
        return list
          .filter((c) => c.id !== commentId)
          .map((c) => {
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: removeComment(c.replies) };
            }
            return c;
          });
      };
      setComments((prev) => removeComment(prev));
    } catch (error) {
      console.error(error);
    }
  };

  // Recursive Comment Node Component
  const CommentNode = ({ comment, depth = 0 }) => {
    const isOwner = user?.id === comment.user.id;
    const isPostOwner = user?.id === postOwnerId;
    const isReplying = replyToId === comment.id;

    return (
      <div className="mt-4">
        <div className="flex gap-3">
          <img
            src={comment.user.profilePictureUrl}
            alt={comment.user.username}
            className="w-8 h-8 rounded-full object-cover border border-white/10"
          />
          <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white">{comment.user.displayName}</span>
                <span className="text-[10px] text-slate-500 ml-2">@{comment.user.username}</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-slate-200 mt-1.5 whitespace-pre-wrap">{comment.content}</p>
            
            {/* Comment actions */}
            <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-white/5">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center gap-1 text-[10px] transition-colors ${
                  comment.isLiked ? 'text-rose-400 font-medium' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-rose-400' : ''}`} />
                <span>{comment.likesCount}</span>
              </button>

              <button
                onClick={() => {
                  setReplyToId(isReplying ? null : comment.id);
                  setReplyText('');
                }}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>

              {(isOwner || isPostOwner) && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-400 transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply Input Form */}
        {isReplying && (
          <form
            onSubmit={(e) => handleAddReply(e, comment.id)}
            className="flex gap-2 items-center mt-2 ml-10 p-2 bg-slate-950/40 border border-white/5 rounded-xl animate-fade-in"
          >
            <CornerDownRight className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder={`Reply to @${comment.user.username}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !replyText.trim()}
              className="p-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/20 text-white rounded-lg transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        )}

        {/* Recursive Child Comments Rendering */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-8 border-l border-white/5 pl-4 space-y-1">
            {comment.replies.map((reply) => (
              <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
      <h4 className="font-semibold text-xs text-slate-400">Comments</h4>

      {/* Main Comment Input */}
      <form onSubmit={handleAddComment} className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Share your comment..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl py-2 px-4 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 px-4 rounded-xl transition-colors"
        >
          Post
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-center py-4 text-xs text-slate-500">No comments yet. Start the conversation!</p>
        ) : (
          comments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
