import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { callAI } from "@/lib/ai";
import { buildPrompt } from "@/lib/promptBuilder";
import { TranscriptEntry } from "@/lib/rapport";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const transcript: TranscriptEntry[] = JSON.parse(session.transcript);

    if (transcript.length === 0) {
      return NextResponse.json({ error: "Cannot provide a hint with 0 messages." }, { status: 400 });
    }

    // Get last 20 messages
    const recentTranscript = transcript.slice(-20);

    // Format transcript for prompt including stage matches
    const transcriptText = recentTranscript.map(entry => {
      let line = `${entry.role === "coach" ? "Coach" : "Client"}: ${entry.text}`;
      if (entry.role === "coach" && entry.detectedStage && entry.detectedStage !== "unmatched") {
        line += `\n[System: Coach message mapped to stage ${entry.detectedStage}, step ${entry.detectedStep}]`;
      }
      return line;
    }).join("\n\n");

    // Extract the coach's messages for isolated mistake checking
    const coachMessages = recentTranscript.filter(e => e.role === "coach");
    const coachLastMessage = coachMessages.length > 0 ? coachMessages[coachMessages.length - 1].text : "(no coach message yet)";
    const coachPreviousMessage = coachMessages.length > 1 ? coachMessages[coachMessages.length - 2].text : "(no previous coach message)";

    // Extract the client's last message for vague-time check
    const clientMessages = recentTranscript.filter(e => e.role === "client");
    const clientLastMessage = clientMessages.length > 0 ? clientMessages[clientMessages.length - 1].text : "(no client message yet)";

    // Load SOFT_SEA_KB
    const kbPath = path.join(process.cwd(), "prompts", "soft_sea_kb.md");
    let kbContent = "";
    if (fs.existsSync(kbPath)) {
      kbContent = fs.readFileSync(kbPath, "utf-8");
    }

    const variables = {
      TRANSCRIPT: transcriptText,
      SOFT_SEA_KB: kbContent,
      COACH_LAST_MESSAGE: coachLastMessage,
      COACH_PREVIOUS_MESSAGE: coachPreviousMessage,
      CLIENT_LAST_MESSAGE: clientLastMessage,
    };

    const fullPrompt = await buildPrompt("hint.md", variables);

    const fallbackHint = "Focus on asking one open-ended question at a time and let the client lead.";

    const aiResult = await callAI({
      rawPrompt: fullPrompt,
      maxTokens: 600,
      temperature: 0.7,
      jsonMode: true,
      timeoutMs: 60000,
    });

    let hintText = fallbackHint;
    let mistake = "";
    if (aiResult.success && aiResult.text) {
      try {
        const parsed = JSON.parse(aiResult.text);
        mistake = parsed.mistake_flag ? parsed.mistake_flag.trim() + " " : "";
        const hint = parsed.hint_text ? parsed.hint_text.trim() : "";
        if (hint) {
          hintText = mistake + hint;
        }
      } catch (e) {
        console.error("Failed to parse JSON hint", e);
      }
    }

    const afterMessageId = transcript[transcript.length - 1].id;
    const newHint = {
      timestamp: new Date().toISOString(),
      afterMessageId,
      hintText: hintText, // keeping this as the combined text for backward compatibility if needed, or just the hint part
      mistakeFlag: mistake
    };

    if (afterMessageId) {
      const hintLog = JSON.parse(session.hintLog || "[]");
      hintLog.push(newHint);
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { hintLog: JSON.stringify(hintLog) }
      });
    }

    return NextResponse.json({
      hint: hintText,
      hintObject: newHint,
      success: true,
    });

  } catch (error) {
    console.error("[POST /api/hint]", error);
    // Return generic fallback hint instead of 500 to adhere to rule
    return NextResponse.json({
      hint: "Focus on asking one open-ended question at a time and let the client lead.",
      success: false,
    });
  }
}
