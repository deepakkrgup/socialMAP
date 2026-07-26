import React from 'react';

export const PostSkeleton = () => {
  return (
    <div className="glass-panel p-6 rounded-2xl mb-4 border border-white/5 relative overflow-hidden shimmer">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-slate-800 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-800 rounded-md w-1/4"></div>
          <div className="h-3 bg-slate-800 rounded-md w-1/6"></div>
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-slate-800 rounded-md w-full"></div>
            <div className="h-4 bg-slate-800 rounded-md w-5/6"></div>
          </div>
          <div className="h-48 bg-slate-800 rounded-xl w-full mt-4"></div>
          <div className="flex gap-8 pt-4 w-1/2">
            <div className="h-4 bg-slate-800 rounded-md w-8"></div>
            <div className="h-4 bg-slate-800 rounded-md w-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserSkeleton = () => {
  return (
    <div className="glass-panel p-4 rounded-xl border border-white/5 flex gap-3 items-center shimmer relative overflow-hidden">
      <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-800 rounded-md w-1/2"></div>
        <div className="h-3 bg-slate-800 rounded-md w-1/3"></div>
      </div>
      <div className="h-8 bg-slate-800 rounded-lg w-16"></div>
    </div>
  );
};
