import React, { useState } from 'react';
import { Send, Bot, User, Shield, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

type Message = {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
);

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateAIResponse = async (userInput: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('insurance-ai', {
        body: {
          message: userInput,
          context: "You are an AI insurance assistant. Provide helpful, accurate, and professional responses to insurance-related queries. Include specific details when possible, but always verify information with an actual insurance agent for final decisions."
        }
      });

      if (error) throw error;
      
      if (!data?.response) {
        throw new Error('Invalid response from AI service');
      }

      return data.response;
    } catch (error: any) {
      console.error('Error calling AI API:', error);
      
      // Check if the error response contains our custom error details
      const errorDetails = error.message?.includes('{') 
        ? JSON.parse(error.message)
        : null;

      if (errorDetails?.retryable) {
        return "I apologize, but the AI service is temporarily unavailable. Please try again in a moment.";
      }

      return "I apologize, but I'm experiencing technical difficulties. Please try again later or contact support if the issue persists.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(input);
      const aiMessage: Message = {
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: Message = {
        text: "I apologize, but I'm experiencing technical difficulties. Please try again later.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8 pt-8">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">InsureAI Assistant</h1>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="h-[500px] overflow-y-auto mb-4 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Bot className="w-16 h-16 mb-4" />
                <p className="text-center">
                  Hello! I'm your AI insurance assistant.<br />
                  How can I help you today?
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 mb-4 ${
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {message.sender === 'user' ? (
                    <User className="w-8 h-8 p-1 rounded-full bg-blue-100 text-blue-600" />
                  ) : (
                    <Bot className="w-8 h-8 p-1 rounded-full bg-gray-100 text-gray-600" />
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-start gap-2 mb-4">
                <Bot className="w-8 h-8 p-1 rounded-full bg-gray-100 text-gray-600" />
                <div className="rounded-lg p-3 bg-gray-100">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your insurance question..."
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`p-3 rounded-lg transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;