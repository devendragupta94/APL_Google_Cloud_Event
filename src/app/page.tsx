"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "model";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Hello! I am your AI learning assistant. What topic would you like to explore today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to UI
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Format history for Gemini API
      const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, message: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await response.json();
      
      setMessages((prev) => [...prev, { role: "model", content: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "model", content: "I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="container">
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Personalized Learning Assistant
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Adaptive Socratic Tutor powered by Gemini</p>
      </div>

      <div className="chat-container glass">
        <div className="messages-area">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="typing-indicator">
              Assistant is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your answer or ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button 
            className="send-button" 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
