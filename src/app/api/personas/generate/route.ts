import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { callAI } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, shortDescription, languagePref = "english", difficulty = "intermediate", gender = "other" } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    if (!shortDescription) {
      return NextResponse.json({ error: "Missing short description" }, { status: 400 });
    }

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await prisma.persona.findFirst({
      where: {
        slug,
        OR: [
          { isBuiltin: true },
          { userId: user.id }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: `A client named '${name}' already exists. Try a different name, or add a distinguishing detail (e.g. '${name} (2nd year)').` }, { status: 400 });
    }

    const aiResult = await callAI({
      promptFile: "persona_generator.md",
      variables: { 
        PROVIDED_NAME: name.trim(),
        SHORT_DESCRIPTION: shortDescription,
        LANGUAGE: languagePref.charAt(0).toUpperCase() + languagePref.slice(1),
        DIFFICULTY: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        GENDER: gender.charAt(0).toUpperCase() + gender.slice(1)
      },
      maxTokens: 1500,
      temperature: 0.8,
      timeoutMs: 300000, // 5 minutes for long-form character generation
    });

    if (!aiResult.success) {
      // Degrade gracefully per rules.md §4.2 instead of returning a 500
      return NextResponse.json({ 
        success: false, 
        error: "AI generation failed. Please try again." 
      });
    }

    return NextResponse.json({ success: true, content: aiResult.text });
  } catch (error) {
    console.error("[POST /api/personas/generate] Error:", error);
    return NextResponse.json({ error: "Failed to generate persona" }, { status: 500 });
  }
}

