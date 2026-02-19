import React from 'react';

export default function Header({ view, setView, theme, toggleTheme, isAuthenticated, currentUser, onLogout, onStartBuilding }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 glass-effect flex items-center justify-between px-8 z-50 border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-12">
        <button
          onClick={() => setView('home')}
          className="text-2xl font-black flex items-center gap-3 group text-slate-900 dark:text-white"
        >
          {/* Logo with SVG */}
          <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-xl group-hover:scale-110 transition-transform">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          </div>
          <span className="tracking-tighter font-extrabold">Resume<span className="font-light opacity-50">Stack</span></span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {(isAuthenticated ? [
            { id: 'edit', label: 'Builder' },
            { id: 'ats-lab', label: 'Review' }
          ] : []).map((p) => (
            <button
              key={p.id}
              onClick={() => setView(p.id)}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all ${view === p.id
                ? 'bg-white text-slate-900 shadow-xl scale-105 active:scale-95'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50'
                }`}
            >
              {p.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative w-12 h-12 glass-card rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-slate-500 dark:text-slate-400"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728L12 12a4 4 0 110-8 4 4 0 010 8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User Info and Auth Buttons */}
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {currentUser?.fullName || currentUser?.name || currentUser?.email}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Welcome back</p>
            </div>
            <button
              onClick={onLogout}
              className="hidden sm:block bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onStartBuilding}
            className="hidden sm:block bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Start Building
          </button>
        )}
      </div>
    </header>
  );
}
