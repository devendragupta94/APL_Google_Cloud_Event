import { NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { history, message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const responseText = await generateChatResponse(history || [], message);

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
