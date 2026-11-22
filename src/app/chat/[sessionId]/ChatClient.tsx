"use client";

import { useState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { TranscriptEntry, HintLogEntry } from "@/types";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessageItem } from "@/components/chat/ChatMessageItem";
import { ChatInput } from "@/components/chat/ChatInput";

interface ChatClientProps {
  initialSession: {
    id: string;
    endedAt: string | null;
  };
  initialTranscript: TranscriptEntry[];
  initialHintLog: HintLogEntry[];
  persona: {
    name: string;
    difficulty: string;
    languagePref: string;
  };
}

export default function ChatClient({
  initialSession,
  initialTranscript,
  initialHintLog,
  persona,
}: ChatClientProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(initialTranscript);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEnded, setIsEnded] = useState(initialSession.endedAt !== null);
  const [error, setError] = useState<string | null>(null);

  // Hint State
  const [hintLog, setHintLog] = useState<HintLogEntry[]>(initialHintLog);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcript]);

  const handleSend = async () => {
    if (!input.trim() || isSending || isEnded) return;

    const messageText = input.trim();
    setInput("");
    setError(null);
    setIsSending(true);

    // Optimistic UI
    const tempMessage: TranscriptEntry = {
      role: "coach",
      text: messageText,
      timestamp: new Date().toISOString(),
    };
    setTranscript((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: initialSession.id, text: messageText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setTranscript((prev) => [...prev, data.message]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred.";
      setError(errorMessage);
      // Rollback optimistic update
      setTranscript((prev) => prev.filter((msg) => msg !== tempMessage));
      setInput(messageText); // Restore input
    } finally {
      setIsSending(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this session? You won't be able to send more messages.")) return;

    try {
      const res = await fetch("/api/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: initialSession.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to end session");
      }
      setIsEnded(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to end session";
      alert(errorMessage);
    }
  };

  const handleRequestHint = async () => {
    if (transcript.length === 0 || isLoadingHint || isEnded) return;

    setIsLoadingHint(true);
    setError(null);

    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: initialSession.id }),
      });
      const data = await res.json();

      if (data.hintObject) {
        setHintLog((prev) => [...prev, data.hintObject]);
      }
    } catch (err: unknown) {
      console.error("Hint request failed:", err);
    } finally {
      setIsLoadingHint(false);
      setTimeout(scrollToBottom, 50); // Ensure hint is visible
    }
  };

  return (
    <div className="w-full max-w-[800px] flex flex-col h-screen py-4 sm:py-8 px-4">
      {/* Header */}
      <ChatHeader
        persona={persona}
        sessionId={initialSession.id}
        isEnded={isEnded}
        transcriptLength={transcript.length}
        isLoadingHint={isLoadingHint}
        onRequestHint={handleRequestHint}
        onEndSession={handleEndSession}
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-4 pr-2">
        {transcript.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
            Send a message to begin the session.
          </div>
        ) : (
          transcript.map((msg, i) => {
            const inlineHints = hintLog.filter((h) => h.afterMessageId === msg.id);
            return (
              <ChatMessageItem
                key={msg.id || `msg-${i}`}
                message={msg}
                personaName={persona.name}
                hints={inlineHints}
              />
            );
          })
        )}

        {isSending && (
          <div className="self-start max-w-[85%] rounded-xl p-4 bg-surface border border-border-subtle flex items-center gap-2 text-text-secondary">
            <div className="w-2 h-2 bg-text-tertiary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-text-tertiary rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-text-tertiary rounded-full animate-pulse delay-150"></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mb-4 text-sm text-danger bg-danger/10 p-3 rounded-md flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isEnded && (
        <div className="mb-4 text-center text-small text-text-secondary bg-surface-raised py-3 rounded-md">
          This session has ended.
        </div>
      )}

      {/* Input Area */}
      <ChatInput
        input={input}
        isSending={isSending}
        isEnded={isEnded}
        onChange={setInput}
        onSend={handleSend}
      />
    </div>
  );
}
