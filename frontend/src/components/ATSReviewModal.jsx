import React from 'react';

export default function ATSReviewModal({ atsResult, onClose }) {
    if (!atsResult) return null;

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'passed') return 'text-emerald-600 dark:text-emerald-400';
        if (s === 'warning') return 'text-amber-600 dark:text-amber-400';
        if (s === 'failed') return 'text-rose-600 dark:text-rose-400';
        return 'text-slate-600';
    };

    const getStatusBadgeColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'passed') return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
        if (s === 'warning') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
        if (s === 'failed') return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300';
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    };

    const getRatingColor = (rating) => {
        const r = rating?.toUpperCase();
        if (r === 'EXCELLENT' || r === 'GREAT') return 'text-emerald-600 dark:text-emerald-400';
        if (r === 'GOOD') return 'text-blue-600 dark:text-blue-400';
        if (r === 'AVERAGE') return 'text-amber-600 dark:text-amber-400';
        return 'text-rose-600 dark:text-rose-400';
    };

    const sections = atsResult.sections || {};
    const forensicChecklist = atsResult.forensicChecklist || [];
    const keyImprovements = atsResult.keyImprovements || atsResult.suggestions || [];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center">
                                <span className={`text-3xl font-black ${getRatingColor(atsResult.rating)}`}>
                                    {atsResult.score}
                                </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full px-3 py-1 shadow-md">
                                <span className="text-[10px] font-black text-slate-500">/ 100</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">ATS Review Report</h2>
                            <p className={`text-sm font-bold ${getRatingColor(atsResult.rating)} uppercase tracking-widest`}>
                                {atsResult.rating} Resume
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 p-8 space-y-8">
                    {/* Score Breakdown */}
                    <section>
                        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">📊 Score Breakdown</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(sections).map(([key, section]) => (
                                <div key={key} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {section.label}
                                        </span>
                                        <span className={`text-lg font-black ${getStatusColor(section.status)}`}>
                                            {section.score}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                                        <div
                                            className={`h-full ${section.status === 'passed' ? 'bg-emerald-500' :
                                                    section.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                                                }`}
                                            style={{ width: `${(section.score / section.maxScore) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-slate-600 dark:text-slate-400">{section.feedback}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Forensic Checklist */}
                    {forensicChecklist.length > 0 && (
                        <section>
                            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">🔍 Forensic Checklist</h3>
                            <div className="space-y-3">
                                {forensicChecklist.map((item, idx) => (
                                    <div key={idx} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-4">
                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusBadgeColor(item.status)} whitespace-nowrap`}>
                                            {item.status}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-xs text-slate-900 dark:text-white mb-1">{item.category}</h4>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400">{item.feedback}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Key Improvements */}
                    {keyImprovements.length > 0 && (
                        <section>
                            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">💡 Key Improvements</h3>
                            <div className="space-y-2">
                                {keyImprovements.map((improvement, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                                        <span className="text-violet-600 dark:text-violet-400 font-black text-sm mt-0.5">{idx + 1}.</span>
                                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium flex-1">{improvement}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Context Feedback */}
                    {atsResult.companyContextFeedback && (
                        <section>
                            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">🎯 Big Tech Context</h3>
                            <div className="glass-card p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{atsResult.companyContextFeedback}</p>
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                    >
                        Close Review
                    </button>
                </div>
            </div>
        </div>
    );
}
