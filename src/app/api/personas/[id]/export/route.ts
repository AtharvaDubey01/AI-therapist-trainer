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

    if (!persona.isBuiltin && persona.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Set headers to trigger a file download
    const headers = new Headers();
    headers.set("Content-Type", "text/markdown");
    headers.set("Content-Disposition", `attachment; filename="${persona.slug}.md"`);

    return new NextResponse(persona.content, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error(`[GET /api/personas/${id}/export] Error:`, error);
    return NextResponse.json({ error: "Failed to export persona" }, { status: 500 });
  }
}

