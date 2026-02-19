import React, { useState, useRef } from 'react';
import { optimizeSummary, parseResumeFromBinary, checkAtsScore, generateCoverLetter, optimizeResumeForAts } from '../geminiService';
import ColorPicker from './ColorPicker';
import ManualResumeImport from './ManualResumeImport';
import ATSReviewModal from './ATSReviewModal';

const EliteInput = ({ label, value, onChange, placeholder = "", type = "text", autoComplete = "off" }) => (
    <div className="elite-input-container">
        <input
            type={type}
            className="elite-input"
            value={value === null || value === undefined ? '' : value}
            onChange={e => onChange(e.target.value)}
            placeholder=" "
            autoComplete={autoComplete}
        />
        <label className="elite-label">{label}</label>
        <div className="elite-underline"></div>
    </div>
);

const EliteTextArea = ({ label, value, onChange, rows = 8 }) => (
    <div className="elite-input-container">
        <textarea
            className="elite-input resize-none overflow-y-auto"
            value={value === null || value === undefined ? '' : value}
            onChange={e => onChange(e.target.value)}
            rows={rows}
            placeholder=" "
        />
        <label className="elite-label">{label}</label>
        <div className="elite-underline"></div>
    </div>
);

const getErrorMessage = (error) => String(error?.message || '');

const isQuotaError = (error) => {
    const message = getErrorMessage(error).toLowerCase();
    return (
        error?.isQuotaError === true ||
        error?.name === 'GeminiQuotaError' ||
        (message.includes('quota') && message.includes('exceeded')) ||
        message.includes('429') ||
        message.includes('rate limit') ||
        message.includes('resource_exhausted')
    );
};

