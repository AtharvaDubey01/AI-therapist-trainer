import { buildPrompt } from "./promptBuilder";
import OpenAI from "openai";

/**
 * ai.ts — AI Provider Abstraction Layer
 *
 * THE ONLY FILE that knows about Ollama, Anthropic, OpenAI, or Google.
 * No other file in the codebase may import a provider SDK or make a raw
 * fetch call to an AI endpoint. See rules.md §3.1.
 *
 * Design decision: safeAICall is built INTO callAI/callEmbedding directly,
 * rather than being a separate wrapper callers must remember to use.
 * This makes the guardrail automatic — callers cannot accidentally skip it.
 * The timeout/retry/fallback pattern from rules.md §4.1 and §4.5 is applied
 * universally by default.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CallAIParams {
  promptFile?: string; // e.g. "hint.md" — filename under /prompts (optional if rawPrompt is provided)
  rawPrompt?: string; // Raw string prompt, bypasses buildPrompt
  variables?: Record<string, string>;
  maxTokens: number;
  temperature: number;
  jsonMode?: boolean;
  timeoutMs?: number; // default 20000
}

export interface CallAIResult {
  text: string;
  provider: string;
  success: boolean;
}

export interface CallEmbeddingParams {
  text: string;
}

export interface CallEmbeddingResult {
  vector: number[];
  success: boolean;
}

// ---------------------------------------------------------------------------
// Environment / Config
// ---------------------------------------------------------------------------

type AIProvider = "local" | "anthropic" | "openai" | "google";

function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "local";
  if (!["local", "anthropic", "openai", "google"].includes(provider)) {
    console.warn(
      `[ai.ts] Unknown AI_PROVIDER "${provider}", falling back to "local"`
    );
    return "local";
  }
  return provider as AIProvider;
}

function getOllamaUrl(): string {
  return process.env.OLLAMA_URL || "http://localhost:11434";
}

function getChatModel(): string {
  return process.env.OLLAMA_CHAT_MODEL || "llama3.1:8b";
}

function getEmbeddingModel(): string {
  return process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
}

const DEFAULT_TIMEOUT_MS = 20000;

// ---------------------------------------------------------------------------
// safeAICall — built-in reliability guardrail (rules.md §4.1, §4.5)
// ---------------------------------------------------------------------------

/**
 * Wraps any async function with:
 * - A timeout (Promise.race against a timer)
 * - A catch-all that returns a deterministic fallback on any error
 *
 * This is the core pattern that prevents the "10+ minute hang" bug
 * from the previous build. Applied automatically inside callAI and
 * callEmbedding — callers don't need to wrap again.
 */
