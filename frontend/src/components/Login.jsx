import React, { useState } from 'react';

const EliteInput = ({ label, value, onChange, placeholder = "", type = "text" }) => (
  <div className="elite-input-container">
    <input
      type={type}
      className="elite-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || label}
      required
    />
    <label className="elite-label">{label}</label>
    <div className="elite-underline"></div>
  </div>
);

import { api } from '../services/api';

export default function Login({ onLoginSuccess, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.login(email, password);

      if (response.token) {
        localStorage.setItem('token', response.token);
        const userData = { email, name: email.split('@')[0], token: response.token };
        localStorage.setItem('user_session', JSON.stringify(userData));
        console.log("Login successful", userData);
        onLoginSuccess(userData);
      } else {
        setError('Login failed: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error("Login error", err);
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 -z-10"></div>

      <div className="w-full max-w-md animate-fade-up">
        <div className="glass-card rounded-3xl p-10 space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-xl mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="text-slate-600 dark:text-slate-400">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <EliteInput
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />

            <EliteInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">Or</span>
            </div>
          </div>

          {/* Signup Link */}
          <div className="text-center space-y-2">
            <p className="text-slate-600 dark:text-slate-400">Don't have an account?</p>
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-widest hover:underline"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
