import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyAfjHYKSeQV26kChAP3LEe9GfkjjUnkmJE";
const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        console.log("Listing models...");
        // The @google/genai SDK listing might differ, let's try the standard approach for this SDK
        // If it's the new SDK, it should have a 'models' property
        const response = await ai.models.list();

        console.log("Available Models:");
        for await (const model of response) {
            console.log(`- ${model.name}`);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
