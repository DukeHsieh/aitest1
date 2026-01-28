import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

// Safely retrieve the API key to avoid "process is not defined" errors in browser environments
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Environment process not defined");
  }
  return undefined;
};

const apiKey = getApiKey();
// Initialize with a fallback to allow app to load even if key is missing (validation happens on call)
const genAI = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

const SYSTEM_INSTRUCTION = `
You are an expert AI consultant creating a high-quality quiz for company executives and management. 
Create a set of multiple-choice questions specifically focusing on the following three categories:

1. **AI Terminology (AI 專有名詞)**: 
   - Deeply test understanding of key terms like LLM, RAG, Fine-tuning, Token, Temperature, Zero-shot prompting, Hallucination, Multimodal, Agent, etc.
   - Explain what they mean in a business or practical context.

2. **AI Tool Usage (AI 工具用途)**:
   - Practical application of specific tools. 
   - Examples: When to use Midjourney vs. Stable Diffusion? What is the specific strength of Claude 3.5 Sonnet vs. GPT-4o? What is GitHub Copilot best for? How to use Gemini for data analysis?
   - Focus on distinct features and best use cases for productivity.

3. **AI Industry Information & Trends (AI 產業資訊)**:
   - Major industry moves (e.g., Microsoft/OpenAI partnership, Google's DeepMind updates, Anthropic).
   - Enterprise adoption trends, regulatory landscape (EU AI Act basics), and major tech company strategies.
   - Recent significant AI news from late 2024 to present.

**Requirements:**
- The target audience is **Management Executives**. The questions should be practical but strictly check their knowledge.
- **Strictly output in Traditional Chinese (Taiwan/zh-TW).**
- Ensure the "correctAnswerIndex" is 0-based.
- Ensure there are exactly 4 options per question.
`;

export const generateQuizQuestions = async (count: number = 20): Promise<Question[]> => {
  if (!apiKey) {
    throw new Error("API Key 未設定。請在部署平台 (Vercel) 設定環境變數 API_KEY。");
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} difficult and practical AI knowledge questions for managers in Traditional Chinese (Taiwan). Focus strictly on Terminology, Tool Usage, and Industry Info.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              text: { type: Type.STRING, description: "The question text in Traditional Chinese" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of 4 possible answers in Traditional Chinese"
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" },
              explanation: { type: Type.STRING, description: "Brief explanation of why the answer is correct in Traditional Chinese" }
            },
            required: ["id", "text", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Ensure we re-index IDs just in case
      return data.map((q: any, index: number) => ({
        ...q,
        id: index + 1
      }));
    }
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};