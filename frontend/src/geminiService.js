import { GoogleGenerativeAI } from "@google/generative-ai";
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

// ROBUST MODEL FALLBACK SYSTEM
const FALLBACK_MODELS = [
  normalizeModelName(import.meta.env.VITE_GEMINI_MODEL) || "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-1.0-pro"
].filter(Boolean);

let currentModelIndex = 0;
const getActiveModel = () => FALLBACK_MODELS[currentModelIndex];

const API_KEY = import.meta.env.VITE_API_KEY;

// Initialize AI with API key using Stable SDK
const genAI = (() => {
  try {
    if (!API_KEY) {
      console.warn('⚠️ VITE_API_KEY not set. Resume import and ATS features will not work.');
      return null;
    }
    console.info(`Gemini AI Initialized.`);
    return new GoogleGenerativeAI(API_KEY);
  } catch (error) {
    console.warn('Failed to initialize Gemini AI:', error.message);
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
    console.warn("JSON Parsing Failed. Returning empty.");
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

// Helper function to generate content using the current active model
const generateContentSafe = async (params) => {
  // Get the model instance for the active model
  const model = genAI.getGenerativeModel({ model: getActiveModel() });

  // Generate content
  // params usually contains { contents: [...] } matching the SDK input format
  const result = await model.generateContent(params);

  // Return the response object (which has candidates, text(), etc.)
  return result.response;
};

async function callWithRetry(fn, retries = 2, delay = 1500) {
  if (!genAI) return null; // Silent fail
  try {
    return await fn();
  } catch (error) {
    const rawErrorMessage = getErrorMessage(error);
    const errorMessage = rawErrorMessage.toLowerCase();
    const errorStatus = error?.status || error?.code;

    // Silent Network Error Handling
    if (errorMessage.includes("failed to fetch")) {
      console.warn("Network: Google API blocked (AdBlocker/DNS). Switching to offline mode.");
      return null;
    }

    // Check for "Model Not Found" or "Unavailable" to trigger Fallback
    const isModelUnavailable =
      errorStatus === 404 ||
      errorStatus === "404" ||
      errorMessage.includes("not found") ||
      errorMessage.includes("unavailable for this api key");

    if (isModelUnavailable) {
      const nextIndex = currentModelIndex + 1;

      if (nextIndex < FALLBACK_MODELS.length) {
        currentModelIndex = nextIndex;
        console.warn(`Model unavailable. Switching to: '${getActiveModel()}'`);
        return callWithRetry(fn, retries, delay);
      } else {
        console.warn("All AI models unavailable. Using offline mocks.");
        return null; // Silent fallback
      }
    }

    if (isQuotaError(errorMessage, errorStatus)) {
      const dailyQuotaHit = isDailyQuotaLimit(errorMessage);
      const providerSuggestedDelay = extractRetryDelayMs(rawErrorMessage);
      const retryDelay = Math.max(delay, providerSuggestedDelay || 0);

      if (!dailyQuotaHit && retries > 0) {
        await new Promise((res) => setTimeout(res, retryDelay));
        return callWithRetry(fn, retries - 1, Math.min(retryDelay * 2, 60_000));
      }

      console.warn("Gemini API quota exceeded. Using offline mocks.");
      return null; // Silent fallback
    }

    // Generic error
    console.warn("Gemini API Error (Handled):", error.message);
    return null; // Silent fallback
  }
}

// ------------------------------------------------------------------
// 1. Resume Parsing Logic
// ------------------------------------------------------------------
export const parseResumeFromBinary = async (base64Data, mimeType) => {
  const result = await callWithRetry(async () => {
    if (!base64Data) throw new Error("No file data provided");

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
    ],
// The previous schema logic continues...
// Re-writing simplified schema definition for brevity
personalInfo: { fullName: "", email: "", phone: "", location: "", linkedin: "", portfolio: "" },
summary: "", skills: [], experience: [{ jobTitle: "", company: "", location: "", startDate: "", endDate: "", responsibilities: [] }],
  education: [{ degree: "", institution: "", startYear: "", endYear: "" }],
    projects: [{ title: "", description: "", technologies: [] }], certifications: [], languages: []
    };

const response = await generateContentSafe({
  contents: [
    {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType || "application/pdf" } },
        {
          text: `SYSTEM: You are an advanced AI Resume Parser.
              TASK: Extract structured resume data.
              RESPONSE FORMAT: JSON ONLY matching schema: ${JSON.stringify(PROMPT_SCHEMA)}`
        }
      ]
    }
  ]
});

const text = getResponseText(response);
const parsedData = parseJsonFromResponse(text);

return {
  personalInfo: {
    fullName: parsedData.personalInfo?.fullName || "",
    email: parsedData.personalInfo?.email || "",
    phone: parsedData.personalInfo?.phone || "",
    location: parsedData.personalInfo?.location || "",
    website: parsedData.personalInfo?.linkedin || parsedData.personalInfo?.portfolio || "",
    jobTitle: parsedData.experience?.[0]?.jobTitle || "",
    summary: parsedData.summary || ""
  },
  experience: (parsedData.experience || []).map(exp => ({
    company: exp.company || "",
    position: exp.jobTitle || "",
    startDate: exp.startDate || "",
    endDate: exp.endDate || "",
    description: Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n• ') : (exp.responsibilities || ""),
    current: (exp.endDate || "").toLowerCase().includes('present')
  })),
  education: (parsedData.education || []).map(edu => ({
    school: edu.institution || "",
    degree: edu.degree || "",
    startDate: edu.startYear || "",
    endDate: edu.endYear || "",
    description: ""
  })),
  projects: (parsedData.projects || []).map(proj => ({
    name: proj.title || "",
    role: "Contributor",
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
    const resumeText = `NAME: ${data.personalInfo.fullName}, EMAIL: ${data.personalInfo.email}, SKILLS: ${data.skills.join(', ')}`;

    const response = await generateContentSafe({
      contents: `You are an Expert ATS Auditor. Analyze this resume.
Resume Data: ${resumeText}

Return JSON ONLY (no markdown) with this EXACT structure:
{
  "score": number (0-100),
  "rating": string,
  "sections": { 
     "contact": { "score": 0, "maxScore": 8, "label": "Contact", "status": "passed", "feedback": "" },
     "experience": { "score": 0, "maxScore": 38, "label": "Work Experience", "status": "passed", "feedback": "" },
     "education": { "score": 0, "maxScore": 15, "label": "Education", "status": "passed", "feedback": "" },
     "skills": { "score": 0, "maxScore": 23, "label": "Skills", "status": "passed", "feedback": "" },
     "format": { "score": 0, "maxScore": 9, "label": "Format", "status": "passed", "feedback": "" },
     "summary": { "score": 0, "maxScore": 7, "label": "Summary", "status": "passed", "feedback": "" }
  },
  "keyImprovements": [],
  "companyContextFeedback": ""
}`
    });

    const text = getResponseText(response);
    return parseJsonFromResponse(text);
  });

  if (!result) return MOCK_ATS_RESULT;
  return result;
};

// ------------------------------------------------------------------
// 3. Summary & Cover Letter Gen
// ------------------------------------------------------------------
export const optimizeSummary = async (jobTitle, skills) => {
  const result = await callWithRetry(async () => {
    const response = await generateContentSafe({
      contents: `Write a professional summary for ${jobTitle} with skills ${skills.join(', ')}.`
    });
    return getResponseText(response).trim();
  });
  return result || "";
};

export const generateCoverLetter = async (resume, jobTitle, company, desc) => {
  const result = await callWithRetry(async () => {
    const response = await generateContentSafe({
      contents: `Write cover letter for ${jobTitle} at ${company}. Candidate: ${resume.personalInfo.fullName}.`
    });
    return getResponseText(response).trim();
  });
  return result || "";
};

// ------------------------------------------------------------------
// 4. Full Resume Optimization (Auto-Update)
// ------------------------------------------------------------------
export const optimizeResumeForAts = async (currentData) => {
  const result = await callWithRetry(async () => {
    const response = await generateContentSafe({
      contents: `Optimize this resume for ATS. Return JSON. Data: ${JSON.stringify(currentData)}`
    });
    const text = getResponseText(response);
    return parseJsonFromResponse(text);
  });

  if (!result) return currentData; // Fallback to original
  return result;
};
