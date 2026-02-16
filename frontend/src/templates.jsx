// ---------- RESUME STYLE TEMPLATES ----------
// All resume templates organized in one place

export const getTemplateStyles = (template, themeColor) => {
  // Fallback to default theme color if not provided
  const color = themeColor || "#4f46e5";
  const isThemeGradient = typeof color === 'string' && color.includes("gradient");
  const primaryThemeColor = isThemeGradient ? "#4f46e5" : color;

  const templates = {
    GooglePro: {
      container: "bg-white text-black p-12 w-full min-h-[1100px] font-sans leading-normal",
      header: "mb-6 text-center border-b border-gray-100 pb-6",
      sectionTitle: "text-[11px] font-bold uppercase tracking-[0.1em] border-b border-gray-200 mb-3 pb-0.5",
      sectionTitleColor: primaryThemeColor,
      itemTitle: "text-sm font-bold text-black",
      itemSubtitle: "text-xs font-bold",
      itemSubtitleColor: primaryThemeColor,
      bodyText: "text-xs text-gray-800 leading-relaxed",
    },

    MetaModern: {
      container: "bg-white text-slate-900 p-16 w-full min-h-[1100px] font-sans",
      header: "mb-14",
      sectionTitle: "text-[10px] font-black uppercase tracking-[0.4em] mb-8",
      sectionTitleColor: "#cbd5e1",
      itemTitle: "text-xl font-black text-slate-900",
      itemSubtitle: "text-sm font-bold",
      itemSubtitleColor: primaryThemeColor,
      bodyText: "text-sm text-slate-600 leading-loose",
    },

    IBMProfessional: {
      container: "bg-white text-gray-900 p-14 w-full min-h-[1100px] font-sans",
      header: "mb-10 grid grid-cols-2 items-end border-b-2 border-gray-900 pb-6",
      sectionTitle: "text-xs font-black uppercase tracking-[0.2em] bg-gray-900 text-white px-3 py-1 mb-6 inline-block",
      sectionTitleColor: undefined,
      itemTitle: "text-base font-black text-gray-900",
      itemSubtitle: "text-xs font-black uppercase tracking-wider",
      itemSubtitleColor: "#64748b",
      bodyText: "text-xs text-gray-700 leading-relaxed font-medium",
    },

    FAANG: {
      container: "bg-white text-black p-12 w-full min-h-[1100px] font-sans",
      header: "mb-8 border-b border-black pb-4",
      sectionTitle: "text-sm font-bold uppercase tracking-widest text-black border-b border-gray-200 mb-4 pb-1",
      sectionTitleColor: primaryThemeColor,
      itemTitle: "text-base font-bold text-black",
      itemSubtitle: "text-sm font-medium text-black",
      itemSubtitleColor: "#000000",
      bodyText: "text-sm leading-relaxed text-slate-600",
    },

    Enterprise: {
      container: "bg-white text-slate-900 p-14 w-full min-h-[1100px] font-sans",
      header: "mb-10",
      sectionTitle: "text-[11px] font-black uppercase tracking-[0.3em] mb-6 border-l-4 pl-4",
      sectionTitleColor: primaryThemeColor,
      itemTitle: "text-lg font-bold text-slate-900",
      itemSubtitle: "text-sm font-bold",
      itemSubtitleColor: "#64748b",
      bodyText: "text-sm leading-relaxed text-slate-600",
    },

    Minimalist: {
      container: "bg-white text-slate-900 p-12 w-full min-h-[1100px] font-sans",
      header: "mb-12 border-l-4 pl-6 border-slate-900",
      sectionTitle: "text-xs font-black uppercase tracking-[0.3em] mb-6 text-slate-400",
      sectionTitleColor: "#94a3b8",
      itemTitle: "text-lg font-bold text-slate-900",
      itemSubtitle: "text-sm text-slate-500 font-medium",
      itemSubtitleColor: "#64748b",
      bodyText: "text-sm leading-relaxed text-slate-600",
    },

    Executive: {
      container: "bg-white text-slate-900 p-16 w-full min-h-[1100px] font-serif",
      header: "text-center mb-16 border-b pb-12",
      sectionTitle: "text-sm font-bold uppercase tracking-widest border-b-2 border-slate-900 mb-8 inline-block text-slate-900",
      sectionTitleColor: primaryThemeColor,
      itemTitle: "text-xl font-bold text-slate-900",
      itemSubtitle: "text-sm italic text-slate-600",
      itemSubtitleColor: "#475569",
      bodyText: "text-sm leading-relaxed text-slate-600",
    },

    Classic: {
      container: "bg-white text-slate-900 p-12 w-full min-h-[1100px]",
      header: "mb-10 text-center",
      sectionTitle: "text-base font-bold border-b border-slate-200 mb-6 pb-2 text-slate-900",
      sectionTitleColor: primaryThemeColor,
      itemTitle: "text-base font-bold text-slate-900",
      itemSubtitle: "text-sm font-medium",
      itemSubtitleColor: "#475569",
      bodyText: "text-sm leading-relaxed text-slate-600",
    },

    Modern: {
      container: "bg-white text-slate-900 p-12 w-full min-h-[1100px] font-sans",
      header: "mb-12 flex flex-col gap-2",
      sectionTitle: "text-[10px] font-black uppercase tracking-[0.4em] mb-6 text-slate-900",
      sectionTitleColor: "#0f172a",
      itemTitle: "text-lg font-black text-slate-900",
      itemSubtitle: "text-sm font-bold",
      itemSubtitleColor: primaryThemeColor,
      bodyText: "text-sm leading-relaxed text-slate-600",
    },

    ExecutiveStyle: {
      container: "bg-white shadow-2xl mx-auto p-12 min-h-[1056px] w-[816px] flex flex-col gap-6 text-slate-800 font-serif overflow-hidden",
      header: "text-center border-b-2 border-slate-900 pb-4",
      sectionTitle: "text-sm font-bold border-b border-slate-300 mb-2 uppercase tracking-[0.2em] font-sans",
      sectionTitleColor: primaryThemeColor,
      itemTitle: "flex justify-between font-bold text-sm",
      itemSubtitle: "italic text-[12px] mb-1 text-slate-600",
      bodyText: "text-[12px] leading-relaxed whitespace-pre-line text-slate-700 font-sans",
    },

    ModernStyle: {
      container: "bg-white shadow-2xl mx-auto min-h-[1056px] w-[816px] flex text-slate-800 font-sans overflow-hidden",
      header: "w-1/3 bg-slate-900 p-8 flex flex-col gap-8 text-white",
      sectionTitle: "text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4",
      sectionTitleColor: "#3b82f6",
      itemTitle: "font-bold text-slate-900 text-[15px]",
      itemSubtitle: "text-sm font-bold text-blue-600 mb-2",
      bodyText: "text-xs leading-relaxed text-slate-500 whitespace-pre-line",
    },

    CleanStyle: {
      container: "bg-white shadow-2xl mx-auto p-16 min-h-[1056px] w-[816px] flex flex-col gap-10 text-slate-800 font-sans overflow-hidden",
      header: "flex justify-between items-end border-b-4 border-slate-100 pb-8",
      sectionTitle: "text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-4",
      sectionTitleColor: "#cbd5e1",
      itemTitle: "font-black text-slate-900 text-lg mb-0.5",
      itemSubtitle: "text-xs font-bold text-slate-400 mb-3 tracking-widest uppercase",
      bodyText: "text-[13px] text-slate-500 leading-relaxed font-light",
    },
  };

  return templates[template] || templates.Modern;
};

