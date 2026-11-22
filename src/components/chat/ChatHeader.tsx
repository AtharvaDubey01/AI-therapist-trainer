"use client";

import Link from "next/link";
import { StopCircle } from "lucide-react";

interface ChatHeaderProps {
  persona: {
    name: string;
    difficulty: string;
    languagePref: string;
  };
  sessionId: string;
  isEnded: boolean;
  transcriptLength: number;
  isLoadingHint: boolean;
  onRequestHint: () => void;
  onEndSession: () => void;
}

export function ChatHeader({
  persona,
  sessionId,
  isEnded,
  transcriptLength,
  isLoadingHint,
  onRequestHint,
  onEndSession,
}: ChatHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-border-subtle gap-4">
      <div>
        <h1 className="text-heading text-text-primary mb-1">
          Session with {persona.name}
        </h1>
        <div className="flex gap-2 text-small">
          <span className="bg-surface-raised px-2 py-0.5 rounded-full capitalize text-text-secondary">
            {persona.difficulty}
          </span>
          <span className="bg-surface-raised px-2 py-0.5 rounded-full capitalize text-text-secondary">
            {persona.languagePref.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRequestHint}
          disabled={transcriptLength === 0 || isLoadingHint || isEnded}
          className={`px-4 py-2 text-sm bg-surface rounded-md transition-colors flex items-center gap-2 ${
            transcriptLength === 0 || isEnded
              ? "text-text-tertiary cursor-not-allowed opacity-50"
              : "text-accent-primary hover:bg-accent-primary/10"
          }`}
          title={
            transcriptLength === 0
              ? "Send a message first to get a hint."
              : "Get a hint from the supervisor"
          }
        >
          {isLoadingHint ? "Thinking..." : "Need a Hint?"}
        </button>

        {!isEnded ? (
          <button
            onClick={onEndSession}
            className="px-4 py-2 text-sm text-danger hover:bg-danger/10 rounded-md transition-colors flex items-center gap-2"
          >
            <StopCircle size={16} />
            End Session
          </button>
        ) : (
          <Link
            href={`/reports/${sessionId}`}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center gap-2"
          >
            View Evaluation
          </Link>
        )}
      </div>
    </header>
  );
}
