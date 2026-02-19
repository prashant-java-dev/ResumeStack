import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header.jsx';
import SidebarForm from './components/SidebarForm.jsx';
import ResumePreview from './components/ResumePreview.jsx';
import AtsLab from './components/AtsLab.jsx';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import { createEmptyResume } from './types.js';

import { api } from './services/api';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';


// ---------- Empty Resume Creator ----------
// Moved to types.js - import createEmptyResume above

export default function App() {

  const [activePage, setActivePage] = useState('home');
  const [authMode, setAuthMode] = useState(null); // 'login' or 'signup'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userResume, setUserResume] = useState(createEmptyResume());
  const [selectedTemplate, setSelectedTemplate] = useState('Modern');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  const resumePreviewRef = useRef(null);


  // ---------- Load Saved Data & Check Auth ----------
  useEffect(() => {
    // Check for existing user session
    const token = localStorage.getItem('token');
    const userSession = localStorage.getItem('user_session');

    if (token && userSession) {
      try {
        const userData = JSON.parse(userSession);
        setCurrentUser(userData);
        setIsAuthenticated(true);
        setActivePage('edit');
        loadUserResume();
      } catch (e) {
        console.error("Failed to parse user session", e);
        setIsAuthenticated(false);
      }
    } else {
      // Fallback to local storage resume if not logged in
      loadLocalResume();
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      if (savedTheme === 'dark') setIsDarkMode(true);
      else setIsDarkMode(false);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);

  }, []);

  const loadLocalResume = () => {
    const saved = localStorage.getItem('my_resume_app_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserResume({
          ...createEmptyResume(),
          ...parsed,
          projects: parsed.projects || [],
          socialLinks: parsed.socialLinks || [],
          certifications: parsed.certifications || [],
          languages: parsed.languages || [],
          applications: parsed.applications || [],
          coverLetter: parsed.coverLetter || ''
        });

      } catch (e) {
        console.error("Failed to parse saved data", e);
        setUserResume(createEmptyResume());
      }
    } else {
      setUserResume(createEmptyResume());
    }
  }

  const loadUserResume = async () => {
    try {
      const resumes = await api.getMyResumes();
      if (resumes && resumes.length > 0) {
        setUserResume(resumes[0]);
      }
      // If no resume, create one via save logic or keep default
    } catch (e) {
      console.error("Failed to load resume", e);
    }
  }


  // ---------- Save Resume ----------
  useEffect(() => {

    localStorage.setItem('my_resume_app_data', JSON.stringify(userResume));

    // Backend Sync (Debounced)
    if (isAuthenticated) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          // Check if it has Mongo ID (24 hex chars)
          const isMongoId = /^[0-9a-fA-F]{24}$/.test(userResume.id);

          if (isMongoId) {
            await api.updateResume(userResume.id, userResume);
          } else {
            // Create new
            const saved = await api.createResume(userResume);
            // Update ID to avoid creating duplicates
            setUserResume(prev => ({ ...prev, id: saved.id }));
          }
        } catch (e) {
          console.error("Auto-save failed", e);
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    }

    const root = document.documentElement;
    // ... theme logic stays ...

    if (userResume.themeColor.includes('gradient')) {
      root.style.setProperty('--theme-gradient', userResume.themeColor);
      root.style.setProperty('--theme-primary', '#4f46e5');
    } else {
      root.style.setProperty('--theme-gradient', userResume.themeColor);
      root.style.setProperty('--theme-primary', userResume.themeColor);
    }

  }, [userResume, isAuthenticated]);


  // ---------- Theme Toggle ----------
  useEffect(() => {

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // ---------- Authentication Handlers ----------
  const handleStartBuilding = () => {
    if (isAuthenticated) {
      setActivePage('edit');
    } else {
      setAuthMode('login');
      setActivePage('auth');
    }
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setAuthMode(null);
    setActivePage('edit');
    loadUserResume();
  };

  const handleSignupSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setAuthMode(null);
    setActivePage('edit');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActivePage('home');
    setAuthMode(null);
    setUserResume(createEmptyResume());
  };


  // ---------- PDF Download ----------
  const handleDownloadPdf = async () => {

    if (!resumePreviewRef.current) return;

    setIsDownloadingPdf(true);

    try {

      const canvas = await html2canvas(resumePreviewRef.current, {
        scale: 1.5,
        useCORS: true,
        windowWidth: resumePreviewRef.current.scrollWidth,
        windowHeight: resumePreviewRef.current.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);

      const filename = `resume-${userResume.personalInfo.fullName.replace(/\s+/g, '-') || 'untitled'}.pdf`;

      const pdfBlob = pdf.output('blob');
      const pdfSizeMB = pdfBlob.size / (1024 * 1024);

      const MAX_PDF_SIZE_MB = 2;

      if (pdfSizeMB > MAX_PDF_SIZE_MB) {
        alert(`Warning: PDF size is ${pdfSizeMB.toFixed(2)} MB`);
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');

      link.href = blobUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

    } catch (error) {

      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");

    } finally {
      setIsDownloadingPdf(false);
    }
  };


  // ---------- UI ----------
  return (
    <div className="min-h-screen relative transition-colors duration-500 font-sans">

      <Header
        view={activePage}
        setView={(page) => {
          if (page === 'home') {
            setActivePage('home');
            setAuthMode(null);
          } else if (!isAuthenticated && (page === 'edit' || page === 'ats-lab')) {
            handleStartBuilding();
          } else {
            setActivePage(page);
          }
        }}
        theme={isDarkMode ? 'dark' : 'light'}
        toggleTheme={toggleTheme}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLogout={handleLogout}
        onStartBuilding={handleStartBuilding}
      />

      <main className="pt-24 pb-20 relative z-10">

        {/* Home */}
        {activePage === 'home' && (
          <Home onStartBuilding={handleStartBuilding} />
        )}

        {/* Authentication */}
        {activePage === 'auth' && (
          <>
            {authMode === 'login' ? (
              <Login
                onLoginSuccess={handleLoginSuccess}
                onSwitchToSignup={() => setAuthMode('signup')}
              />
            ) : (
              <Signup
                onSignupSuccess={handleSignupSuccess}
                onSwitchToLogin={() => setAuthMode('login')}
              />
            )}
          </>
        )}

        {/* Landing (Old) - Kept for backwards compatibility */}
        {activePage === 'landing' && (
          <div className="max-w-6xl mx-auto px-6 py-20 text-center">

            <h1 className="text-6xl md:text-8xl font-black mb-8 text-slate-900 dark:text-white">
              Get your
              <span
                className="text-indigo-600 dark:text-indigo-400"
                style={!userResume.themeColor.includes('gradient')
                  ? { color: userResume.themeColor }
                  : {}}
              >
                dream job
              </span>
              <br />
              with a better resume.
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
              AI powered resume builder
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">

              <button
                onClick={() => setActivePage('edit')}
                className="px-10 py-5 text-white rounded-2xl font-black"
                style={{ background: userResume.themeColor }}
              >
                Start Building
              </button>

              <button
                onClick={() => setActivePage('ats-lab')}
                className="px-10 py-5 bg-white dark:bg-slate-900 border rounded-2xl font-black"
              >
                Check My Score
              </button>

            </div>
          </div>
        )}

        {/* Builder - Protected */}
        {activePage === 'edit' && isAuthenticated && (
          <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-up">
            <div className="space-y-8">
              <SidebarForm
                data={userResume}
                setData={setUserResume}
                template={selectedTemplate}
                setTemplate={setSelectedTemplate}
              />
            </div>
            <div className="hidden lg:block sticky top-28 h-[calc(100vh-140px)]">
              <div className="glass-card p-6 rounded-[3rem] shadow-soft h-full flex flex-col">
                <div className="flex justify-between items-center mb-6 px-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: userResume.themeColor }}></div>
                    <h3 className="font-black uppercase tracking-[0.2em] text-[10px]">Real-time Preview</h3>
                  </div>
                  <button onClick={() => setActivePage('preview')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white">Full View</button>
                </div>
                <div className="flex-1 rounded-[2rem] overflow-hidden shadow-inner bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 overflow-y-auto">
                  <div className="scale-[0.85] origin-top p-4">
                    {/* Pass the ref to ResumePreview */}
                    <ResumePreview data={userResume} template={selectedTemplate} ref={resumePreviewRef} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ATS - Protected */}
        {activePage === 'ats-lab' && isAuthenticated && (
          <div className="max-w-6xl mx-auto px-6">

            <AtsLab
              resume={userResume}
              onImport={(newData) => setUserResume(newData)}
              onApplyTemplate={setSelectedTemplate}
            />

          </div>
        )}


        {/* Preview - Protected */}
        {activePage === 'preview' && isAuthenticated && (
          <div className="max-w-5xl mx-auto p-6">

            <div className="mb-10 flex justify-between gap-6">

              <button onClick={() => setActivePage('edit')}>
                Go Back
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                style={{ background: userResume.themeColor }}
                className="px-10 py-4 text-white rounded-2xl"
              >
                {isDownloadingPdf ? 'Generating...' : 'Download PDF'}
              </button>

            </div>

            <ResumePreview
              data={userResume}
              template={selectedTemplate}
              ref={resumePreviewRef}
            />

          </div>
        )}

      </main>
    </div>
  );
}
