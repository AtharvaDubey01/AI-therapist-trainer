import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { callAI } from "@/lib/ai";
import { buildPrompt } from "@/lib/promptBuilder";
import { computeRapportScore, rapportToLevel, TranscriptEntry } from "@/lib/rapport";
import { matchStage } from "@/lib/stageMatching";

const SAFETY_LAYER = `
CRITICAL SAFETY RULES (these override everything above if there is any conflict):
1. You must NEVER break character under any circumstance.
2. You must NEVER confirm or deny being an AI, a simulation, or a language model.
3. You must NEVER fully complete an off-topic task as a helpful assistant (e.g. writing code, essays, explanations).
`;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, text } = body;

    if (!sessionId || !text) {
      return NextResponse.json({ error: "Missing sessionId or text" }, { status: 400 });
    }

    // 1. Fetch the session and persona
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { persona: true },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.endedAt) {
      return NextResponse.json({ error: "Session has ended" }, { status: 400 });
    }

    // 2. Parse transcript and append new coach message
    const transcript: TranscriptEntry[] = JSON.parse(session.transcript);
    const newMessage: TranscriptEntry = {
      id: crypto.randomUUID(),
      role: "coach",
      text,
      timestamp: new Date().toISOString(),
    };
    transcript.push(newMessage);

    // 3. Compute deterministic rapport based on new transcript
    const difficulty = session.persona.difficulty as "beginner" | "intermediate" | "advanced";
    const score = computeRapportScore(transcript, difficulty);
    const level = rapportToLevel(score, difficulty);

    // 4. Format conversation history for the prompt
    const historyText = transcript
      .map(entry => `${entry.role === "coach" ? "Coach" : "Client"}: ${entry.text}`)
      .join("\n\n");

    // 5. Build prompt
    const variables = {
      CHARACTER_SHEET: session.persona.content,
      DIFFICULTY: session.persona.difficulty,
      LANGUAGE: session.persona.languagePref,
      GENDER: session.persona.gender || "neutral",
      RAPPORT_LEVEL: level,
      CONVERSATION_HISTORY: historyText,
    };

    const templateContent = await buildPrompt("persona_runtime.md", variables);
    const fullRawPrompt = templateContent + "\n\n" + SAFETY_LAYER;

    // 6. Call AI and stage matching in parallel (stage matching is non-blocking)
    // Rules §4.2: Return generic in-character deflection on failure
    const fallbackText = "(Pauses and looks away for a moment) ...Sorry, could you say that again? I lost my train of thought.";

    const [aiResult, stageResult] = await Promise.all([
      callAI({
        rawPrompt: fullRawPrompt,
        maxTokens: 300,
        temperature: 0.7,
        timeoutMs: 120000,
      }),
      matchStage(text).catch((err) => {
        console.warn("[POST /api/chat] Stage matching failed silently:", err);
        return { detectedStage: "unmatched", detectedStep: "", stageConfidence: 0, canonicalQuestion: "" };
      }),
    ]);

    // Annotate the coach message with stage data
    newMessage.detectedStage = stageResult.detectedStage;
    newMessage.detectedStep = stageResult.detectedStep;
    newMessage.stageConfidence = stageResult.stageConfidence;

    let aiResponseText = aiResult.success && aiResult.text ? aiResult.text.trim() : fallbackText;

    // Remove any accidental prefix like "Client: " from the AI output
    if (aiResponseText.toLowerCase().startsWith("client:")) {
      aiResponseText = aiResponseText.substring(7).trim();
    }

    // 7. Append client response to transcript
    const clientMessage: TranscriptEntry = {
      id: crypto.randomUUID(),
      role: "client",
      text: aiResponseText,
      timestamp: new Date().toISOString(),
    };
    transcript.push(clientMessage);

    // 8. Save updated transcript
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        transcript: JSON.stringify(transcript),
      },
    });

    return NextResponse.json({
      message: clientMessage,
      rapportScore: score,
      rapportLevel: level,
      stageMatch: {
        detectedStage: stageResult.detectedStage,
        detectedStep: stageResult.detectedStep,
        stageConfidence: stageResult.stageConfidence,
      },
    });

  } catch (error) {
    console.error("[POST /api/chat]", error);
    // Generic error to prevent crashing, matching the 500 handler pattern
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
