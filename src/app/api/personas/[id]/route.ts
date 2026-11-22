import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const persona = await prisma.persona.findUnique({
      where: { id }
    });

    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    // Allow access if builtin OR created by this user
    if (!persona.isBuiltin && persona.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ persona });
  } catch (error) {
    console.error(`[GET /api/personas/${id}] Error:`, error);
    return NextResponse.json({ error: "Failed to fetch persona" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const persona = await prisma.persona.findUnique({
      where: { id }
    });

    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    if (persona.isBuiltin) {
      return NextResponse.json({ error: "Cannot modify built-in personas" }, { status: 403 });
    }

    if (persona.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, languagePref, difficulty, gender, content } = body;

    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : undefined;

    if (slug) {
      const existing = await prisma.persona.findFirst({
        where: {
          slug,
          id: { not: id },
          OR: [
            { isBuiltin: true },
            { userId: user.id }
          ]
        }
      });
      if (existing) {
        return NextResponse.json({ error: `A client named '${name}' already exists. Try a different name.` }, { status: 400 });
      }
    }

    const updatedPersona = await prisma.persona.update({
      where: { id },
      data: {
        ...(name && { name, slug }),
        ...(languagePref && { languagePref }),
        ...(difficulty && { difficulty }),
        ...(gender !== undefined && { gender }),
        ...(content && { content }),
      }
    });

    return NextResponse.json({ persona: updatedPersona });
  } catch (error) {
    console.error(`[PUT /api/personas/${id}] Error:`, error);
    return NextResponse.json({ error: "Failed to update persona" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const persona = await prisma.persona.findUnique({
      where: { id }
    });

    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    if (persona.isBuiltin) {
      return NextResponse.json({ error: "Cannot delete built-in personas" }, { status: 403 });
    }

    if (persona.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if there are any chat sessions for this persona
    const sessionCount = await prisma.chatSession.count({
      where: { personaId: id }
    });

    if (sessionCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete this persona because it has an active chat or evaluation history. Deleting it would destroy your coaching records." 
      }, { status: 400 });
    }

    // Hard delete the persona
    await prisma.persona.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/personas/${id}] Error:`, error);
    return NextResponse.json({ error: "Failed to delete persona" }, { status: 500 });
  }
}
