/**
 * rapport.ts — Deterministic Rapport Mechanic
 * 
 * Computes the client's current openness/rapport deterministically 
 * from the transcript history. No AI calls are made here.
 */

import { Difficulty, TranscriptEntry } from "@/types";
export type { Difficulty, TranscriptEntry };

interface DifficultyRange {
  min: number;
  max: number;
  start: number;
}

const RANGES: Record<Difficulty, DifficultyRange> = {
  beginner: { min: 50, max: 90, start: 70 },
  intermediate: { min: 25, max: 70, start: 45 },
  advanced: { min: 5, max: 45, start: 20 },
};

// Advice-giving patterns
const ADVICE_REGEX = /\b(you should|try to|here's what I'd suggest|i recommend|what you need to do is)\b/i;

/**
 * Computes the current rapport score by iterating through the transcript
 * from the start and applying heuristic adjustments.
 */
export function computeRapportScore(transcript: TranscriptEntry[], difficulty: Difficulty): number {
  const range = RANGES[difficulty] || RANGES.intermediate;
  let score = range.start;

  // We only adjust score when the coach speaks.
  // We need to know the length of the *previous* client message to compute some heuristics.
  let lastClientMessageWordCount = 0;

  for (const entry of transcript) {
    if (entry.role === "client") {
      lastClientMessageWordCount = countWords(entry.text);
    } else if (entry.role === "coach") {
      const coachText = entry.text;
      const coachWordCount = countWords(coachText);
      const isAdvice = ADVICE_REGEX.test(coachText);
      
      let delta = 0;

      // Rule 1: Advice-giving patterns -> -4
      if (isAdvice) {
        delta -= 4;
      }

      // Rule 2: Coach dominating/lecturing -> -2
      if (lastClientMessageWordCount > 0 && coachWordCount > lastClientMessageWordCount * 2) {
        delta -= 2;
      }

      // Rule 3: Short coach message (<8 words) after long client message (>40 words) -> +3
      if (coachWordCount < 8 && lastClientMessageWordCount > 40) {
        delta += 3;
      }

      // Rule 4: Genuine question (ends in "?" and not advice) -> +1
      if (!isAdvice && coachText.trim().endsWith("?")) {
        delta += 1;
      }

      score += delta;

      // Clamp to difficulty range
      if (score > range.max) score = range.max;
      if (score < range.min) score = range.min;
    }
  }

  return score;
}

/**
 * Converts a raw score into a Low/Medium/High label relative to its difficulty range.
 */
export function rapportToLevel(score: number, difficulty: Difficulty): "Low" | "Medium" | "High" {
  const range = RANGES[difficulty] || RANGES.intermediate;
  
  // Divide the range into thirds
  const span = range.max - range.min;
  const third = span / 3;

  if (score < range.min + third) {
    return "Low";
  } else if (score < range.min + 2 * third) {
    return "Medium";
  } else {
    return "High";
  }
}

export function getDifficultyRange(difficulty: Difficulty): DifficultyRange {
  return RANGES[difficulty] || RANGES.intermediate;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
