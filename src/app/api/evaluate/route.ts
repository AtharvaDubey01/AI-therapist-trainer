import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { TranscriptEntry } from "@/lib/rapport";
import { callAI } from "@/lib/ai";
import { verifyQuotesAndCalculateScore } from "@/lib/quoteVerification";
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const evaluation = await prisma.evaluation.findUnique({ where: { sessionId } });
  return NextResponse.json({ evaluation });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  await prisma.evaluation.delete({ where: { sessionId } });
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { persona: true }
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if evaluation exists
    let evaluation = await prisma.evaluation.findUnique({ where: { sessionId } });
    if (evaluation && evaluation.status === "complete") {
      return NextResponse.json({ error: "Evaluation already complete" }, { status: 400 });
    }

    if (!evaluation) {
      evaluation = await prisma.evaluation.create({
        data: {
          sessionId,
          status: "pending"
        }
      });
    }

    const transcript: TranscriptEntry[] = JSON.parse(session.transcript as string || "[]");

    // Group transcript by detectedStage
    const buckets: Record<string, TranscriptEntry[]> = {};
    let currentStage = "Unmatched / Unknown Stage";

    for (const msg of transcript) {
      if (msg.role === "coach" && msg.detectedStage) {
        currentStage = msg.detectedStage;
      }
      if (!buckets[currentStage]) {
        buckets[currentStage] = [];
      }
      buckets[currentStage].push(msg);
    }

    // Read KB for rules
    const kbPath = path.join(process.cwd(), 'prompts', 'soft_sea_kb.md');
    const kbContent = fs.readFileSync(kbPath, 'utf-8');

    // 1. Segment Evaluations
    const segmentResults: string[] = [];
    
    // Sequential execution to protect local LLMs
    for (const [stageName, messages] of Object.entries(buckets)) {
      if (messages.length === 0) continue;

      const transcriptStr = messages.map(m => 
        `ID: ${m.id || 'N/A'}\nRole: ${m.role}\nText: ${m.text}\n---`
      ).join('\n');

      const segmentRes = await callAI({
        promptFile: "eval_segment.md",
        variables: {
          STAGE_NAME: stageName,
          STAGE_RULES: kbContent,
          TRANSCRIPT: transcriptStr
        },
        maxTokens: 1500,
        temperature: 0.1,
        timeoutMs: 120000,
      });

      if (segmentRes.success && segmentRes.text) {
        let cleanText = segmentRes.text.trim();
        cleanText = cleanText.replace(/^```(markdown)?\s*/i, '');
        cleanText = cleanText.replace(/\s*```$/i, '');
        segmentResults.push(cleanText);
      } else {
        console.warn(`[Evaluate API] Segment evaluation failed for stage: ${stageName}`);
      }
    }

    if (segmentResults.length === 0) {
      await prisma.evaluation.update({
        where: { id: evaluation.id },
        data: { status: "failed" }
      });
      return NextResponse.json({ error: "All segment evaluations failed" }, { status: 500 });
    }

    let rawReport = segmentResults.join('\n\n---\n\n');
    // Strip any stray markdown code block fences (e.g. ``` or ```markdown) that the AI might have copied from the prompt examples
    rawReport = rawReport.replace(/^```[a-z]*\s*$/gmi, '');

    // 2. Verify Quotes and Calculate Score
    const { verifiedMarkdown, mistakesCount, praiseCount } = verifyQuotesAndCalculateScore(
      rawReport,
      transcript
    );

    // Score calculation: start at 100, deduct 5 per mistake, add 2 per praise, cap at 100, min 0
    let overallScore = 100 - (mistakesCount * 5) + (praiseCount * 2);
    overallScore = Math.max(0, Math.min(100, overallScore));

    const finalReport = `# Coaching Evaluation\n\n${verifiedMarkdown}`;

    // 3. Save
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        status: "complete",
        reportMarkdown: finalReport,
        overallScore
      }
    });

    return NextResponse.json({ success: true, evaluationId: evaluation.id });

  } catch (error) {
    console.error("[Evaluate API Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
