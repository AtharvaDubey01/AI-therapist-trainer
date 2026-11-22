"use client";

import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  isSending: boolean;
  isEnded: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function ChatInput({
  input,
  isSending,
  isEnded,
  onChange,
  onSend,
}: ChatInputProps) {
  return (
    <div className="relative">
      <textarea
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        disabled={isSending || isEnded}
        placeholder={
          isEnded
            ? "Session ended"
            : "Type your message... (Press Enter to send)"
        }
        className="w-full bg-surface border border-border-subtle rounded-xl p-4 pr-14 text-body text-text-primary focus:outline-none focus:border-accent-primary resize-none disabled:opacity-50"
        rows={3}
      />
      <button
        onClick={onSend}
        disabled={!input.trim() || isSending || isEnded}
        className="absolute right-4 bottom-4 p-2 bg-accent-primary hover:bg-accent-primary-hover disabled:opacity-50 text-white rounded-lg transition-colors"
        aria-label="Send message"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