async function safeAICall<T>(
  fn: () => Promise<T>,
  fallback: T,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI call timeout")), timeoutMs)
      ),
    ]);
  } catch (err) {
    console.error("[AI Call Failed]", err);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Local provider (Ollama) — fully implemented
// ---------------------------------------------------------------------------

async function callOllamaChat(
  prompt: string,
  maxTokens: number,
  temperature: number,
  jsonMode: boolean
): Promise<{ text: string }> {
  const ollamaUrl = getOllamaUrl();
  const model = getChatModel();

  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: prompt }],
    stream: false,
    options: {
      num_predict: maxTokens,
      temperature,
    },
  };

  if (jsonMode) {
    body.format = "json";
  }

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(
      `Ollama chat API returned ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  // Ollama chat API returns { message: { role, content } }
  const text = data?.message?.content ?? "";
  if (!text) {
    throw new Error("Ollama returned an empty response");
  }

  return { text };
}

async function callOllamaEmbedding(text: string): Promise<{ vector: number[] }> {
  const ollamaUrl = getOllamaUrl();
  const model = getEmbeddingModel();

  const response = await fetch(`${ollamaUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(
      `Ollama embedding API returned ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  // Ollama embed API returns { embeddings: [[...numbers]] }
  const vector = data?.embeddings?.[0];
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("Ollama returned invalid embedding data");
  }

  return { vector };
}

// ---------------------------------------------------------------------------
// Stubbed providers — structure exists, implementation comes later
// ---------------------------------------------------------------------------

async function callAnthropicChat(
  _prompt: string,
  _maxTokens: number,
  _temperature: number,
  _jsonMode: boolean
): Promise<{ text: string }> {
  void _prompt;
  void _maxTokens;
  void _temperature;
  void _jsonMode;
  throw new Error(
    'Anthropic provider is not yet fully implemented. Please use AI_PROVIDER="local" or AI_PROVIDER="openai" for now. (Anthropic support can be added in the future by installing @anthropic-ai/sdk and implementing this branch.)'
  );
}

async function callOpenAIChat(
  prompt: string,
  maxTokens: number,
  temperature: number,
  jsonMode: boolean
): Promise<{ text: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is missing.");
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Cost efficient general model for comparison tests
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature: temperature,
    response_format: jsonMode ? { type: "json_object" } : { type: "text" },
  });

  const text = response.choices[0]?.message?.content ?? "";
  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }

  return { text };
}

async function callGoogleChat(
  _prompt: string,
  _maxTokens: number,
  _temperature: number,
  _jsonMode: boolean
): Promise<{ text: string }> {
  void _prompt;
  void _maxTokens;
  void _temperature;
  void _jsonMode;
  throw new Error(
    'Google provider is not yet fully implemented. Please use AI_PROVIDER="local" or AI_PROVIDER="openai" for now. (Google/Gemini support can be added in the future by installing @google/generative-ai and implementing this branch.)'
  );
}

async function callAnthropicEmbedding(_text: string): Promise<{ vector: number[] }> {
  void _text;
  throw new Error(
    'Anthropic does not provide an embedding API (known platform limitation). Please use AI_PROVIDER="local" or AI_PROVIDER="openai" for features that require embeddings (e.g. Phase 4 stage matching). If Anthropic is needed for chat only, a separate EMBEDDING_PROVIDER env var could be added in the future to allow mixing providers.'
  );
}

async function callOpenAIEmbedding(text: string): Promise<{ vector: number[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is missing.");
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const vector = response.data[0]?.embedding;
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("OpenAI returned invalid embedding data");
  }

  return { vector };
}

async function callGoogleEmbedding(_text: string): Promise<{ vector: number[] }> {
  void _text;
  throw new Error(
    'Google embedding provider is not yet fully implemented. Please use AI_PROVIDER="local" or AI_PROVIDER="openai" for now. (Google/Gemini embedding support can be added in the future by installing @google/generative-ai and implementing this branch.)'
  );
}

// ---------------------------------------------------------------------------
// Public API — callAI and callEmbedding
// ---------------------------------------------------------------------------

/**
 * Call an AI model with a prompt template.
 *
 * - Reads the prompt file from /prompts via promptBuilder
 * - Injects variables into {{PLACEHOLDER}} tokens
 * - Routes to the correct provider based on AI_PROVIDER env var
 * - Wraps in safeAICall (timeout + catch → fallback)
 *
 * On ANY failure (network, timeout, provider error, empty response),
 * returns { text: "", provider, success: false } — never throws, never hangs.
 */
export async function callAI(params: CallAIParams): Promise<CallAIResult> {
  const {
    promptFile,
    rawPrompt,
    variables = {},
    maxTokens,
    temperature,
    jsonMode = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = params;

  const provider = getProvider();

  const fallback: CallAIResult = {
    text: "",
    provider,
    success: false,
  };

  return safeAICall(async () => {
    // Step 1: Build the prompt from the template file (or use rawPrompt)
    let prompt: string;
    if (rawPrompt) {
      prompt = rawPrompt;
    } else if (promptFile) {
      prompt = await buildPrompt(promptFile, variables);
    } else {
      throw new Error("Either rawPrompt or promptFile must be provided to callAI");
    }

    // Step 2: Route to the correct provider
    let result: { text: string };

    switch (provider) {
      case "local":
        result = await callOllamaChat(prompt, maxTokens, temperature, jsonMode);
        break;
      case "anthropic":
        result = await callAnthropicChat(prompt, maxTokens, temperature, jsonMode);
        break;
      case "openai":
        result = await callOpenAIChat(prompt, maxTokens, temperature, jsonMode);
        break;
      case "google":
        result = await callGoogleChat(prompt, maxTokens, temperature, jsonMode);
        break;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }

    return {
      text: result.text,
      provider,
      success: true,
    };
  }, fallback, timeoutMs);
}

/**
 * Generate an embedding vector for the given text.
 *
 * - Routes to the correct provider based on AI_PROVIDER env var
 * - Wraps in safeAICall (timeout + catch → fallback)
 *
 * On ANY failure, returns { vector: [], success: false } — never throws.
 */
export async function callEmbedding(
  params: CallEmbeddingParams
): Promise<CallEmbeddingResult> {
  const { text } = params;
  const provider = getProvider();

  const fallback: CallEmbeddingResult = {
    vector: [],
    success: false,
  };

  return safeAICall(async () => {
    let result: { vector: number[] };

    switch (provider) {
      case "local":
        result = await callOllamaEmbedding(text);
        break;
      case "anthropic":
        result = await callAnthropicEmbedding(text);
        break;
      case "openai":
        result = await callOpenAIEmbedding(text);
        break;
      case "google":
        result = await callGoogleEmbedding(text);
        break;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }

    return {
      vector: result.vector,
      success: true,
    };
  }, fallback, DEFAULT_TIMEOUT_MS);
}

// Export safeAICall for use by other modules that need the same pattern
// (e.g. evaluation pipeline may want to wrap individual stage calls)
export { safeAICall };

// ---------------------------------------------------------------------------
// Batch Embedding — for bulk operations like stage matching cache init
// ---------------------------------------------------------------------------

export interface CallBatchEmbeddingResult {
  vectors: number[][];
  success: boolean;
}

/**
 * Embed multiple texts in a single API call (where supported).
 * Falls back to sequential single-text calls for providers that don't support batch.
 *
 * On ANY failure, returns { vectors: [], success: false } — never throws.
 */
export async function callBatchEmbedding(
  texts: string[]
): Promise<CallBatchEmbeddingResult> {
  const provider = getProvider();

  const fallback: CallBatchEmbeddingResult = {
    vectors: [],
    success: false,
  };

  if (texts.length === 0) {
    return { vectors: [], success: true };
  }

  return safeAICall(async () => {
    let vectors: number[][];

    switch (provider) {
      case "openai": {
        // OpenAI supports batch embedding natively — send all texts at once
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is missing.");
        const openai = new OpenAI({ apiKey });

        // OpenAI has a limit of ~2048 texts per batch call; chunk if needed
        const BATCH_SIZE = 200;
        vectors = [];
        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
          const batch = texts.slice(i, i + BATCH_SIZE);
          const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: batch,
          });
          const sortedData = [...response.data].sort((a, b) => a.index - b.index);
          for (const item of sortedData) {
            vectors.push(item.embedding);
          }
        }
        break;
      }
      case "local": {
        // Ollama doesn't support batch — fall back to sequential
        vectors = [];
        for (const text of texts) {
          const result = await callOllamaEmbedding(text);
          vectors.push(result.vector);
        }
        break;
      }
      default:
        throw new Error(`Batch embedding not supported for provider: ${provider}`);
    }

    return {
      vectors,
      success: true,
    };
  }, fallback, 120000); // 120s timeout for batch operations
}
