import React, { useState } from "react";
import { Message } from "../types";
import { Copy, Check, Terminal, Cpu, User } from "lucide-react";

interface ChatMessageProps {
  key?: string | number;
  message: Message;
  modelName: string;
}

export default function ChatMessage({ message, modelName }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);

  const copyMessageText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCodeBlock = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBlockIndex(index);
    setTimeout(() => setCopiedBlockIndex(null), 2000);
  };

  const isUser = message.role === "user";

  // A robust custom formatter that handles markdown-like triple backtick code blocks and inline code
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith("```") && part.endsWith("```")) {
        // Strip backticks and extract language (if any)
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : "";
        const code = match ? match[2] : part.slice(3, -3);

        return (
          <div key={index} className="my-3 border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100 shadow-sm font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-400 border-b border-slate-700/50">
              <span className="flex items-center gap-1.5 font-sans font-medium text-[11px] uppercase tracking-wider">
                <Terminal size={12} />
                {language || "code"}
              </span>
              <button
                onClick={() => copyCodeBlock(code, index)}
                className="hover:text-white transition p-1 rounded hover:bg-slate-700"
                title="Copy code"
                id={`btn-copy-code-${index}`}
              >
                {copiedBlockIndex === index ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Handle inline code inside standard text blocks
      const textBlockParts = part.split(/(`[^`\n]+`)/g);
      return (
        <p key={index} className="whitespace-pre-wrap leading-relaxed text-sm">
          {textBlockParts.map((subPart, subIndex) => {
            if (subPart.startsWith("`") && subPart.endsWith("`")) {
              return (
                <code key={subIndex} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 font-mono text-xs border border-slate-200/50">
                  {subPart.slice(1, -1)}
                </code>
              );
            }
            return subPart;
          })}
        </p>
      );
    });
  };

  return (
    <div className={`flex gap-4 p-4 rounded-2xl transition-all ${isUser ? "flex-row-reverse" : "bg-slate-50/50"}`}>
      {/* Avatar */}
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
        isUser 
          ? "bg-slate-800 text-white border-slate-750" 
          : "bg-gradient-to-tr from-amber-50 to-amber-100 text-amber-800 border-amber-200"
      }`}>
        {isUser ? <User size={16} /> : <Cpu size={16} />}
      </div>

      {/* Message Content Area */}
      <div className="flex-1 max-w-[85%] space-y-1">
        <div className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
          <span className="text-xs font-semibold text-slate-700">
            {isUser ? "You" : modelName}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {message.timestamp}
          </span>
        </div>

        <div className={`rounded-2xl p-4 border shadow-sm ${
          isUser 
            ? "bg-slate-800 text-white border-slate-700" 
            : "bg-white text-slate-800 border-slate-150"
        }`}>
          <div className="space-y-2">
            {renderFormattedContent(message.content)}
          </div>

          {/* Quick copy bubble button */}
          <div className={`mt-2 flex ${isUser ? "justify-start" : "justify-end"}`}>
            <button
              onClick={copyMessageText}
              className={`inline-flex items-center gap-1 text-[10px] py-1 px-2 rounded-md transition ${
                isUser 
                  ? "text-slate-400 hover:text-white hover:bg-slate-700/50" 
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
              id={`btn-copy-msg-${message.id}`}
            >
              {copied ? (
                <>
                  <Check size={11} className="text-green-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={11} /> Copy message
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
