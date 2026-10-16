import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all built-in personas AND personas created by this user
    const personas = await prisma.persona.findMany({
      where: {
        OR: [
          { isBuiltin: true },
          { userId: user.id }
        ]
      },
      orderBy: [
        { isBuiltin: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ personas });
  } catch (error) {
    console.error("[GET /api/personas] Error:", error);
    return NextResponse.json({ error: "Failed to fetch personas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, languagePref, difficulty, gender, content, isAiGenerated = false } = body;

    if (!name || !languagePref || !difficulty || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

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

    const persona = await prisma.persona.create({
      data: {
        user: { connect: { id: user.id } },
        name,
        slug,
        languagePref,
        difficulty,
        gender,
        content,
        isBuiltin: false,
        isAiGenerated
      }
    });

    return NextResponse.json({ persona });
  } catch (error: unknown) {
    console.error("[POST /api/personas] Error:", error);
    return NextResponse.json({ error: "Failed to create persona", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
