import { GoogleGenAI, Type } from "@google/genai";
import { } from "./types";


// Empty data structure for fallback when API quota is exceeded
const MOCK_PARSED_RESUME = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    jobTitle: "",
    summary: ""
  },
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
  languages: [],
  socialLinks: []
};

const MOCK_ATS_RESULT = {
  score: 0,
  rating: "N/A",
  sections: {
    contact: { score: 0, maxScore: 10, label: "Contact", status: "failed", feedback: "Unable to analyze" },
    experience: { score: 0, maxScore: 40, label: "Experience", status: "failed", feedback: "Unable to analyze" },
    education: { score: 0, maxScore: 15, label: "Education", status: "failed", feedback: "Unable to analyze" },
    skills: { score: 0, maxScore: 25, label: "Skills", status: "failed", feedback: "Unable to analyze" },
    format: { score: 0, maxScore: 10, label: "Format", status: "failed", feedback: "Unable to analyze" }
  },
  checks: [],
  suggestions: ["API Quota Exceeded. Please try again later."],
  companyContextFeedback: "Analysis unavailable."
};

// API Configuration
const normalizeModelName = (modelName) => {
  if (!modelName || typeof modelName !== "string") return "";
  return modelName.trim().replace(/^models\//, "");
};

const DEFAULT_MODEL = normalizeModelName(import.meta.env.VITE_GEMINI_MODEL) || "gemini-1.5-flash";
const API_KEY = import.meta.env.VITE_API_KEY;

// Initialize AI with API key
const ai = (() => {
  try {
    if (!API_KEY) {
      console.warn('⚠️ VITE_API_KEY not set. Resume import and ATS features will not work.');
      return null;
    }
    console.info(`Gemini model configured: ${DEFAULT_MODEL}`);
    return new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
    return null;
  }
})();

// Helper to extract text from response regardless of SDK version
const getResponseText = (response) => {
  if (!response) return '';
  if (typeof response.text === 'function') {
    return response.text();
  }
  if (typeof response.text === 'string') {
    return response.text;
  }
  if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
    return response.candidates[0].content.parts[0].text;
  }
  return '';
};

// Helper to parse JSON from Markdown code blocks
const parseJsonFromResponse = (text) => {
  let jsonStr = text.trim();

  // Remove markdown code blocks if present
  if (jsonStr.includes('```json')) {
    jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
  } else if (jsonStr.includes('```')) {
    jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
  }

  // Try to find JSON object if there's extra text
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error("JSON Parsing Failed. Raw text:", text);
    throw new Error("Failed to parse valid JSON from AI response");
  }
};

const getErrorMessage = (error) => String(error?.message || '');

const isQuotaError = (errorMessage, errorStatus) => {
  const msg = (errorMessage || '').toLowerCase();
  return (
    errorStatus === 429 ||
    errorStatus === '429' ||
    (msg.includes('quota') && msg.includes('exceeded')) ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted')
  );
};

const isDailyQuotaLimit = (errorMessage) => {
  const msg = (errorMessage || '').toLowerCase();
  return (
    msg.includes('generaterequestsperday') ||
    msg.includes('perdayperproject') ||
    msg.includes('per day')
  );
};

const extractRetryDelayMs = (errorMessage) => {
  const msg = getErrorMessage({ message: errorMessage });
  const secMatch = msg.match(/retry in\s+([\d.]+)s/i);
  if (secMatch?.[1]) {
    return Math.ceil(Number(secMatch[1]) * 1000);
  }
  return 0;
};

