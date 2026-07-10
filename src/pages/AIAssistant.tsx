import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { Bot, Sparkles, Send, RefreshCw, HelpCircle, AlertCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const { token, user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "bot",
      text: `Hello ${user?.fullName}! I am your TeamSync AI Assistant. \n\nI can analyze your projects, summarize work logs, identify active blockers, and calculate metrics. \n\nWhat can I help you analyze today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const promptPresets = [
    {
      title: "Summarize work",
      prompt: "Summarize the team's work this week. Break it down by project and highlight the major achievements.",
    },
    {
      title: "Identify blockers",
      prompt: "Which project has the most blockers right now, and what details are available about these obstacles?",
    },
    {
      title: "Track John Doe",
      prompt: "What did John Doe work on last week according to his logged reports?",
    },
    {
      title: "Timesheet Audit",
      prompt: "Perform a quick audit of hours worked. Who worked the most hours and which projects consumed the most effort?",
    },
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !token) return;
    setError(null);

    // Append user message
    const userMsg: ChatMessage = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Format simple history for backend
      const simpleHistory = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: textToSend,
          history: simpleHistory,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to contact AI assistant");
      }

      const botMsg: ChatMessage = {
        id: `msg-${Math.random().toString(36).substr(2, 9)}`,
        sender: "bot",
        text: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI analytics");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (prompt: string) => {
    if (loading) return;
    handleSendMessage(prompt);
  };

  const clearChatHistory = () => {
    if (window.confirm("Are you sure you want to reset the assistant room history?")) {
      setMessages([
        {
          id: "init",
          sender: "bot",
          text: `Hello ${user?.fullName}! I am your TeamSync AI Assistant, powered by Gemini. \n\nWhat can I help you analyze today?`,
          timestamp: new Date(),
        },
      ]);
      setError(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Title Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white shadow-md flex items-center justify-center shrink-0">
            <Bot className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Team AI Assistant</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
                Gemini
              </span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Interact with Gemini 3.5 Flash to generate executive summaries, audits, or track developer blockers.
            </p>
          </div>
        </div>
        <button
          onClick={clearChatHistory}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-1.5 border border-slate-100 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          Reset Chat
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-700 shrink-0">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Chat Room Workspace */}
      <div className="flex-grow flex flex-col bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden min-h-0">
        
        {/* Messages feed */}
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                msg.sender === "user" 
                  ? "bg-slate-800 text-white" 
                  : "bg-gradient-to-tr from-primary-500 to-indigo-500 text-white shadow-sm shadow-primary-500/10"
              }`}>
                {msg.sender === "user" ? user?.fullName.charAt(0).toUpperCase() : <Bot className="h-4 w-4" />}
              </div>
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm whitespace-pre-line border ${
                  msg.sender === "user"
                    ? "bg-slate-800 text-white border-slate-700 rounded-tr-none"
                    : "bg-slate-50 text-slate-800 border-slate-100 rounded-tl-none"
                }`}>
                  {msg.text}
                </div>
                <span className="block text-[9px] text-slate-400 font-mono text-right px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing state */}
          {loading && (
            <div className="flex items-start gap-3.5 max-w-[85%] mr-auto">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary-500 to-indigo-500 text-white shadow-sm flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: "0ms" }}></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: "150ms" }}></div>
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            Suggested Analytical Prompts
          </p>
          <div className="flex flex-wrap gap-2">
            {promptPresets.map((preset, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => handlePresetClick(preset.prompt)}
                className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors cursor-pointer text-left shrink-0"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Form */}
        <div className="border-t border-slate-100 p-4 shrink-0 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              disabled={loading}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me a question (e.g. 'What did John work on last week?')..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 hover:opacity-95 text-white shadow-md shadow-primary-500/15 transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
