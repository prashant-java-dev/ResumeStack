import React, { useState, useRef } from "react";
import { checkAtsScore, parseResumeFromBinary } from "../geminiService.js";

// Circular Progress Component
const CircularProgress = ({
  score,
  size = 120,
  strokeWidth = 10,
  color = "#4f46e5",
  label = "",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4 group">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="rotate-[-90deg]" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)",
            }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tracking-tighter" style={{ color }}>
            {Math.round(score)}
          </span>
        </div>
      </div>

      {label && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
          {label}
        </p>
      )}
    </div>
  );
};

export default function AtsLab({ resume, onImport, onApplyTemplate }) {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uiMessage, setUiMessage] = useState(null);
  const fileInputRef = useRef(null);

  const createId = () => Math.random().toString(36).slice(2, 11);

  const startAnalysis = async (dataToAnalyze = resume) => {
    setIsLoading(true);
    try {
      const result = await checkAtsScore(dataToAnalyze);
      setReportData(result);
    } catch (e) {
      const errorMsg = e?.message || "System busy. Please try again later.";
      const isQuotaError = errorMsg.includes('quota') || errorMsg.includes('upgrade');

      const showStatus = (title, text, type = 'error') => {
        setUiMessage({ title, text, type });
        setTimeout(() => setUiMessage(null), 8000);
      };

      if (isQuotaError) {
        showStatus("Quota Limit", "Gemini AI daily limit reached. Please wait for reset.");
      } else {
        showStatus("Analysis Error", errorMsg);
      }
      console.error("ATS Analysis Error:", e);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setIsLoading(true);

    try {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const result = event.target && event.target.result;

        if (typeof result !== "string") {
          alert("Failed to read file");
          return;
        }

        const base64 = result.split(",")[1];

        try {
          const parsedData = await parseResumeFromBinary(base64, file.type);

          if (parsedData) {
            const newResume = {
              ...resume,
              ...parsedData, // Overlay parsed data

              personalInfo: {
                ...resume.personalInfo,
                ...(parsedData.personalInfo || {}),
              },

              experience: (parsedData.experience || []).map((i) => ({
                ...i,
                id: createId(),
                current: i.current ?? false,
              })),

              education: (parsedData.education || []).map((i) => ({
                ...i,
                id: createId(),
                description: i.description ?? "",
              })),

              projects: (parsedData.projects || []).map((i) => ({
                ...i,
                id: createId(),
                link: i.link ?? "",
                type: i.type ?? "Key",
              })),

              socialLinks: (parsedData.socialLinks || []).map((i) => ({
                ...i,
                id: createId(),
              })),

              skills: (parsedData.skills && parsedData.skills.length > 0) ? parsedData.skills : resume.skills,
              certifications: (parsedData.certifications && parsedData.certifications.length > 0) ? parsedData.certifications : resume.certifications,
              languages: (parsedData.languages && parsedData.languages.length > 0) ? parsedData.languages : resume.languages,
            };

            await startAnalysis(newResume);
            onImport(newResume);
          }
        } catch (error) {
          const errorMsg = error?.message || "Error reading file. Please use a clean PDF.";
          console.error("Resume Import Error Details:", error);
          setUiMessage({ title: "Import Failed", text: errorMsg, type: "error" });
          setTimeout(() => setUiMessage(null), 8000);
        } finally {
          setIsImporting(false);
          setIsLoading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsImporting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-20 space-y-20 animate-fade-up max-w-6xl mx-auto px-6 relative">
      {/* Notification Toast */}
      {uiMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6 animate-fade-up">
          <div className={`glass-card p-6 rounded-[2rem] border-2 shadow-premium flex items-center justify-between ${uiMessage.type === 'error' ? 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-900/10' :
              'border-amber-500/30 bg-amber-50/10 dark:bg-amber-900/10'
            }`}>
            <div className="flex items-center gap-4">
              <span className="text-2xl">{uiMessage.type === 'error' ? '⚠️' : 'ℹ️'}</span>
              <div>
                <h4 className={`font-black text-xs uppercase tracking-widest ${uiMessage.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>{uiMessage.title}</h4>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{uiMessage.text}</p>
              </div>
            </div>
            <button onClick={() => setUiMessage(null)} className="text-slate-400 hover:text-slate-600 ml-4">✕</button>
          </div>
        </div>
      )}

      <div className="text-center space-y-6">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white">
          Smart Resume Check
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-lg">
          AI reviews your resume like a recruiter.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.docx,.doc"
          />

          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={isLoading}
            className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase tracking-widest shadow-premium hover:scale-105 transition-transform disabled:opacity-50"
          >
            {isImporting ? "Reading..." : "Import Resume"}
          </button>

          <button
            onClick={() => startAnalysis()}
            disabled={isLoading}
            className="px-10 py-5 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-premium hover:scale-105 transition-transform disabled:opacity-50"
            style={{ background: resume.themeColor }}
          >
            {isLoading && !isImporting ? "Analyzing..." : "Analyze Draft"}
          </button>
        </div>
      </div>

      {reportData && reportData.sections && (
        <div className="space-y-16 animate-fade-up">
          {/* Main Score Card */}
          <div className="glass-card p-12 rounded-[3.5rem] shadow-soft flex flex-col items-center gap-12 justify-center text-center">

            <div className="flex flex-col items-center gap-4">
              <CircularProgress
                score={reportData.score}
                size={220}
                strokeWidth={18}
                color={resume.themeColor}
                label="Total ATS Score"
              />
              <div className="text-3xl font-black" style={{ color: resume.themeColor }}>{reportData.rating}</div>
              <p className="text-slate-500 max-w-xl">{reportData.companyContextFeedback}</p>
            </div>

            <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 w-full">
              {Object.entries(reportData.sections).map(([id, section]) => (
                <div key={id} className="flex flex-col items-center gap-2">
                  <CircularProgress
                    score={Math.round(section.score)}
                    size={80}
                    strokeWidth={6}
                    color={
                      section.score >= 90 ? "#16a34a" :
                        section.score >= 70 ? "#4f46e5" :
                          section.score >= 40 ? "#f59e0b" : "#dc2626"
                    }
                  />
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{section.label}</span>
                    <span className="text-[9px] text-slate-400">{section.feedback}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Key Recommendations */}
            <div className="glass-card p-10 rounded-[3rem] shadow-soft">
              <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500 mb-8">Top Improvements</h3>
              <ul className="space-y-6">
                {(reportData.keyImprovements || reportData.suggestions)?.map((suggestion, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">{i + 1}</span>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Checks */}
            <div className="glass-card p-10 rounded-[3rem] shadow-soft">
              <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500 mb-8">System Checks</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {(reportData.forensicChecklist || reportData.checks)?.map((check, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${String(check.status).toLowerCase() === 'passed' ? 'bg-emerald-500' : String(check.status).toLowerCase() === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{check.category || check.label}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${String(check.status).toLowerCase() === 'passed' ? 'text-emerald-500' : String(check.status).toLowerCase() === 'warning' ? 'text-amber-500' : 'text-rose-500'}`}>
                      {check.feedback}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
