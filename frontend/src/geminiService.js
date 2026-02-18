import { GoogleGenAI, SchemaType } from "@google/genai";

// Initialize AI
const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error("Missing Gemini API Key. Please set VITE_GEMINI_API_KEY in .env");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const DEFAULT_MODEL = 'gemini-1.5-flash';

// Retry Logic
async function callWithRetry(fn, retries = 2, delay = 1500) {
  if (!ai) throw new Error("Gemini AI not initialized.");
  try {
    return await fn();
  } catch (error) {
    const msg = error?.message?.toLowerCase() || '';
    const isQuotaError = msg.includes('429') || msg.includes('quota') || error?.status === 429;

    if (retries > 0 && isQuotaError) {
      console.warn(`Quota limit hit. Waiting ${delay}ms before retry...`);
      await new Promise(res => setTimeout(res, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    console.error("AI Service Error:", error);
    throw error;
  }
}

// Schemas
const RESUME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        location: { type: Type.STRING },
        website: { type: Type.STRING },
        jobTitle: { type: Type.STRING },
        summary: { type: Type.STRING }
      }
    },
    socialLinks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          url: { type: Type.STRING }
        }
      }
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          position: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          description: { type: Type.STRING },
          current: { type: Type.BOOLEAN }
        }
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          school: { type: Type.STRING },
          degree: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      }
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          link: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['Key', 'Personal'] }
        }
      }
    },
    certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
    languages: { type: Type.ARRAY, items: { type: Type.STRING } },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

// Functions
export const optimizeSummary = async (jobTitle, skills) => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Create a professional 3-sentence summary for a ${jobTitle} role. Mention: ${skills.join(', ')}.`,
    });
    return response.text?.()?.trim() || response.response?.text?.() || "Failed to create summary.";
  });
};

export const parseResumeFromBinary = async (base64Data, mimeType) => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        { inlineData: { data: base64Data, mimeType: mimeType || "application/pdf" } },
        { text: `Extract resume data into JSON.` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESUME_SCHEMA
      }
    });

    const text = response.text ? response.text() : response.response.text();
    return JSON.parse(text);
  });
};

export const checkAtsScore = async (data) => {
  return callWithRetry(async () => {
    const prompt = `
    Analyze this resume for a "${data.personalInfo.jobTitle || 'General'}" role.
    Provide a score (0-100) and detailed feedback.
    `;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        { text: prompt },
        { text: JSON.stringify(data) }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            rating: { type: Type.STRING },
            sections: {
              type: Type.OBJECT,
              properties: {
                contact: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, maxScore: { type: Type.NUMBER }, label: { type: Type.STRING }, status: { type: Type.STRING }, feedback: { type: Type.STRING } } },
                experience: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, maxScore: { type: Type.NUMBER }, label: { type: Type.STRING }, status: { type: Type.STRING }, feedback: { type: Type.STRING } } },
                education: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, maxScore: { type: Type.NUMBER }, label: { type: Type.STRING }, status: { type: Type.STRING }, feedback: { type: Type.STRING } } },
                skills: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, maxScore: { type: Type.NUMBER }, label: { type: Type.STRING }, status: { type: Type.STRING }, feedback: { type: Type.STRING } } },
                format: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, maxScore: { type: Type.NUMBER }, label: { type: Type.STRING }, status: { type: Type.STRING }, feedback: { type: Type.STRING } } }
              }
            },
            checks: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, status: { type: Type.STRING, enum: ['passed', 'warning', 'failed'] }, feedback: { type: Type.STRING } } }
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            companyContextFeedback: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text ? response.text() : response.response.text();
    return JSON.parse(text);
  });
};

export const generateCoverLetter = async (resume, jobTitle, companyName, jobDescription) => {
  return callWithRetry(async () => {
    const prompt = `Write a cover letter for ${jobTitle} at ${companyName}. \n\nResume: ${JSON.stringify(resume)}`;
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
    });
    return response.text?.()?.trim() || "Failed to generate cover letter.";
  });
};

export const optimizeResumeForAts = async (currentData) => {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        { text: `Optimize this resume for ATS and impact.` },
        { text: JSON.stringify(currentData) }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESUME_SCHEMA // Output structured JSON
      }
    });
    const text = response.text ? response.text() : response.response.text();
    return JSON.parse(text);
  });
};
