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
  type: SchemaType.OBJECT,
  properties: {
    personalInfo: {
      type: SchemaType.OBJECT,
      properties: {
        fullName: { type: SchemaType.STRING },
        email: { type: SchemaType.STRING },
        phone: { type: SchemaType.STRING },
        location: { type: SchemaType.STRING },
        website: { type: SchemaType.STRING },
        jobTitle: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING }
      }
    },
    socialLinks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          platform: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING }
        }
      }
    },
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          position: { type: SchemaType.STRING },
          startDate: { type: SchemaType.STRING },
          endDate: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          current: { type: SchemaType.BOOLEAN }
        }
      }
    },
    education: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          school: { type: SchemaType.STRING },
          degree: { type: SchemaType.STRING },
          startDate: { type: SchemaType.STRING },
          endDate: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING }
        }
      }
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          link: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING, enum: ['Key', 'Personal'] }
        }
      }
    },
    certifications: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    languages: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
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
          type: SchemaType.OBJECT,
          properties: {
            score: { type: SchemaType.INTEGER },
            rating: { type: SchemaType.STRING },
            sections: {
              type: SchemaType.OBJECT,
              properties: {
                contact: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, maxScore: { type: SchemaType.NUMBER }, label: { type: SchemaType.STRING }, status: { type: SchemaType.STRING }, feedback: { type: SchemaType.STRING } } },
                experience: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, maxScore: { type: SchemaType.NUMBER }, label: { type: SchemaType.STRING }, status: { type: SchemaType.STRING }, feedback: { type: SchemaType.STRING } } },
                education: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, maxScore: { type: SchemaType.NUMBER }, label: { type: SchemaType.STRING }, status: { type: SchemaType.STRING }, feedback: { type: SchemaType.STRING } } },
                skills: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, maxScore: { type: SchemaType.NUMBER }, label: { type: SchemaType.STRING }, status: { type: SchemaType.STRING }, feedback: { type: SchemaType.STRING } } },
                format: { type: SchemaType.OBJECT, properties: { score: { type: SchemaType.NUMBER }, maxScore: { type: SchemaType.NUMBER }, label: { type: SchemaType.STRING }, status: { type: SchemaType.STRING }, feedback: { type: SchemaType.STRING } } }
              }
            },
            checks: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.OBJECT, properties: { id: { type: SchemaType.STRING }, label: { type: SchemaType.STRING }, status: { type: SchemaType.STRING, enum: ['passed', 'warning', 'failed'] }, feedback: { type: SchemaType.STRING } } }
            },
            suggestions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            companyContextFeedback: { type: SchemaType.STRING }
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
