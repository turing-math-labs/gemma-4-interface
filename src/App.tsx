import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Trash2, Sparkles, Cpu, AlertCircle, CheckCircle, 
  Settings, HelpCircle, RefreshCw, Sliders, MessageSquare, 
  Key, BookOpen, Feather, Lightbulb, Code, Info, ArrowRight, ExternalLink
} from "lucide-react";
import { Message, ChatConfig, BackendStatus } from "./types";
import { MODEL_PRESETS, SUGGESTED_PROMPTS } from "./constants";
import ChatMessage from "./components/ChatMessage";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm Gemma, a lightweight, highly-optimized open-source language model developed by Google. 

How can I help you today? You can ask me general questions, let me write code, or brainstorm ideas!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<{ message: string; details?: string; status?: number } | null>(null);
  
  // App configurations
  const [config, setConfig] = useState<ChatConfig>({
    model: "gemma-4-E2B",
    temperature: 0.7,
    maxTokens: 1024,
    useEmulator: false
  });

  const [showConfig, setShowConfig] = useState(true);
  const [customModelId, setCustomModelId] = useState("");
  const [isCustomModel, setIsCustomModel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch status from backend on mount
  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data: BackendStatus = await res.json();
        setStatus(data);
        
        // If Hugging Face token is missing, automatically toggle Emulator mode to ensure immediate functionality!
        if (!data.hasHfToken) {
          setConfig(prev => ({ ...prev, useEmulator: true }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle preset clicks
  const handleSelectPreset = (presetId: string) => {
    if (presetId === "custom") {
      setIsCustomModel(true);
      setConfig(prev => ({ ...prev, model: customModelId || "gemma-4-E2B" }));
    } else {
      setIsCustomModel(false);
      setConfig(prev => ({ ...prev, model: presetId }));
    }
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomModelId(val);
    if (isCustomModel) {
      setConfig(prev => ({ ...prev, model: val }));
    }
  };

  // Icon selector for suggestion cards
  const getPromptIcon = (iconName: string) => {
    switch (iconName) {
      case "code": return <Code size={16} className="text-blue-500" />;
      case "feather": return <Feather size={16} className="text-emerald-500" />;
      case "lightbulb": return <Lightbulb size={16} className="text-amber-500" />;
      case "book-open": return <BookOpen size={16} className="text-indigo-500" />;
      default: return <Sparkles size={16} className="text-purple-500" />;
    }
  };

  // Submit message
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = textToSend || inputText;
    if (!messageContent.trim() || loading) return;

    setError(null);
    if (!textToSend) setInputText("");

    const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      content: messageContent,
      timestamp: timestampStr
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          useEmulator: config.useEmulator,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errData.message || `Backend returned status ${response.status}`,
          details: errData.details || ""
        };
      }

      const resData = await response.json();
      const botMsgId = `bot-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          role: "assistant",
          content: resData.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err: any) {
      console.error("Chat sending error:", err);
      setError({
        message: err.message || "An unexpected error occurred.",
        details: err.details || "",
        status: err.status
      });
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Chat cleared. Hi, I'm Gemma! How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeModelDisplay = config.useEmulator 
    ? "Gemma-Emulator (Gemini 2.5 Flash)" 
    : (MODEL_PRESETS.find(p => p.id === config.model)?.name || config.model);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800" id="main-container">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-50 shadow-sm" id="header-nav">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 text-white p-2.5 rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-center">
              <Cpu size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Gemma Chat Interface</h1>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded border border-slate-200">HF v1</span>
              </div>
              <p className="text-xs text-slate-500">Connect to open-source models natively or via emulation</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Connection Status Badge */}
            {statusLoading ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                <RefreshCw size={12} className="animate-spin" />
                Checking backend...
              </div>
            ) : status ? (
              <div className="flex items-center gap-3">
                {status.hasHfToken ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200/50 font-medium">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    HuggingFace API Active
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/50 font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    HF_TOKEN Missing (Emulator Mode)
                  </div>
                )}
                
                <button 
                  onClick={fetchStatus} 
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition"
                  title="Refresh backend status"
                  id="btn-refresh-status"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            ) : null}

          </div>
        </div>
      </header>

      {/* Main Panel Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col overflow-hidden">
        
        {/* Chat Container */}
        <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[500px]" id="chat-panel">
          
          {/* Active Model Indicator Header */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-slate-700">Chatting with:</span>
              <span className="text-xs font-mono bg-slate-250 px-2 py-0.5 rounded text-slate-800 font-bold max-w-[200px] sm:max-w-none truncate" title={config.model}>
                {config.model}
              </span>
            </div>
            
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50/50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition font-medium"
              title="Clear current chat"
              id="btn-clear-chat"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>

          {/* Chat Messages Scrolling Window */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 bg-slate-50/30">
            {/* Show Emulator fallback banner if active */}
            {config.useEmulator && (
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 text-xs text-amber-800 flex gap-2.5 shadow-sm max-w-4xl mx-auto">
                <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-900">Running in Gemini-powered Emulator Mode</p>
                  <p className="leading-relaxed">
                    Hugging Face API credentials (<code>HF_TOKEN</code>) are currently missing or disabled. To connect directly to the real model endpoints, paste your Hugging Face Access Token inside the <strong>Secrets panel</strong> on the left, then refresh the status.
                  </p>
                </div>
              </div>
            )}

            {/* Render Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 space-y-2 max-w-4xl mx-auto shadow-sm animate-shake">
                <div className="flex gap-2.5 items-start">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <div className="space-y-1">
                    <p className="font-bold text-red-900">Hugging Face Request Failed (Code {error.status || "Error"})</p>
                    <p className="leading-relaxed">{error.message}</p>
                    {error.details && (
                      <pre className="mt-2 p-2.5 bg-red-100/50 rounded-lg font-mono text-[10px] overflow-x-auto text-red-900/80 max-h-[150px]">
                        {error.details}
                      </pre>
                    )}
                  </div>
                </div>
                
                {/* Smart assistance based on error codes */}
                {error.status === 403 && (
                  <div className="pl-6 pt-1 text-[11px] text-red-700/90 leading-relaxed space-y-1">
                    <p><strong>💡 What this means:</strong> This is likely a <strong>Gated Model</strong> error. You must agree to the terms on HuggingFace first.</p>
                    <p>1. Open <a href={`https://huggingface.co/${config.model}`} target="_blank" rel="noreferrer" className="underline font-semibold hover:text-red-900">huggingface.co/{config.model} <ExternalLink size={9} className="inline"/></a></p>
                    <p>2. Agree to terms & ensure your API token has read permissions.</p>
                  </div>
                )}
                {error.status === 401 && (
                  <div className="pl-6 pt-1 text-[11px] text-red-700/90 leading-relaxed">
                    <p><strong>💡 What this means:</strong> Your <code>HF_TOKEN</code> was rejected or is invalid. Double check the secret inside the Secrets Panel.</p>
                  </div>
                )}
                {error.status === 503 && (
                  <div className="pl-6 pt-1 text-[11px] text-red-700/90 leading-relaxed">
                    <p><strong>💡 What this means:</strong> The model is currently loading or cold-starting on HuggingFace servers. Please wait a moment and click send again.</p>
                  </div>
                )}
              </div>
            )}

            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} modelName={activeModelDisplay} />
              ))}

              {/* Loader typing indicator */}
              {loading && (
                <div className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 max-w-[85%]">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shrink-0 border border-amber-300 shadow-sm">
                    <Cpu size={16} className="animate-spin" />
                  </div>
                  <div className="space-y-2 py-1">
                    <span className="text-xs font-semibold text-slate-600">Gemma is writing...</span>
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Prompts Banner (only visible when chat has only the welcome message) */}
          {messages.length === 1 && !loading && (
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-150 shrink-0">
              <div className="max-w-4xl mx-auto">
                <p className="text-xs font-semibold text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-500" />
                  Start with a preset query:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.prompt)}
                      className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 hover:bg-slate-50/50 text-left transition shadow-sm group"
                      id={`btn-preset-prompt-${idx}`}
                    >
                      <div className="mt-0.5 p-1.5 bg-slate-50 rounded-lg group-hover:bg-white transition border border-slate-100">
                        {getPromptIcon(prompt.icon)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{prompt.title}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[260px] md:max-w-[320px]">{prompt.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message Input Bar */}
          <div className="p-4 md:p-5 border-t border-slate-150 bg-white shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative border border-slate-200 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400/20 rounded-2xl bg-slate-50/30 overflow-hidden transition-all shadow-sm">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Send a message to ${config.model}...`}
                  rows={2}
                  className="w-full pl-4 pr-16 pt-3 pb-3 outline-none resize-none text-sm bg-transparent text-slate-800 placeholder-slate-400"
                  id="textarea-input"
                />
                
                <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || loading}
                    className={`p-2 rounded-xl transition flex items-center justify-center ${
                      inputText.trim() && !loading
                        ? "bg-slate-800 text-white hover:bg-slate-750 shadow-md shadow-slate-800/10"
                        : "bg-slate-100 text-slate-300 cursor-not-allowed"
                    }`}
                    title="Send message"
                    id="btn-send-msg"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Press Enter to send, Shift+Enter for new line. Gemma may generate incorrect or unverified content.
              </p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