async function callWithRetry(fn, retries = 2, delay = 1500) {
  if (!ai) throw new Error('Gemini AI not initialized.');
  try {
    return await fn();
  } catch (error) {
    const rawErrorMessage = getErrorMessage(error);
    const errorMessage = rawErrorMessage.toLowerCase();
    const errorStatus = error?.status || error?.code;

    if (isQuotaError(errorMessage, errorStatus)) {
      const dailyQuotaHit = isDailyQuotaLimit(errorMessage);
      const providerSuggestedDelay = extractRetryDelayMs(rawErrorMessage);
      const retryDelay = Math.max(delay, providerSuggestedDelay || 0);

      if (!dailyQuotaHit && retries > 0) {
        console.warn(`Gemini API rate limit hit. Retrying in ${Math.ceil(retryDelay / 1000)}s... (${retries} left)`);
        await new Promise((res) => setTimeout(res, retryDelay));
        return callWithRetry(fn, retries - 1, Math.min(retryDelay * 2, 60_000));
      }

      console.warn("Gemini API quota limit reached.");
      throw Object.assign(
        new Error(
          dailyQuotaHit
            ? "API daily quota exceeded for this model. Please wait for daily reset or upgrade your Gemini plan."
            : "API quota exceeded. Please try again later."
        ),
        { name: "GeminiQuotaError", code: 429, isQuotaError: true }
      );
    }

    const isModelNotFound =
      errorStatus === 404 ||
      errorStatus === "404" ||
      (errorMessage.includes("not found") && errorMessage.includes("model"));

    if (isModelNotFound) {
      throw new Error(
        `Gemini model "${DEFAULT_MODEL}" is unavailable for this API key. Set VITE_GEMINI_MODEL to a supported model (example: gemini-2.5-flash) and restart the dev server.`
      );
    }

    console.error("API Call Failed:", error);
    console.error("Error details:", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      name: error?.name
    });

    // For non-quota errors, provide more helpful message
    console.error("Non-quota error occurred:", error);
    throw error;
  }
}

// ------------------------------------------------------------------
// 1. Resume Parsing Logic
// ------------------------------------------------------------------
export const parseResumeFromBinary = async (base64Data, mimeType) => {
  const result = await callWithRetry(async () => {
    if (!base64Data) throw new Error("No file data provided");

    console.log("Starting resume parse with Gemini API...");

    // User requested structure (internal prompt schema)
    const PROMPT_SCHEMA = {
      personalInfo: {
        fullName: "", email: "", phone: "", location: "", linkedin: "", portfolio: ""
      },
      summary: "",
      skills: [],
      experience: [
        { jobTitle: "", company: "", location: "", startDate: "", endDate: "", responsibilities: [] }
      ],
      education: [
        { degree: "", institution: "", startYear: "", endYear: "" }
      ],
      projects: [
        { title: "", description: "", technologies: [] }
      ],
      certifications: [],
      languages: []
    };

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType || "application/pdf" } },
            {
              text: `SYSTEM: You are an advanced AI Resume Parser.
              
              TASK: Extract structured resume data from the attached document.
              
              RULES:
              1. **Critically Important**: Extract the candidate's Name, Email, Phone, and LinkedIn URL accurately from the header.
              2. **Experience**: Extract each role separately. If a role has multiple projects/bullets, group them under 'responsibilities'. 
              3. **Dates**: Normalize all dates to "Month Year" format (e.g., "Jan 2023"). Use "Present" for current roles.
              4. **Projects**: Extract project title, description, and technologies used.
              5. **Skills**: List all technical skills, tools, and languages.
              
              RESPONSE FORMAT:
              Return ONLY a valid JSON object matching this schema. Do not include markdown formatting like \`\`\`json.
              ${JSON.stringify(PROMPT_SCHEMA, null, 2)}`
            }
          ]
        }
      ]
    });

    const text = getResponseText(response);
    const parsedData = parseJsonFromResponse(text);
    console.log("Resume parsed successfully.");

    // MAP TO APP SCHEMA (The React App expects specific field names)
    return {
      personalInfo: {
        fullName: parsedData.personalInfo?.fullName || "",
        email: parsedData.personalInfo?.email || "",
        phone: parsedData.personalInfo?.phone || "",
        location: parsedData.personalInfo?.location || "",
        website: parsedData.personalInfo?.linkedin || parsedData.personalInfo?.portfolio || "", // Map linkedin/portfolio
        jobTitle: parsedData.experience?.[0]?.jobTitle || "", // Infer if missing
        summary: parsedData.summary || ""
      },
      experience: (parsedData.experience || []).map(exp => ({
        company: exp.company || "",
        position: exp.jobTitle || "", // Mapping jobTitle -> position
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        description: Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n• ') : (exp.responsibilities || ""),
        current: (exp.endDate || "").toLowerCase().includes('present')
      })),
      education: (parsedData.education || []).map(edu => ({
        school: edu.institution || "", // Mapping institution -> school
        degree: edu.degree || "",
        startDate: edu.startYear || "",
        endDate: edu.endYear || "",
        description: "" // App expects this
      })),
      projects: (parsedData.projects || []).map(proj => ({
        name: proj.title || "", // Mapping title -> name
        role: "Contributor", // Default
        link: "",
        description: `${proj.description || ""} \nTech: ${(proj.technologies || []).join(', ')}`,
        type: "Key"
      })),
      skills: parsedData.skills || [],
      certifications: parsedData.certifications || [],
      languages: parsedData.languages || [],
      socialLinks: [
        ...(parsedData.personalInfo?.linkedin ? [{ platform: 'LinkedIn', url: parsedData.personalInfo.linkedin }] : []),
        ...(parsedData.personalInfo?.portfolio ? [{ platform: 'Portfolio', url: parsedData.personalInfo.portfolio }] : [])
      ]
    };
  });

  if (!result) return MOCK_PARSED_RESUME;
  return result;
};

