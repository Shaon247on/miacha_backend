import { GoogleGenAI } from '@google/genai';

// ✅ Create the client with your API key
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export default ai;