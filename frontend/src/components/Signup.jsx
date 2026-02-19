import React, { useState } from 'react';

const EliteInput = ({ label, value, onChange, placeholder = "", type = "text", autoComplete = "off" }) => (
  <div className="elite-input-container">
    <input
      type={type}
      className="elite-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder=" "
      required
      autoComplete={autoComplete}
    />
    <label className="elite-label">{label}</label>
    <div className="elite-underline"></div>
  </div>
);

import { api } from '../services/api';

export default function Signup({ onSignupSuccess, onSwitchToLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (fullName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to terms and conditions');
      return;
    }

    setIsLoading(true);

    try {
      await api.register(fullName, email, password);
      // Auto login after signup
      const loginResponse = await api.login(email, password);

      if (loginResponse.token) {
        localStorage.setItem('token', loginResponse.token);
        const userData = { email, name: fullName, token: loginResponse.token };
        localStorage.setItem('user_session', JSON.stringify(userData));
        onSignupSuccess(userData);
      } else {
        onSwitchToLogin();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed');
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Join ResumeStack</h2>
            <p className="text-slate-600 dark:text-slate-400">Create an account to start building</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <EliteInput
              label="Full Name"
              type="text"
              value={fullName}
              onChange={setFullName}
              placeholder="John Doe"
              autoComplete="name"
            />

            <EliteInput
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <EliteInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            <EliteInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 accent-indigo-600"
              />
              <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
                I agree to the <span className="font-bold text-indigo-600 dark:text-indigo-400">Terms of Service</span> and <span className="font-bold text-indigo-600 dark:text-indigo-400">Privacy Policy</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
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

          {/* Login Link */}
          <div className="text-center space-y-2">
            <p className="text-slate-600 dark:text-slate-400">Already have an account?</p>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-widest hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