// ------------------------------------------------------------------
// 2. ATS Analysis Logic
// ------------------------------------------------------------------
export const checkAtsScore = async (data) => {
  const result = await callWithRetry(async () => {
    console.log("Starting comprehensive ATS analysis...");

    // Prepare detailed context
    const resumeText = `
    CONTACT: 
    Name: ${data.personalInfo.fullName || 'Missing'}
    Email: ${data.personalInfo.email || 'Missing'}
    Phone: ${data.personalInfo.phone || 'Missing'}
    Location: ${data.personalInfo.location || 'Missing'}
    Job Title: ${data.personalInfo.jobTitle || 'Missing'}
    LinkedIn/Social: ${data.socialLinks?.map(s => s.platform).join(', ') || 'Missing'}
    
    SUMMARY: ${data.personalInfo.summary || 'Missing'}
    
    EXPERIENCE: ${JSON.stringify(data.experience.map(e => ({
      title: e.position,
      company: e.company,
      dates: `${e.startDate} - ${e.endDate}`,
      desc: e.description
    })))}
    
    SKILLS: ${data.skills.join(', ') || 'None listed'}
    
    EDUCATION: ${JSON.stringify(data.education.map(e => ({
      degree: e.degree,
      school: e.school,
      dates: `${e.startDate} - ${e.endDate}`
    })))}
    
    PROJECTS: ${data.projects?.length || 0} projects listed
    CERTIFICATIONS: ${data.certifications?.length || 0} certifications
    `;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `You are an Expert ATS (Applicant Tracking System) Auditor specializing in Big Tech (Google, Meta, Amazon, Microsoft) resume optimization.

Analyze this resume comprehensively and provide a detailed forensic report.

Resume Data:
${resumeText}

Return JSON ONLY (no markdown) with this EXACT structure:
{
  "score": number (0-100, total ATS score),
  "rating": string ("POOR"|"AVERAGE"|"GOOD"|"EXCELLENT"),
  "sections": {
    "contact": { 
      "score": number (0-8), 
      "maxScore": 8, 
      "label": "Contact Information", 
      "status": "passed"|"warning"|"failed", 
      "feedback": string (one sentence explaining what's good or needs improvement)
    },
    "experience": { 
      "score": number (0-38), 
      "maxScore": 38, 
      "label": "Work Experience", 
      "status": "passed"|"warning"|"failed", 
      "feedback": string 
    },
    "education": { 
      "score": number (0-15), 
      "maxScore": 15, 
      "label": "Education", 
      "status": "passed"|"warning"|"failed", 
      "feedback": string 
    },
    "skills": { 
      "score": number (0-23), 
      "maxScore": 23, 
      "label": "Skills", 
      "status": "passed"|"warning"|"failed", 
      "feedback": string 
    },
    "format": { 
      "score": number (0-9), 
      "maxScore": 9, 
      "label": "Format & Readability", 
      "status": "passed"|"warning"|"failed", 
      "feedback": string 
    },
    "summary": {
      "score": number (0-7),
      "maxScore": 7,
      "label": "Professional Summary",
      "status": "passed"|"warning"|"failed",
      "feedback": string
    }
  },
  "forensicChecklist": [
    {
      "category": string ("Contact Information"|"Work Experience"|"Skill Relevance"|"Education Profile"|"Format Quality"|"Summary Impact"),
      "status": "Passed"|"Warning"|"Failed",
      "feedback": string (concise one-line assessment)
    }
  ],
  "keyImprovements": [
    string (actionable suggestions like "Add a LinkedIn profile URL to increase professional credibility")
  ],
  "companyContextFeedback": string (2-3 sentences on how this resume fits Big Tech standards)
}

IMPORTANT: 
- Be strict but fair
- Mark as "Passed" if section meets Big Tech standards
- Mark as "Warning" if acceptable but could be improved
- Mark as "Failed" if critical issues exist
- Provide at least 3-5 keyImprovements
- Provide 5-7 forensicChecklist items covering all major sections`
    });

    const text = getResponseText(response);
    const result = parseJsonFromResponse(text);
    console.log("Comprehensive ATS Analysis complete.");

    return result;
  });

  if (!result) return MOCK_ATS_RESULT;
  return result;
};

