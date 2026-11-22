/**
 * stageMatching.ts — Deterministic Stage Matching (Phase 4)
 *
 * Embeds all ~218 variation phrasings from stage_question_variations.json once
 * (cached in memory), then for each incoming coach message, embeds it and
 * computes cosine similarity against the cached set.
 *
 * Returns the best-matching stage/step and a confidence score.
 * If confidence is below CONFIDENCE_THRESHOLD, returns "unmatched" rather than
 * forcing a low-confidence guess — per architecture.md §8.
 *
 * This is pure math — no generative AI call, no visible impact on chat UX.
 * See architecture.md §8, rules.md §1 ("code does bookkeeping, AI does judgment").
 */

import { callEmbedding, callBatchEmbedding } from "./ai";
import { StageMatchResult } from "@/types";
export type { StageMatchResult };
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------



interface VariationEntry {
  stage: string;
  step: string;
  canonical: string;
  variationText: string;
  embedding: number[];
}

// ---------------------------------------------------------------------------
// Config & Constants
// ---------------------------------------------------------------------------

const CONFIDENCE_THRESHOLD = 0.50; // Base threshold, checked alongside decoy margin
const DECOY_MARGIN = 0.05; // stageScore must beat bestDecoyScore by at least this margin

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

let variationCache: VariationEntry[] | null = null;
let decoyCache: DecoyEntry[] | null = null;
let cacheInitializing: Promise<void> | null = null;

interface DecoyEntry {
  variationText: string;
  embedding: number[];
}

// ---------------------------------------------------------------------------
// Load & embed all variations (once, lazily)
// ---------------------------------------------------------------------------

function loadVariationsConfig(): Array<{ stage: string; step: string; canonical: string; variationText: string }> {
  const configPath = path.join(process.cwd(), "config", "stage_question_variations.json");
  const raw = fs.readFileSync(configPath, "utf-8");
  const data: Record<string, Record<string, { canonical: string; variations: string[] }>> = JSON.parse(raw);

  const result: Array<{ stage: string; step: string; canonical: string; variationText: string }> = [];

  for (const [stage, steps] of Object.entries(data)) {
    for (const [step, info] of Object.entries(steps)) {
      for (const variation of info.variations) {
        result.push({
          stage,
          step,
          canonical: info.canonical,
          variationText: variation,
        });
      }
    }
  }

  return result;
}

function loadDecoyConfig(): string[] {
  const configPath = path.join(process.cwd(), "config", "casual_decoy.json");
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as string[];
  }
  return [];
}

async function initializeCache(): Promise<void> {
  if (variationCache !== null) return;

  // Prevent multiple concurrent initializations
  if (cacheInitializing) {
    await cacheInitializing;
    return;
  }

  cacheInitializing = (async () => {
    console.log("[stageMatching] Initializing embedding cache...");
    const startTime = Date.now();

    const variations = loadVariationsConfig();

    // Batch embed all variations at once
    const texts = variations.map(v => v.variationText);
    const batchResult = await callBatchEmbedding(texts);

    const entries: VariationEntry[] = [];
    if (batchResult.success && batchResult.vectors.length === variations.length) {
      for (let i = 0; i < variations.length; i++) {
        entries.push({ ...variations[i], embedding: batchResult.vectors[i] });
      }
    } else {
      console.warn("[stageMatching] Batch embedding failed, falling back to sequential...");
      for (const v of variations) {
        const result = await callEmbedding({ text: v.variationText });
        if (result.success && result.vector.length > 0) {
          entries.push({ ...v, embedding: result.vector });
        }
      }
    }

    // Load and embed decoys
    const decoys = loadDecoyConfig();
    const decoyEntries: DecoyEntry[] = [];
    if (decoys.length > 0) {
      const decoyBatchResult = await callBatchEmbedding(decoys);
      if (decoyBatchResult.success && decoyBatchResult.vectors.length === decoys.length) {
        for (let i = 0; i < decoys.length; i++) {
          decoyEntries.push({ variationText: decoys[i], embedding: decoyBatchResult.vectors[i] });
        }
      } else {
        for (const d of decoys) {
          const result = await callEmbedding({ text: d });
          if (result.success && result.vector.length > 0) {
            decoyEntries.push({ variationText: d, embedding: result.vector });
          }
        }
      }
    }

    variationCache = entries;
    decoyCache = decoyEntries;
    const elapsed = Date.now() - startTime;
    console.log(`[stageMatching] Cache initialized: ${entries.length} variations, ${decoyEntries.length} decoys in ${elapsed}ms`);
  })();

  await cacheInitializing;
  cacheInitializing = null;
}

// ---------------------------------------------------------------------------
// Cosine similarity — plain TypeScript, no library needed (rules.md §1)
// ---------------------------------------------------------------------------

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Match a coach message to the closest SOFT SEA stage/step.
 *
 * Returns { detectedStage, detectedStep, stageConfidence, canonicalQuestion }.
 * If confidence < CONFIDENCE_THRESHOLD, returns detectedStage="unmatched".
 */
export async function matchStage(coachMessage: string): Promise<StageMatchResult> {
  // Ensure cache is initialized
  await initializeCache();

  if (!variationCache || variationCache.length === 0) {
    console.warn("[stageMatching] Cache is empty — returning unmatched");
    return {
      detectedStage: "unmatched",
      detectedStep: "",
      stageConfidence: 0,
      canonicalQuestion: "",
    };
  }

  // Embed the incoming coach message
  const embedResult = await callEmbedding({ text: coachMessage });
  if (!embedResult.success || embedResult.vector.length === 0) {
    console.warn("[stageMatching] Failed to embed coach message — returning unmatched");
    return {
      detectedStage: "unmatched",
      detectedStep: "",
      stageConfidence: 0,
      canonicalQuestion: "",
    };
  }

  const messageEmbedding = embedResult.vector;

  // Find best match via cosine similarity
  let bestMatch: VariationEntry | null = null;
  let bestScore = -1;

  for (const entry of variationCache) {
    const score = cosineSimilarity(messageEmbedding, entry.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Find best decoy match
  let bestDecoyScore = -1;
  if (decoyCache && decoyCache.length > 0) {
    for (const entry of decoyCache) {
      const score = cosineSimilarity(messageEmbedding, entry.embedding);
      if (score > bestDecoyScore) {
        bestDecoyScore = score;
      }
    }
  }

  // Apply dual-threshold logic
  if (!bestMatch || bestScore < CONFIDENCE_THRESHOLD || (bestScore - bestDecoyScore) < DECOY_MARGIN) {
    return {
      detectedStage: "unmatched",
      detectedStep: "",
      stageConfidence: bestScore >= 0 ? bestScore : 0,
      canonicalQuestion: "",
      rawScore: bestScore,
      decoyScore: bestDecoyScore,
    };
  }

  return {
    detectedStage: bestMatch.stage,
    detectedStep: bestMatch.step,
    stageConfidence: Math.round(bestScore * 1000) / 1000,
    canonicalQuestion: bestMatch.canonical,
    rawScore: bestScore,
    decoyScore: bestDecoyScore,
  };
}

/**
 * Force-clear the embedding cache (useful for testing or if provider changes).
 */
export function clearStageMatchCache(): void {
  variationCache = null;
  decoyCache = null;
  cacheInitializing = null;
  console.log("[stageMatching] Cache cleared");
}
