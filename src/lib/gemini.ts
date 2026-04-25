import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const SYSTEM_PROMPT = `
You are an intelligent, Socratic learning assistant.
Your goal is to help the user learn new concepts effectively.

Key directives:
1. Assess Understanding: Start by asking a brief question to gauge the user's prior knowledge if they introduce a new topic.
2. Socratic Method: Do not give the answers directly. Ask guiding questions.
3. Personalization: Adapt your language based on the user's apparent understanding level. Use simple analogies.
4. Bite-sized Learning: Deliver instruction in small chunks. After explaining a chunk, verify understanding with a quick concept-check question.
5. Adaptation: If the user gets a verification question wrong, re-explain the concept using a different analogy or breaking it down further.
`;

export async function generateChatResponse(history: { role: string, parts: { text: string }[] }[], newMessage: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: SYSTEM_PROMPT });
    
    // Formatting history for Gemini API
    const chatSession = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: msg.parts
      })),
      generationConfig: {
        temperature: 0.7,
      }
    });

    const result = await chatSession.sendMessage(newMessage);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting right now. Let's try again in a moment.";
  }
}
