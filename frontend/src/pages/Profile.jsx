import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Edit, UserCheck, UserPlus, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { PostSkeleton } from '../components/SkeletonLoader';
import EditProfileModal from '../components/EditProfileModal';
import api from '../services/api';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const { data } = await api.get(`/api/users/${username}`);
      setProfile(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchUserPosts = async (pageNumber = 0, isInitial = false) => {
    setLoadingPosts(true);
    try {
      const { data } = await api.get(`/api/posts/user/${username}`, {
        params: { page: pageNumber, size: 10 }
      });
      if (isInitial) {
        setPosts(data.content);
      } else {
        setPosts((prev) => [...prev, ...data.content]);
      }
      setHasMore(!data.last);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    setPage(0);
    fetchUserPosts(0, true);
  }, [username]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUserPosts(nextPage, false);
  };

  const handleToggleFollow = async () => {
    if (!profile) return;
    try {
      if (profile.isFollowing) {
        await api.delete(`/api/users/${username}/follow`);
        setProfile((prev) => ({
          ...prev,
          isFollowing: false,
          followersCount: prev.followersCount - 1
        }));
      } else {
        await api.post(`/api/users/${username}/follow`);
        setProfile((prev) => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1
        }));
      }
      refreshUser();
    } catch (error) {
      console.error(error);
    }
  };

  const handleProfileUpdated = (updatedUser) => {
    setProfile(updatedUser);
    refreshUser();
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  if (loadingProfile && !profile) {
    return (
      <div className="text-center py-20 text-slate-400">Loading user profile...</div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-slate-400">User profile not found</div>
    );
  }

  const isSelf = currentUser?.id === profile.id;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Header Profile Cover & Avatar */}
      <div className="glass-panel border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        {/* Banner Cover */}
        <div className="h-48 relative bg-slate-900">
          <img
            src={profile.coverPhotoUrl}
            alt="Profile cover banner"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Avatar and Main Stats Details */}
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end">
            {/* Avatar image overlapping banner */}
            <div className="relative -mt-16 w-28 h-28 rounded-full overflow-hidden border-4 border-slate-950 shadow-lg">
              <img
                src={profile.profilePictureUrl}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Profile Action button */}
            {isSelf ? (
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleToggleFollow}
                className={`flex items-center gap-1.5 text-xs font-semibold py-2.5 px-4.5 rounded-xl transition-all ${
                  profile.isFollowing
                    ? 'bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                {profile.isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mt-4">
            <h2 className="font-display font-extrabold text-xl text-white">{profile.displayName}</h2>
            <p className="text-xs text-slate-500">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-sm text-slate-200 mt-3 whitespace-pre-wrap">{profile.bio}</p>
          )}

          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {new Date(profile.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Social graph follow counts */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5 text-sm">
            <div>
              <span className="font-bold text-white mr-1">{profile.followingCount}</span>
              <span className="text-slate-500">Following</span>
            </div>
            <div>
              <span className="font-bold text-white mr-1">{profile.followersCount}</span>
              <span className="text-slate-500">Followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts Feed */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-white/5">
          <FileText className="w-4 h-4 text-slate-400" />
          Pulses ({posts.length})
        </h3>

        {posts.map((post) => (
          <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
        ))}

        {loadingPosts && (
          <div className="space-y-4">
            <PostSkeleton />
          </div>
        )}

        {!loadingPosts && posts.length === 0 && (
          <p className="text-center py-12 text-sm text-slate-500">No pulses shared by this user yet</p>
        )}

        {hasMore && !loadingPosts && posts.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="w-full text-center py-3 bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 text-xs text-slate-400 font-semibold rounded-xl transition-all cursor-pointer"
          >
            Load More Pulses
          </button>
        )}
      </div>

      {/* Edit Profile Modal Dialog */}
      {isSelf && (
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          user={profile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}