export default function SidebarForm({ data, setData, template, setTemplate }) {
    const [activeSection, setActiveSection] = useState('My Info');
    const [isAiWriting, setIsAiWriting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false); // New state
    const [showManualImport, setShowManualImport] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [atsResult, setAtsResult] = useState(null);
    const [showATSReview, setShowATSReview] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
    const [jobTitleForCL, setJobTitleForCL] = useState(data.personalInfo.jobTitle || '');
    const [companyNameForCL, setCompanyNameForCL] = useState('');
    const [jobDescriptionForCL, setJobDescriptionForCL] = useState('');
    const [quotaExceeded, setQuotaExceeded] = useState(false);

    const fileInputRef = useRef(null);

    const showQuotaAlert = () => {
        alert(
            "API quota limit reached for Gemini.\n\n" +
            "Try one of these:\n" +
            "- Wait for quota reset (usually daily)\n" +
            "- Use Manual Input for now\n" +
            "- Upgrade Gemini API plan\n\n" +
            "Quota docs: https://ai.google.dev/gemini-api/docs/rate-limits"
        );
    };

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('my_resume_app_data', JSON.stringify(data));
        setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }, 600);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setAtsResult(null);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const result = event.target?.result;
                if (typeof result !== 'string') return;
                const base64 = result.split(',')[1];
                try {
                    const parsedData = await parseResumeFromBinary(base64, file.type);
                    if (parsedData) {
                        const mappedExperience = (parsedData.experience || []).map((exp) => ({
                            id: Math.random().toString(36).substr(2, 9),
                            company: exp.company || '',
                            position: exp.position || '',
                            startDate: exp.startDate || '',
                            endDate: exp.endDate || '',
                            description: exp.description || '',
                            current: !!exp.current
                        }));

                        const mappedEducation = (parsedData.education || []).map((edu) => ({
                            id: Math.random().toString(36).substr(2, 9),
                            school: edu.school || '',
                            degree: edu.degree || '',
                            startDate: edu.startDate || '',
                            endDate: edu.endDate || '',
                            description: edu.description || ''
                        }));

                        const mappedProjects = (parsedData.projects || []).map((p) => ({
                            id: Math.random().toString(36).substr(2, 9),
                            name: p.name || '',
                            role: p.role || '',
                            link: p.link || '',
                            description: p.description || '',
                            type: p.type || 'Key'
                        }));

                        const mappedSocialLinks = (parsedData.socialLinks || []).map((s) => ({
                            id: Math.random().toString(36).substr(2, 9),
                            platform: s.platform || '',
                            url: s.url || ''
                        }));

                        const updatedResume = {
                            ...data,
                            personalInfo: { ...data.personalInfo, ...(parsedData.personalInfo || {}) },
                            experience: mappedExperience.length > 0 ? mappedExperience : data.experience,
                            education: mappedEducation.length > 0 ? mappedEducation : data.education,
                            projects: mappedProjects.length > 0 ? mappedProjects : data.projects,
                            socialLinks: mappedSocialLinks.length > 0 ? mappedSocialLinks : data.socialLinks,
                            skills: (parsedData.skills && parsedData.skills.length > 0) ? parsedData.skills : data.skills,
                            certifications: (parsedData.certifications && parsedData.certifications.length > 0) ? parsedData.certifications : data.certifications,
                            languages: (parsedData.languages && parsedData.languages.length > 0) ? parsedData.languages : data.languages,
                        };
                        setData(updatedResume);

                        // ATS Check - Show detailed review after import
                        try {
                            const scoreResult = await checkAtsScore(updatedResume);
                            if (scoreResult) {
                                setAtsResult(scoreResult);
                                // Also update the main data state so it shows in the preview
                                setData(prev => ({ ...prev, atsScore: scoreResult.score }));
                                // Automatically show the comprehensive review modal
                                setShowATSReview(true);
                            }
                        } catch (atsError) {
                            if (isQuotaError(atsError)) {
                                setQuotaExceeded(true);
                                console.warn("ATS analysis skipped due to API quota.");
                            } else {
                                console.warn("ATS Analysis skipped/failed:", atsError);
                            }
                        }
                    }
                } catch (err) {
                    const errorMsg = getErrorMessage(err) || "Error reading file.";
                    if (isQuotaError(err)) {
                        setQuotaExceeded(true);
                        console.warn("Resume import blocked by API quota:", errorMsg);
                        showQuotaAlert();
                    } else {
                        console.error("Resume Import Error Details:", err);
                        console.error("Error stack:", err?.stack);
                        alert(`Resume import failed.\n\n${errorMsg}`);
                    }
                } finally {
                    setIsImporting(false);
                    // Reset file input
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("File upload error:", err);
            setIsImporting(false);
        }
    };

    const handleAutoOptimize = async () => {
        if (quotaExceeded) return showQuotaAlert();
        if (!data.personalInfo.fullName) return alert("Please add at least your name and some experience/skills first.");
        setIsOptimizing(true);
        try {
            const optimizedData = await optimizeResumeForAts(data);
            if (optimizedData) {
                // Merge optimized fields while preserving IDs if possible, or just replace relevant sections
                // For simplicity, we replace content but try to keep structure.
                // Since API returns strict structure, we can map it back.

                // We need to match IDs if we want to be safe, but typically optimization rewrites content.
                // Let's generate new IDs for the optimized content to avoid key conflicts or stale state.

                const mapWithIds = (arr) => arr.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));

                const newExperience = mapWithIds(optimizedData.experience || []);

                const newData = {
                    ...data,
                    personalInfo: { ...data.personalInfo, ...optimizedData.personalInfo },
                    experience: newExperience.length ? newExperience : data.experience,
                    education: optimizedData.education ? mapWithIds(optimizedData.education) : data.education,
                    skills: optimizedData.skills || data.skills,
                    // Recalculate ATS score after optimization
                    atsScore: null
                };

                setData(newData);

                // Auto-check ATS score for the new data
                try {
                    const scoreResult = await checkAtsScore(newData);
                    if (scoreResult) {
                        setAtsResult(scoreResult);
                        setData(prev => ({ ...prev, atsScore: scoreResult.score }));
                    }
                } catch (e) {
                    if (isQuotaError(e)) {
                        setQuotaExceeded(true);
                        console.warn("Post-optimization ATS check skipped due to API quota.");
                    } else {
                        console.error("Post-optimization ATS check failed", e);
                    }
                }
                alert("✨ Resume Optimized! Check your improved content and new ATS score.");
            }
        } catch (error) {
            if (isQuotaError(error)) {
                setQuotaExceeded(true);
                console.warn("Optimization skipped due to API quota.");
                showQuotaAlert();
            } else {
                console.error("Optimization failed:", error);
                alert("Optimization failed. Please check your data or try again later.");
            }
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleAnalyzeDraft = async () => {
        if (quotaExceeded) return showQuotaAlert();
        if (!data.personalInfo.fullName && !data.personalInfo.email) {
            return alert("Please add at least your name and email to analyze your resume.");
        }
        setIsAnalyzing(true);
        try {
            const scoreResult = await checkAtsScore(data);
            if (scoreResult) {
                setAtsResult(scoreResult);
                setData(prev => ({ ...prev, atsScore: scoreResult.score }));
                setShowATSReview(true);
            }
        } catch (error) {
            if (isQuotaError(error)) {
                setQuotaExceeded(true);
                console.warn("ATS analysis failed due to API quota.");
                showQuotaAlert();
            } else {
                console.error("ATS Analysis failed:", error);
                alert("Failed to analyze resume. Please check your data or try again.");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const writeBioWithAi = async () => {
        if (quotaExceeded) return showQuotaAlert();
        if (!data.personalInfo.jobTitle) return alert("Enter your job title first.");
        setIsAiWriting(true);
        try {
            const result = await optimizeSummary(data.personalInfo.jobTitle, data.skills);
            setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: result } }));
        } catch (error) {
            if (isQuotaError(error)) {
                setQuotaExceeded(true);
                console.warn("Summary generation skipped due to API quota.");
                showQuotaAlert();
            } else {
                console.error("Summary generation failed:", error);
                alert("Failed to generate summary. Please try again.");
            }
        } finally {
            setIsAiWriting(false);
        }
    };

    const handleGenerateCoverLetter = async () => {
        if (quotaExceeded) return showQuotaAlert();
        if (!jobTitleForCL || !companyNameForCL || !jobDescriptionForCL) {
            return alert("Please fill in all job details (title, company, description) to generate a cover letter.");
        }
        setIsGeneratingCoverLetter(true);
        try {
            const generatedText = await generateCoverLetter(
                data,
                jobTitleForCL,
                companyNameForCL,
                jobDescriptionForCL
            );
            setData({ ...data, coverLetter: generatedText });
        } catch (error) {
            if (isQuotaError(error)) {
                setQuotaExceeded(true);
                console.warn("Cover letter generation skipped due to API quota.");
                showQuotaAlert();
            } else {
                console.error("Cover letter generation failed:", error);
                alert("Failed to generate cover letter. Please try again.");
            }
        } finally {
            setIsGeneratingCoverLetter(false);
        }
    };

    const addItem = (section, defaultObj) => {
        setData(prev => ({ ...prev, [section]: [defaultObj, ...(prev[section] || [])] }));
    };

    const removeItem = (section, id) => {
        setData(prev => ({ ...prev, [section]: (prev[section] || []).filter(item => item.id !== id) }));
    };

    const editItem = (section, id, updates) => {
        setData(prev => ({
            ...prev,
            [section]: (prev[section] || []).map(item => item.id === id ? { ...item, ...updates } : item)
        }));
    };

    const menuItems = [
        { name: 'My Info' },
        { name: 'Socials' },
        { name: 'Work' },
        { name: 'Projects' },
        { name: 'School' },
        { name: 'Skills' },
        { name: 'Review' },
        { name: 'Cover Letter' },
        { name: 'Style' }
    ];

    const templates = [
        { id: 'GooglePro', label: 'Google Pro', desc: 'Clean and tidy' },
        { id: 'MetaModern', label: 'Meta Modern', desc: 'New and airy' },
        { id: 'IBMProfessional', label: 'IBM/Wipro Elite', desc: 'Strong structure' },
        { id: 'FAANG', label: 'Big Tech', desc: 'The gold standard' },
        { id: 'Enterprise', label: 'Corporate', desc: 'Best for firms' },
        { id: 'Minimalist', label: 'Minimalist', desc: 'Pure simplicity' },
        { id: 'Modern', label: 'Modern Digital', desc: 'Fresh look' },
        { id: 'Classic', label: 'Classic', desc: 'Traditional' },
        { id: 'Executive', label: 'Executive', desc: 'High elegance' }
    ];

    // In the return block, inside the header div:
    return (
        <div className="space-y-6">
            {/* ATS Result */}
            {atsResult && (
                <div
                    className="animate-fade-up glass-card p-6 rounded-[2rem] border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-900/10 shadow-premium cursor-pointer hover:scale-[1.02] transition-all group"
                    onClick={() => setShowATSReview(true)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400">
                                {atsResult.score}
                            </div>
                            <div>
                                <h4 className="font-black text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Draft Score</h4>
                                <p className="text-[10px] font-bold text-slate-500">Your resume is: {atsResult.rating}</p>
                                <p className="text-[9px] text-indigo-600 dark:text-indigo-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click for detailed review →</p>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setAtsResult(null); }} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                </div>
            )}

            {/* Editor Header */}
            <div className="glass-card p-6 rounded-[2.5rem] flex flex-wrap justify-between items-center shadow-soft gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg bg-slate-900 dark:bg-white dark:text-slate-900" style={data.themeColor && !data.themeColor.includes('gradient') ? { backgroundColor: data.themeColor } : {}}>R</div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Editor</h2>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                    <button
                        onClick={handleAutoOptimize}
                        disabled={isOptimizing || quotaExceeded}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {isOptimizing ? 'Optimizing...' : '✨ Auto-Optimize'}
                    </button>
                    <button
                        onClick={handleSave}
                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-premium ${saveSuccess ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700 hover:scale-105 active:scale-95'}`}
                    >
                        {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting || quotaExceeded}
                        className="px-6 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isImporting ? 'Reading...' : 'Import PDF'}
                    </button>
                    <button
                        onClick={() => setShowManualImport(true)}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white dark:bg-indigo-500 font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all"
                    >
                        Manual Input
                    </button>
                </div>
            </div>

            {/* Manual Resume Import Modal */}
            {
                showManualImport && (
                    <ManualResumeImport
                        onImport={(importedData) => {
                            console.log("📥 Imported Data:", importedData);

                            const mappedExperience = (importedData.experience || []).map((exp) => ({
                                id: Math.random().toString(36).substr(2, 9),
                                company: exp.company || '',
                                position: exp.position || '',
                                startDate: exp.startDate || '',
                                endDate: exp.endDate || '',
                                description: exp.description || '',
                                current: !!exp.current
                            }));

                            const mappedEducation = (importedData.education || []).map((edu) => ({
                                id: Math.random().toString(36).substr(2, 9),
                                school: edu.school || '',
                                degree: edu.degree || '',
                                startDate: edu.startDate || '',
                                endDate: edu.endDate || '',
                                description: edu.description || ''
                            }));

                            const mappedProjects = (importedData.projects || []).map((p) => ({
                                id: Math.random().toString(36).substr(2, 9),
                                name: p.name || '',
                                role: p.role || '',
                                link: p.link || '',
                                description: p.description || '',
                                type: p.type || 'Key'
                            }));

                            const mappedSocialLinks = (importedData.socialLinks || []).map((s) => ({
                                id: Math.random().toString(36).substr(2, 9),
                                platform: s.platform || '',
                                url: s.url || ''
                            }));

                            const updatedResume = {
                                personalInfo: importedData.personalInfo || {},
                                experience: mappedExperience,
                                education: mappedEducation,
                                projects: mappedProjects,
                                socialLinks: mappedSocialLinks,
                                skills: importedData.skills || [],
                                certifications: importedData.certifications || [],
                                languages: importedData.languages || [],
                                template: data.template || 'Modern',
                                themeColor: data.themeColor || '#4f46e5',
                                coverLetter: data.coverLetter || ''
                            };

                            console.log("✅ Updated Resume:", updatedResume);
                            setData(updatedResume);
                            setShowManualImport(false);
                        }}
                        onClose={() => setShowManualImport(false)}
                    />
                )
            }
            <nav className="flex gap-2 p-2 glass-card rounded-[2rem] overflow-x-auto no-scrollbar">
                {menuItems.map(item => (
                    <button key={item.name} onClick={() => setActiveSection(item.name)} className={`flex-1 min-w-[90px] py-4 rounded-2xl transition-all font-black text-[9px] uppercase tracking-widest ${activeSection === item.name ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white dark:from-white dark:to-white dark:text-slate-900 shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                        {item.name}
                    </button>
                ))}
            </nav>

            <div className="glass-card p-10 rounded-[3rem] shadow-soft min-h-[500px]">
                {activeSection === 'My Info' && (
                    <div className="space-y-10 animate-fade-up">
                        <h3 className="text-xl font-black uppercase tracking-widest mb-8 text-indigo-500 dark:text-indigo-400">Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <EliteInput label="Full Name" value={data.personalInfo.fullName} onChange={v => setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, fullName: v } }))} autoComplete="name" />
                            <EliteInput label="Job Title" value={data.personalInfo.jobTitle} onChange={v => setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, jobTitle: v } }))} autoComplete="organization-title" />
                            <EliteInput label="Email" value={data.personalInfo.email} onChange={v => setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, email: v } }))} autoComplete="email" />
                            <EliteInput label="Phone" value={data.personalInfo.phone} onChange={v => setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, phone: v } }))} autoComplete="tel" />
                            <EliteInput label="City" value={data.personalInfo.location} onChange={v => setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, location: v } }))} autoComplete="address-level2" />
                        </div>
                        <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">About Me</label>
                                <button onClick={writeBioWithAi} disabled={isAiWriting || quotaExceeded} className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:scale-105 transition-all">
                                    {isAiWriting ? 'Thinking...' : '✨ AI Assist'}
                                </button>
                            </div>
                            <EliteTextArea label="Summary" value={data.personalInfo.summary} onChange={v => setData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, summary: v } }))} rows={6} />
                        </div>
                    </div>
                )}

                {activeSection === 'Socials' && (
                    <div className="space-y-12 animate-fade-up">
                        <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Social Presence</h3>
                        <div className="space-y-10">
                            {data.socialLinks.map(link => (
                                <div key={link.id} className="relative group border-b border-slate-50 dark:border-slate-900 pb-10 last:border-0">
                                    <button onClick={() => removeItem('socialLinks', link.id)} className="absolute -top-4 -right-4 p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="grid grid-cols-2 gap-8">
                                        <EliteInput label="Platform (LinkedIn, GitHub...)" value={link.platform} onChange={v => editItem('socialLinks', link.id, { platform: v })} />
                                        <EliteInput label="URL" value={link.url} onChange={v => editItem('socialLinks', link.id, { url: v })} />
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => addItem('socialLinks', { id: Date.now().toString(), platform: '', url: '' })} className="w-full py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-500 transition-all">
                                + Add Social Link
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'Work' && (
                    <div className="space-y-12 animate-fade-up">
                        <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Work History</h3>
                        <div className="space-y-16">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="relative group border-b border-slate-50 dark:border-slate-900 pb-12 last:border-0">
                                    <button onClick={() => removeItem('experience', exp.id)} className="absolute -top-4 -right-4 p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="grid grid-cols-2 gap-8 mb-6">
                                        <EliteInput label="Company" value={exp.company} onChange={v => editItem('experience', exp.id, { company: v })} />
                                        <EliteInput label="Job Title" value={exp.position} onChange={v => editItem('experience', exp.id, { position: v })} />
                                        <EliteInput label="Start Date" value={exp.startDate} onChange={v => editItem('experience', exp.id, { startDate: v })} />
                                        <EliteInput label="End Date" value={exp.endDate} onChange={v => editItem('experience', exp.id, { endDate: v })} />
                                    </div>
                                    <EliteTextArea label="Description" value={exp.description} onChange={v => editItem('experience', exp.id, { description: v })} rows={8} />
                                </div>
                            ))}
                            <button onClick={() => addItem('experience', { id: Date.now().toString(), company: '', position: '', startDate: '', endDate: '', description: '', current: false })} className="w-full py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-500 transition-all">
                                + Add Work
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'Projects' && (
                    <div className="space-y-12 animate-fade-up">
                        <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Projects</h3>
                        <div className="space-y-16">
                            {data.projects.map(proj => (
                                <div key={proj.id} className="relative group border-b border-slate-50 dark:border-slate-900 pb-12 last:border-0">
                                    <EliteInput label="Project Type (e.g., Key, Personal, Academic)" value={proj.type} onChange={v => editItem('projects', proj.id, { type: v })} />
                                    <button onClick={() => removeItem('projects', proj.id)} className="absolute -top-4 -right-4 p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="grid grid-cols-2 gap-8 mb-6 mt-8">
                                        <EliteInput label="Project Name" value={proj.name} onChange={v => editItem('projects', proj.id, { name: v })} />
                                        <EliteInput label="Your Role" value={proj.role} onChange={v => editItem('projects', proj.id, { role: v })} />
                                        <EliteInput label="Project Link" value={proj.link} onChange={v => editItem('projects', proj.id, { link: v })} />
                                    </div>
                                    <EliteTextArea label="Details" value={proj.description} onChange={v => editItem('projects', proj.id, { description: v })} rows={6} />
                                </div>
                            ))}
                            <button onClick={() => addItem('projects', { id: Date.now().toString(), name: '', role: '', description: '', type: 'Key', link: '' })} className="w-full py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-500 transition-all">
                                + Add Project
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'School' && (
                    <div className="space-y-12 animate-fade-up">
                        <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Education</h3>
                        <div className="space-y-16">
                            {data.education.map(edu => (
                                <div key={edu.id} className="relative group">
                                    <button onClick={() => removeItem('education', edu.id)} className="absolute -top-4 -right-4 p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                    <div className="grid grid-cols-2 gap-8 mb-6">
                                        <EliteInput label="School Name" value={edu.school} onChange={v => editItem('education', edu.id, { school: v })} />
                                        <EliteInput label="Degree" value={edu.degree} onChange={v => editItem('education', edu.id, { degree: v })} />
                                        <EliteInput label="Start" value={edu.startDate} onChange={v => editItem('education', edu.id, { startDate: v })} />
                                        <EliteInput label="End" value={edu.endDate} onChange={v => editItem('education', edu.id, { endDate: v })} />
                                    </div>
                                    <EliteTextArea label="Description" value={edu.description} onChange={v => editItem('education', edu.id, { description: v })} rows={4} />
                                </div>
                            ))}
                            <button onClick={() => addItem('education', { id: Date.now().toString(), school: '', degree: '', startDate: '', endDate: '', description: '' })} className="w-full py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-indigo-500 transition-all">
                                + Add School
                            </button>
                        </div>
                    </div>
                )}

                {activeSection === 'Skills' && (
                    <div className="space-y-12 animate-fade-up">
                        <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Skills & Extras</h3>

                        <div className="space-y-8">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Skills</label>
                            {data.skills.map((skill, i) => (
                                <div key={i} className="flex gap-4">
                                    <EliteInput label={`Skill #${i + 1}`} value={skill} onChange={v => {
                                        const next = [...data.skills];
                                        next[i] = v;
                                        setData(prev => ({ ...prev, skills: next }));
                                    }} />
                                    <button onClick={() => setData(prev => ({ ...prev, skills: prev.skills.filter((_, idx) => idx !== i) }))} className="text-rose-500 mt-6">✕</button>
                                </div>
                            ))}
                            <button onClick={() => setData(prev => ({ ...prev, skills: [...prev.skills, ''] }))} className="text-[9px] font-black uppercase tracking-widest text-indigo-500">+ Add Skill</button>
                        </div>

                        <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Certifications</label>
                            {data.certifications.map((cert, i) => (
                                <div key={i} className="flex gap-4">
                                    <EliteInput label={`Certs #${i + 1}`} value={cert} onChange={v => {
                                        const next = [...data.certifications];
                                        next[i] = v;
                                        setData(prev => ({ ...prev, certifications: next }));
                                    }} />
                                    <button onClick={() => setData(prev => ({ ...prev, certifications: prev.certifications.filter((_, idx) => idx !== i) }))} className="text-rose-500 mt-6">✕</button>
                                </div>
                            ))}
                            <button onClick={() => setData(prev => ({ ...prev, certifications: [...prev.certifications, ''] }))} className="text-[9px] font-black uppercase tracking-widest text-indigo-500">+ Add Certificate</button>
                        </div>

                        <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Languages</label>
                            {data.languages.map((lang, i) => (
                                <div key={i} className="flex gap-4">
                                    <EliteInput label={`Language #${i + 1}`} value={lang} onChange={v => {
                                        const next = [...data.languages];
                                        next[i] = v;
                                        setData(prev => ({ ...prev, languages: next }));
                                    }} />
                                    <button onClick={() => setData(prev => ({ ...prev, languages: prev.languages.filter((_, idx) => idx !== i) }))} className="text-rose-500 mt-6">✕</button>
                                </div>
                            ))}
                            <button onClick={() => setData(prev => ({ ...prev, languages: [...prev.languages, ''] }))} className="text-[9px] font-black uppercase tracking-widest text-indigo-500">+ Add Language</button>
                        </div>
                    </div>
                )}

                {activeSection === 'Cover Letter' && (
                    <div className="space-y-10 animate-fade-up">
                        <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Generate Cover Letter</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <EliteInput label="Target Job Title" value={jobTitleForCL} onChange={setJobTitleForCL} />
                            <EliteInput label="Company Name" value={companyNameForCL} onChange={setCompanyNameForCL} />
                            <div className="md:col-span-2">
                                <EliteTextArea label="Job Description (Paste here)" value={jobDescriptionForCL} onChange={setJobDescriptionForCL} rows={10} />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={handleGenerateCoverLetter}
                                disabled={isGeneratingCoverLetter || quotaExceeded}
                                className="flex-1 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                style={{ background: data.themeColor }}
                            >
                                {isGeneratingCoverLetter ? 'Generating...' : '✨ Generate Cover Letter'}
                            </button>
                            <button
                                onClick={() => setData({ ...data, coverLetter: '' })}
                                className="py-5 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95"
                            >
                                Clear Letter
                            </button>
                        </div>
                        {data.coverLetter && (
                            <div className="space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Cover Letter</label>
                                <EliteTextArea rows={15} label="" value={data.coverLetter} onChange={e => setData({ ...data, coverLetter: e })} />
                            </div>
                        )}
                    </div>
                )}

                {activeSection === 'Review' && (
                    <div className="space-y-10 animate-fade-up">
                        <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500">ATS Review & Analysis</h3>

                        {/* Analyze Button */}
                        <div className="glass-card p-8 rounded-[2.5rem] border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-2">
                                    <span className="text-3xl">📊</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white">Analyze Your Resume</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                    Get a comprehensive ATS analysis with detailed feedback, forensic checklist, and actionable improvements for Big Tech applications.
                                </p>
                                <button
                                    onClick={handleAnalyzeDraft}
                                    disabled={isAnalyzing || quotaExceeded}
                                    className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm uppercase tracking-widest hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <span>📊</span>
                                            Analyze Draft
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Current Score Display */}
                        {atsResult && (
                            <div className="space-y-6">
                                <div className="glass-card p-6 rounded-[2.5rem] border-2 border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Latest Analysis</h4>
                                        <button
                                            onClick={() => setShowATSReview(true)}
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            View Full Report →
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center">
                                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{atsResult.score}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                                                {atsResult.rating} Resume
                                            </h5>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {atsResult.companyContextFeedback?.substring(0, 120)}...
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    {atsResult.sections && (
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(atsResult.sections).slice(0, 4).map(([key, section]) => (
                                                <div key={key} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-black uppercase text-slate-500">{section.label}</span>
                                                        <span className={`text-xs font-bold ${section.status === 'passed' ? 'text-emerald-600' :
                                                            section.status === 'warning' ? 'text-amber-600' : 'text-rose-600'
                                                            }`}>
                                                            {section.score}/{section.maxScore}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${section.status === 'passed' ? 'bg-emerald-500' :
                                                                section.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`}
                                                            style={{ width: `${(section.score / section.maxScore) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Improvements */}
                                {(atsResult.keyImprovements || atsResult.suggestions)?.length > 0 && (
                                    <div className="glass-card p-6 rounded-[2.5rem]">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-4">
                                            Top 3 Improvements
                                        </h4>
                                        <div className="space-y-2">
                                            {(atsResult.keyImprovements || atsResult.suggestions).slice(0, 3).map((improvement, idx) => (
                                                <div key={idx} className="flex gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20">
                                                    <span className="text-violet-600 dark:text-violet-400 font-black text-sm">{idx + 1}.</span>
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 flex-1">{improvement}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Instructions */}
                        {!atsResult && (
                            <div className="glass-card p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3">
                                    What You'll Get
                                </h4>
                                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        <span>Total ATS score (0-100) with rating</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        <span>Section-by-section breakdown and feedback</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        <span>Forensic checklist with Pass/Warning/Failed status</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        <span>Actionable key improvements</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-600">✓</span>
                                        <span>Big Tech optimization insights</span>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {activeSection === 'Style' && (
                    <div className="space-y-12 animate-fade-up">
                        <h3 className="text-xl font-black uppercase tracking-widest text-indigo-500">Resume Style</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTemplate(t.id)}
                                    className={`group relative p-8 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-4 text-center ${template === t.id
                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.05] shadow-premium'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="w-24 h-32 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 flex flex-col gap-2 transition-all">
                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800"></div>
                                        <div className="w-1/2 h-1 bg-indigo-100 dark:bg-indigo-900"></div>
                                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800"></div>
                                        <div className="w-full h-8 bg-slate-50 dark:bg-slate-950"></div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block font-black text-[12px] uppercase tracking-[0.2em] text-slate-900 dark:text-white">{t.label}</span>
                                        <p className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">{t.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                            <ColorPicker selectedColor={data.themeColor} onChange={c => setData(prev => ({ ...prev, themeColor: c }))} />
                        </div>
                    </div>
                )}
            </div>

            {/* ATS Review Modal */}
            {showATSReview && atsResult && (
                <ATSReviewModal
                    atsResult={atsResult}
                    onClose={() => setShowATSReview(false)}
                />
            )}

        </div>
    );
}