// ---------- TEMPLATE METADATA ----------
export const templateMetadata = {
  GooglePro: {
    name: "Google Pro",
    description: "Clean and professional Google-style template",
    category: "Corporate"
  },
  MetaModern: {
    name: "Meta Modern",
    description: "Modern tech-focused template",
    category: "Tech"
  },
  IBMProfessional: {
    name: "IBM Professional",
    description: "Corporate professional template",
    category: "Corporate"
  },
  FAANG: {
    name: "FAANG",
    description: "Optimized for big tech companies",
    category: "Tech"
  },
  Enterprise: {
    name: "Enterprise",
    description: "Enterprise-level professional template",
    category: "Corporate"
  },
  Minimalist: {
    name: "Minimalist",
    description: "Clean and simple design",
    category: "Minimal"
  },
  Executive: {
    name: "Executive",
    description: "Elegant executive template",
    category: "Executive"
  },
  Classic: {
    name: "Classic",
    description: "Timeless classic design",
    category: "Classic"
  },
  Modern: {
    name: "Modern",
    description: "Contemporary modern template",
    category: "Modern"
  },
  ExecutiveStyle: {
    name: "Executive Elite",
    description: "Professional executive template with serif typography",
    category: "Executive"
  },
  ModernStyle: {
    name: "Modern Dual",
    description: "Two-column modern template with dark sidebar",
    category: "Modern"
  },
  CleanStyle: {
    name: "Clean Pro",
    description: "Minimalist clean professional template",
    category: "Minimal"
  },
};

// ---------- TEMPLATE UTILITIES ----------
export const getTemplatesByCategory = (category) => {
  return Object.entries(templateMetadata)
    .filter(([_, meta]) => meta.category === category)
    .map(([key, _]) => key);
};

export const getAllTemplates = () => {
  return Object.keys(templateMetadata);
};

export const getTemplateDescription = (templateName) => {
  return templateMetadata[templateName]?.description || "Resume template";
};
