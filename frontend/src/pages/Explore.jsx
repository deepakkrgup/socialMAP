import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, UserCheck, UserPlus, TrendingUp, Compass, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserSkeleton } from '../components/SkeletonLoader';
import api from '../services/api';

export default function Explore() {
  const { user: currentUser, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const queryParam = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(queryParam);
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [suggLoading, setSuggLoading] = useState(false);

  const fetchSuggestions = async () => {
    setSuggLoading(true);
    try {
      const { data } = await api.get('/api/users/suggestions');
      setSuggestions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setSuggLoading(false);
    }
  };

  const handleSearch = async (val) => {
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/api/users/search', {
        params: { q: val }
      });
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    setSearchInput(queryParam);
    if (queryParam) {
      handleSearch(queryParam);
    } else {
      setSearchResults([]);
    }
  }, [queryParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(searchInput.trim() ? { q: searchInput.trim() } : {});
  };

  const handleToggleFollow = async (user) => {
    try {
      if (user.isFollowing) {
        await api.delete(`/api/users/${user.username}/follow`);
      } else {
        await api.post(`/api/users/${user.username}/follow`);
      }

      // Update local state
      const updateList = (list) =>
        list.map((u) => (u.id === user.id ? { ...u, isFollowing: !user.isFollowing } : u));
      
      setSearchResults((prev) => updateList(prev));
      setSuggestions((prev) => updateList(prev));
      refreshUser();
    } catch (error) {
      console.error(error);
    }
  };

  const trendTopics = [
    { tag: '#PulseApp', posts: '42.8K pulses' },
    { tag: '#ReactVite', posts: '12.4K pulses' },
    { tag: '#SpringBoot3', posts: '8.9K pulses' },
    { tag: '#Java17', posts: '5.1K pulses' },
    { tag: '#TailwindCSS', posts: '23.6K pulses' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Search and Results Section */}
      <div className="md:col-span-2 space-y-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search people by @username or name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold py-3 px-5 rounded-xl transition-all"
          >
            Search
          </button>
        </form>

        {queryParam ? (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              Search results for "{queryParam}"
            </h3>

            {loading ? (
              <div className="space-y-3">
                <UserSkeleton />
                <UserSkeleton />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-500">No users match your query</p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-all"
                  >
                    <Link to={`/profile/${u.username}`} className="flex items-center gap-3 min-w-0">
                      <img
                        src={u.profilePictureUrl}
                        alt={u.username}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-white truncate">{u.displayName}</h4>
                        <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                      </div>
                    </Link>
                    {currentUser.id !== u.id && (
                      <button
                        onClick={() => handleToggleFollow(u)}
                        className={`flex items-center gap-1 text-xs font-semibold py-1.5 px-3.5 rounded-lg transition-all ${
                          u.isFollowing
                            ? 'bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300'
                            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                        }`}
                      >
                        {u.isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel border border-white/5 rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
              <Compass className="w-48 h-48 text-indigo-500" />
            </div>
            <div className="max-w-md">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Discover Pulse
              </div>
              <h2 className="font-display font-extrabold text-xl text-white mb-2 leading-tight">
                Find your community on Pulse
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Explore trending hashtags, search for friends and tech leaders, or connect with creators worldwide to grow your feed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Suggestions / Trends */}
      <div className="space-y-6">
        {/* Follow Suggestions */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-display font-bold text-sm text-white">Suggested for You</h3>
          {suggLoading && suggestions.length === 0 ? (
            <div className="space-y-3">
              <UserSkeleton />
              <UserSkeleton />
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-xs text-slate-500">No suggestions right now</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3">
                  <Link to={`/profile/${u.username}`} className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.profilePictureUrl}
                      alt={u.username}
                      className="w-8.5 h-8.5 rounded-full object-cover border border-white/10"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-white truncate">{u.displayName}</h4>
                      <p className="text-[10px] text-slate-500 truncate">@{u.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleToggleFollow(u)}
                    className="text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-400 py-1.5 px-3 rounded-lg transition-all shrink-0"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mock Trends widget */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            Trending Topics
          </h3>
          <div className="space-y-3">
            {trendTopics.map((topic) => (
              <div key={topic.tag} className="group cursor-pointer">
                <p className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  {topic.tag}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{topic.posts}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
