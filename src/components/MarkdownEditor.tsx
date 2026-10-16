"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function MarkdownEditor({
  initialValue,
  onChange,
  readOnly = false,
}: MarkdownEditorProps) {
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  const [value, setValue] = useState(initialValue);

  // Sync state if initialValue changes externally (e.g. AI generation)
  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue);
    setValue(initialValue);
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex h-full w-full border border-[var(--color-border-subtle)] rounded-lg overflow-hidden bg-[var(--color-bg-surface)]">
      {/* Raw Markdown Input Pane */}
      <div className={`w-1/2 flex flex-col border-r border-[var(--color-border-subtle)] ${readOnly ? 'bg-[var(--color-bg-base)]' : ''}`}>
        <div className="p-3 bg-[var(--color-bg-surface-raised)] border-b border-[var(--color-border-subtle)] text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
          {readOnly ? 'Raw Markdown (Read-Only)' : 'Edit Markdown'}
        </div>
        <textarea
          value={value}
          onChange={handleChange}
          readOnly={readOnly}
          className="flex-1 p-4 bg-transparent text-[var(--color-text-primary)] font-mono text-sm resize-none focus:outline-none"
          placeholder="Enter character profile here in Markdown format..."
        />
      </div>

      {/* Rendered Preview Pane */}
      <div className="w-1/2 flex flex-col bg-[var(--color-bg-base)]">
        <div className="p-3 bg-[var(--color-bg-surface-raised)] border-b border-[var(--color-border-subtle)] text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
          Live Preview
        </div>
        <div className="flex-1 p-6 overflow-y-auto prose prose-invert prose-sm max-w-none text-[var(--color-text-primary)]">
          <div className="markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
