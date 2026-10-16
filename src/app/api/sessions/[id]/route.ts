import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID missing" }, { status: 400 });
    }

    // Check ownership
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Not your session" }, { status: 403 });
    }

    // Delete dependent evaluations first (foreign key constraint)
    await prisma.evaluation.deleteMany({
      where: { sessionId },
    });

    // Delete the session itself
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/sessions/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
