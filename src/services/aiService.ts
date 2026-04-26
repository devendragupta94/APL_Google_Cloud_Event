import { GoogleGenAI, Type } from "@google/genai";
import { Order, DeliveryPartner } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function askCricketGuru(prompt: string, imageBase64?: string) {
  if (!process.env.GEMINI_API_KEY) {
    return "I'm currently warming up in the dugout (Offline Mode). Once connected, I can help you with all things cricket!";
  }

  try {
    const parts: any[] = [{ text: prompt }];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(",")[1] || imageBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: "You are 'CricketGuru', an expert AI cricket assistant at Zaika Stadium. You help fans understand complex cricket concepts, rules, player stats, and live match scenarios. You are encouraging, knowledgeable, and energetic. If an image is provided, analyze it for cricket context (e.g., explaining a shot, a player's form, or a stadium landmark). Keep responses concise and fan-friendly. Use emojis to stay energetic!"
      }
    });

    return response.text || "I'm stumped! Ask me another cricket question.";
  } catch (error) {
    console.error("CricketGuru Error:", error);
    return "The commentary box is having technical issues. Try again in a bit!";
  }
}

export async function orchestrateDelivery(order: Order, vendors: DeliveryPartner[]) {
  if (!process.env.GEMINI_API_KEY) {
    return { vendorId: vendors.find(v => v.status === 'idle')?.id || vendors[0].id, reasoning: "Manual assignment (Offline)." };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `
        System: You are an AI Logistics Orchestrator for a busy stadium (Zaika Stadium Agent).
        Task: Assign the best roaming delivery partner to a new food order.
        
        Order: Block ${order.block}, Seat ${order.seat}, Customer: ${order.customerName || 'Fan'} (Phone: ${order.customerPhone || 'N/A'}), Cues: ${order.landmark || 'None provided'}
        
        Available Delivery Partners:
        ${vendors.map(v => `- ID ${v.id}: ${v.name} at ${v.location} (${v.status})`).join('\n')}
        
        Return ONLY a JSON object with: { "vendorId": string, "reasoning": string }
      ` }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    // Clean potential markdown code blocks from JSON
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Assignment Error:", error);
    return { vendorId: vendors[0].id, reasoning: "Fallback assignment." };
  }
}

export async function getFoodSuggestions(orders: Order[]) {
  if (!process.env.GEMINI_API_KEY || orders.length === 0) {
    return "The Paneer Tikka Pizza from La Pino'z is a favorite today!";
  }

  const feedbackSummary = orders
    .filter(o => o.feedback)
    .map(o => `${o.items[0]?.name}: ${o.feedback?.rating}/5 - "${o.feedback?.comment}"`)
    .join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: `
        System: You are an AI Food Trend Analyzer for an IPL Stadium.
        Existing Feedback: ${feedbackSummary || "No direct feedback yet, but Paneer Tikka Pizza is popular."}
        Task: Write a 1-sentence mouth-watering suggestion for a new fan. Keep it short and energetic.
      ` }] }]
    });

    return response.text || "Try our Hyderabadi Biryani - it's the highlight of the match!";
  } catch (error) {
    return "Try our Hyderabadi Biryani - it's the highlight of the match!";
  }
}
