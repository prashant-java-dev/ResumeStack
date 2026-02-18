import { GoogleGenerativeAI } from "@google/generative-ai";
import { } from "./types";

// Empty data structure for fallback when API quota is exceeded
const MOCK_PARSED_RESUME = {
  personalInfo: {
    fullName: "John Doe (Offline)",
    email: "john.doe@example.com",
    phone: "+1 234 567 8900",
    location: "New York, NY",
    website: "linkedin.com/in/johndoe",
    jobTitle: "Software Engineer",
    summary: "Experienced software engineer with a passion for developing innovative programs that expedite the efficiency and effectiveness of organizational success. Well-versed in technology and writing code to create systems that are reliable and user-friendly."
  },
  experience: [
    {
      company: "Tech Solutions Inc.",
      position: "Senior Developer",
      startDate: "2020",
      endDate: "Present",
      description: "Led a team of developers to design and implement cloud-based solutions. Improved system performance by 40%."
    }
  ],
  education: [
    {
      school: "University of Technology",
      degree: "B.S. Computer Science",
      startDate: "2015",
      endDate: "2019",
      description: "Graduated with Honors."
    }
  ],
  projects: [],
  skills: ["JavaScript", "React", "Node.js", "Java", "Spring Boot", "AWS"],
  certifications: [],
  languages: ["English"],
  socialLinks: []
};

const MOCK_ATS_RESULT = {
  score: 72,
  rating: "GOOD",
  sections: {
    contact: { score: 8, maxScore: 10, label: "Contact", status: "passed", feedback: "Contact info is clear and complete." },
    experience: { score: 28, maxScore: 40, label: "Experience", status: "warning", feedback: "Action verbs could be stronger." },
    education: { score: 15, maxScore: 15, label: "Education", status: "passed", feedback: "Education section is well-formatted." },
    skills: { score: 15, maxScore: 25, label: "Skills", status: "warning", feedback: "Add more hard skills relevant to the role." },
    format: { score: 6, maxScore: 10, label: "Format", status: "warning", feedback: "Use consistent date formatting." }
  },
  checks: [],
  suggestions: ["Try to quantify your achievements with numbers.", "Add a link to your portfolio."],
  companyContextFeedback: "This resume is a good starting point but needs more specific metrics to stand out for big tech."
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

  // Check if params has 'contents' as string (legacy usage), simplify for Standard SDK
  let request = params;
  if (params && params.contents && typeof params.contents === 'string') {
    request = params.contents;
  }

  // Generate content
  const result = await model.generateContent(request);

  // Return the response object (which has candidates, text(), etc.)
  return result.response;
};

// CIRCUIT BREAKER LOGIC
const CIRCUIT_BREAKER_KEY = "GEMINI_API_BLOCKED_UNTIL";
const BLOCK_DURATION_MS = 1000 * 60 * 30; // 30 minutes block on persistence failure

const isApiBlocked = () => {
  try {
    const until = localStorage.getItem(CIRCUIT_BREAKER_KEY);
    if (!until) return false;
    if (Date.now() > Number(until)) {
      localStorage.removeItem(CIRCUIT_BREAKER_KEY);
      return false;
    }
    return true;
  } catch (e) { return false; }
};

const tripCircuitBreaker = () => {
  try {
    const unlockTime = Date.now() + BLOCK_DURATION_MS;
    localStorage.setItem(CIRCUIT_BREAKER_KEY, String(unlockTime));
    console.warn(`🚫 Gemini API repeatedly failed (404/Auth). Blocking requests for 30m to prevent console noise.`);
    console.warn(`Tip: Run localStorage.removeItem('${CIRCUIT_BREAKER_KEY}') to reset manually.`);
  } catch (e) { }
};

async function callWithRetry(fn, retries = 2, delay = 1500) {
  if (!genAI) return null; // Silent fail

  if (isApiBlocked()) {
    // Silent return to avoid network noise
    return null;
  }

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
        console.warn("All AI models unavailable. Using offline mocks & Enabling Circuit Breaker.");
        tripCircuitBreaker(); // <--- STOP FUTURE REQUESTS
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
      tripCircuitBreaker(); // Block for a bit if quota hit (optional, but good practice)
      return null;
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

    // Prepare detailed context
    const resumeText = `
    CONTACT: ${data.personalInfo.fullName || 'Missing'}, ${data.personalInfo.email || 'Missing'}
    SUMMARY: ${data.personalInfo.summary || 'Missing'}
    EXPERIENCE: ${JSON.stringify(data.experience.map(e => ({ title: e.position, company: e.company, desc: e.description })))}
    SKILLS: ${data.skills.join(', ') || 'None listed'}
    EDUCATION: ${JSON.stringify(data.education.map(e => ({ degree: e.degree, school: e.school })))}
    `;

    const response = await generateContentSafe({
      contents: `You are an Expert ATS Auditor specializing in Big Tech.

Analyze this resume and provide a forensic report.

Resume Data:
${resumeText}

Return JSON ONLY (no markdown) with this EXACT structure:
{
  "score": number (0-100, total ATS score),
  "rating": string ("POOR"|"AVERAGE"|"GOOD"|"EXCELLENT"),
  "sections": {
    "contact": { "score": 0, "maxScore": 8, "label": "Contact", "status": "passed", "feedback": "string" },
    "experience": { "score": 0, "maxScore": 38, "label": "Experience", "status": "passed", "feedback": "string" },
    "education": { "score": 0, "maxScore": 15, "label": "Education", "status": "passed", "feedback": "string" },
    "skills": { "score": 0, "maxScore": 23, "label": "Skills", "status": "passed", "feedback": "string" },
    "format": { "score": 0, "maxScore": 9, "label": "Format", "status": "passed", "feedback": "string" },
    "summary": { "score": 0, "maxScore": 7, "label": "Summary", "status": "passed", "feedback": "string" }
  },
  "forensicChecklist": [
    { "category": "string", "status": "Passed|Warning|Failed", "feedback": "string" }
  ],
  "keyImprovements": ["string"],
  "companyContextFeedback": "string"
}`
    });

    const text = getResponseText(response);
    // Parse result
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
      contents: `Write a professional summary (3-4 sentences) for a ${jobTitle}.
      Keywords to include: ${skills.join(', ')}.
      Tone: Professional, Results-Oriented.`
    });
    return getResponseText(response).trim();
  });
  return result || "";
};

export const generateCoverLetter = async (resume, jobTitle, company, desc) => {
  const result = await callWithRetry(async () => {
    const response = await generateContentSafe({
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
  return result || "";
};

// ------------------------------------------------------------------
// 4. Full Resume Optimization (Auto-Update)
// ------------------------------------------------------------------
export const optimizeResumeForAts = async (currentData) => {
  const result = await callWithRetry(async () => {
    const response = await generateContentSafe({
      contents: `
      Act as an Expert Resume Writer.
      
      TASK: Rewrite and optimize this resume data to maximize ATS score.
      
      CURRENT DATA:
      ${JSON.stringify(currentData)}
      
      RETURN FORMAT:
      Return ONLY valid JSON matching the exact structure of the input data.
      `
    });

    const text = getResponseText(response);
    return parseJsonFromResponse(text);
  });

  if (!result) return currentData; // Fallback to original
  return result;
};
