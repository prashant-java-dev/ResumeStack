import React from 'react';

export default function Home({ onStartBuilding }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 -z-10"></div>

      <div className="max-w-2xl w-full text-center space-y-12 animate-fade-up">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-3xl flex items-center justify-center text-white dark:text-slate-900 shadow-2xl mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          </div>

          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            Build Your <span className="text-indigo-600 dark:text-indigo-400">Perfect Resume</span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
            Create a professional resume with AI assistance, optimize it for ATS, and land your dream job.
          </p>
        </div>

        {/* Features Grid
        <div className="grid md:grid-cols-3 gap-8 py-12">
          <div className="glass-card p-8 rounded-2xl hover:scale-105 transition-transform">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white mb-2">Beautiful Templates</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Professional designs that stand out</p>
          </div>

          <div className="glass-card p-8 rounded-2xl hover:scale-105 transition-transform">
            <div className="text-3xl mb-4">✨</div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white mb-2">AI Powered</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Smart suggestions to boost your content</p>
          </div>

          <div className="glass-card p-8 rounded-2xl hover:scale-105 transition-transform">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white mb-2">ATS Optimized</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Pass through applicant tracking systems</p>
          </div>
        </div> */}

        {/* CTA Button */}
        <button
          onClick={onStartBuilding}
          className="px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-lg font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all inline-block"
        >
          Start Building
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 pt-12 border-t border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">10K+</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Resumes Built</p>
          </div>
          <div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">95%</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Success Rate</p>
          </div>
          <div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">5★</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Rated</p>
          </div>
        </div>
      </div>
    </div>
  );
}