// ------------------------------------------------------------------
// 3. Summary & Cover Letter Gen
// ------------------------------------------------------------------
export const optimizeSummary = async (jobTitle, skills) => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Write a powerful professional summary (3-4 sentences) for a ${jobTitle}.
      Keywords to include: ${skills.join(', ')}.
      Tone: Professional, Results-Oriented.`
    });
    return getResponseText(response).trim();
  });
};

export const generateCoverLetter = async (resume, jobTitle, company, desc) => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Write a tailored cover letter for:
      Role: ${jobTitle} at ${company}
      Job Desc: ${desc}
      
      Using this Candidate Profile:
      Name: ${resume.personalInfo.fullName}
      Skills: ${resume.skills.join(', ')}
      Experience: ${JSON.stringify(resume.experience.slice(0, 2))}
      
      Output: Plain text cover letter body only.`
    });
    return getResponseText(response).trim();
  });
};

// ------------------------------------------------------------------
// 4. Full Resume Optimization (Auto-Update)
// ------------------------------------------------------------------
export const optimizeResumeForAts = async (currentData) => {
  return callWithRetry(async () => {
    console.log("Starting ATS Auto-Optimization...");

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `
      Act as an Expert Resume Writer for Top Tech Companies (Google, Meta, Amazon).
      
      TASK: Rewrite and optimize this resume data to maximize ATS score and impact.
      
      INSTRUCTIONS:
      1. Summary: Make it punchy, results-oriented, and keyword-rich.
      2. Experience: Rewrite bullet points to follow the "Google XYZ Formula" (Accomplished [X] as measured by [Y], by doing [Z]). Use strong action verbs.
      3. Skills: Consolidate and categorize if possible, ensure top industry keywords are present based on the job title.
      4. Keep personal info (Name, Email, Phone, Location, Links) EXACTLY as is.
      
      CURRENT DATA:
      ${JSON.stringify(currentData)}
      
      RETURN FORMAT:
      Return ONLY valid JSON matching the exact structure of the input data.
      Do not add markdown formatting.
      `
    });

    const text = getResponseText(response);
    const optimizedData = parseJsonFromResponse(text);
    console.log("Resume optimized successfully.");
    return optimizedData;
  });
};
