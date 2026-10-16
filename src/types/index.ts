/**
 * Core TypeScript definitions for the AI Therapist Trainer.
 */

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type LanguagePreference = "english" | "hinglish" | "hindi_roman";

export interface TranscriptEntry {
  id?: string;
  role: "coach" | "client";
  text: string;
  timestamp?: string;
  detectedStage?: string;
  detectedStep?: string;
  stageConfidence?: number;
}

export interface HintLogEntry {
  timestamp: string;
  afterMessageId: string;
  hintText: string;
  mistakeFlag?: string;
}

export interface Persona {
  id: string;
  userId?: string | null;
  name: string;
  slug: string;
  languagePref: string;
  difficulty: string;
  gender: string | null;
  content: string;
  isBuiltin: boolean;
  isAiGenerated?: boolean;
  createdAt?: Date | string;
}

export interface Evaluation {
  id: string;
  sessionId?: string;
  overallScore: number | null;
  reportMarkdown: string;
  status: string;
  createdAt: Date | string;
}

export interface StageMatchResult {
  detectedStage: string;
  detectedStep: string;
  stageConfidence: number;
  canonicalQuestion: string;
  rawScore?: number;
  decoyScore?: number;
}

export interface VerificationResult {
  verifiedMarkdown: string;
  mistakesCount: number;
  praiseCount: number;
}
