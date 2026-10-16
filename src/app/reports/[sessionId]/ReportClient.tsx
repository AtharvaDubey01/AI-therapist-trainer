"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, AlertTriangle, FileText, Loader2 } from "lucide-react";

import { Evaluation } from "@/types";

interface ReportClientProps {
  sessionId: string;
  evaluation: Evaluation | null;
  personaName: string;
}

export default function ReportClient({ sessionId, evaluation: initialEval, personaName }: ReportClientProps) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(initialEval);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Polling logic if status is "pending"
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (evaluation?.status === "pending") {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/evaluate?sessionId=${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            setEvaluation(data.evaluation);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [evaluation?.status, sessionId]);

  const generateReport = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate report");
      }
      
      // Generation started, set to pending so polling kicks in
      setEvaluation({
        id: "temp",
        sessionId,
        status: "pending",
        reportMarkdown: "",
        overallScore: null,
        createdAt: new Date()
      });
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate report";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateReport = async () => {
    if (!confirm("Are you sure you want to regenerate this report? The current one will be deleted.")) return;
    
    try {
      setIsGenerating(true);
      await fetch(`/api/evaluate?sessionId=${sessionId}`, { method: 'DELETE' });
      setEvaluation(null);
      await generateReport();
    } catch (err: unknown) {
      console.error("Failed to regenerate report:", err);
      setIsGenerating(false);
    }
  };

  if (!evaluation) {
    return (
      <div className="bg-neutral-800 rounded-lg p-12 text-center border border-neutral-700 shadow-xl">
        <FileText className="w-16 h-16 text-neutral-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Session Complete</h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          You have completed your coaching session with {personaName}. Generate a comprehensive, 
          AI-driven evaluation report to see what went well and where you can improve.
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-md text-red-200 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-md font-medium transition-colors inline-flex items-center"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Evaluation...
            </>
          ) : (
            "Generate Evaluation Report"
          )}
        </button>
      </div>
    );
  }

  if (evaluation.status === "pending") {
    return (
      <div className="bg-neutral-800 rounded-lg p-12 text-center border border-neutral-700 shadow-xl">
        <Loader2 className="w-16 h-16 text-indigo-500 mx-auto mb-6 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Analyzing Session...</h2>
        <p className="text-neutral-400 max-w-md mx-auto">
          The AI is currently reviewing the transcript, identifying stages, grading your questions, and synthesizing the final report. This may take a minute.
        </p>
      </div>
    );
  }

  if (evaluation.status === "failed") {
    return (
      <div className="bg-neutral-800 rounded-lg p-12 text-center border border-red-900/50 shadow-xl">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-red-400">Evaluation Failed</h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          An error occurred while generating the evaluation report. This might be due to a timeout with the local AI model.
        </p>
        <button
          onClick={regenerateReport}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-neutral-800 p-8 rounded-lg border border-neutral-700 print:bg-white print:border-neutral-200 print:shadow-none shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold print:text-black">Evaluation Report</h1>
            <p className="text-neutral-400 print:text-neutral-600 mt-1">
              Session with {personaName} • {new Date(evaluation.createdAt).toLocaleDateString('en-US')}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-3 print:hidden">
            <button 
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Save PDF
            </button>
          </div>
        </div>

        {evaluation.overallScore !== null && (
          <div className="flex items-center gap-4 py-6 border-y border-neutral-700 print:border-neutral-200 mb-8">
            <div className="text-5xl font-black text-indigo-500 print:text-black">
              {evaluation.overallScore}
            </div>
            <div className="text-neutral-400 print:text-neutral-600">
              <div className="font-semibold text-neutral-200 print:text-black">Overall Score</div>
              <div className="text-sm">Based on adherence to the SOFT SEA framework.</div>
            </div>
          </div>
        )}

        {/* Markdown Content */}
        <div className="prose prose-invert prose-indigo max-w-none print:prose-p:text-black print:prose-headings:text-black print:prose-blockquote:border-l-indigo-600 print:prose-blockquote:bg-indigo-50 print:prose-blockquote:text-neutral-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {evaluation.reportMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
