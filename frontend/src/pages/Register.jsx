import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(username.trim(), email.trim(), password, displayName.trim());
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] bg-mesh-glow flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel border border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-3 animate-pulse">
            <Flame className="w-8 h-8 text-indigo-500 fill-indigo-500/20" />
          </div>
          <h2 className="font-display font-extrabold text-3xl tracking-tight text-white">Join SocialMAP</h2>
          <p className="text-sm text-slate-500 mt-1">Create an account to start sharing</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</div>}

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Username *</label>
            <input
              type="text"
              placeholder="e.g. alex_smith"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Email Address *</label>
            <input
              type="email"
              placeholder="e.g. alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Display Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Alex Smith"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Password *</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0 mt-6"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
