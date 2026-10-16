import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { personaId } = body;

    if (!personaId) {
      return NextResponse.json({ error: "Missing personaId" }, { status: 400 });
    }

    // Verify persona exists and is either built-in or belongs to the user
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
    });

    if (!persona || (!persona.isBuiltin && persona.userId !== user.id)) {
      return NextResponse.json({ error: "Persona not found or access denied" }, { status: 404 });
    }

    // Create the session
    const chatSession = await prisma.chatSession.create({
      data: {
        user: { connect: { id: user.id } },
        persona: { connect: { id: persona.id } },
        transcript: "[]", // Initialize with empty JSON array stored as text
      },
    });

    return NextResponse.json({ session: chatSession });
  } catch (error) {
    console.error("[POST /api/sessions/create]", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
