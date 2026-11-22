"use client";

import { TranscriptEntry, HintLogEntry } from "@/types";

interface ChatMessageItemProps {
  message: TranscriptEntry;
  personaName: string;
  hints: HintLogEntry[];
}

export function ChatMessageItem({ message, personaName, hints }: ChatMessageItemProps) {
  const isCoach = message.role === "coach";

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`max-w-[85%] rounded-xl p-4 ${
          isCoach
            ? "self-end bg-surface-raised text-text-primary"
            : "self-start bg-surface text-text-primary border border-border-subtle"
        }`}
      >
        <div className="text-small text-text-secondary mb-1 flex items-center gap-2">
          {isCoach ? "You (Coach)" : personaName}
        </div>
        <div className="text-body whitespace-pre-wrap leading-relaxed">
          {message.text}
        </div>
      </div>

      {hints.map((hint, hIdx) => (
        <div
          key={`hint-${hIdx}`}
          className="self-center w-full max-w-[95%] sm:max-w-[85%] rounded-r-xl border-l-4 border-accent-primary bg-surface p-4 shadow-sm"
        >
          <div className="text-label text-accent-primary mb-2 flex items-center gap-2 font-medium text-xs tracking-wider uppercase">
            Supervisor Hint
          </div>
          <div className="text-body text-text-secondary whitespace-pre-wrap leading-relaxed">
            {hint.hintText}
          </div>
        </div>
      ))}
    </div>
  );
}
