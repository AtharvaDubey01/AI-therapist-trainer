import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const content = await file.text();
    const fileName = file.name.replace(/\.md$/, "");
    const slug = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const persona = await prisma.persona.create({
      data: {
        userId: user.id,
        name: fileName, // Infer name from file name
        slug,
        languagePref: "english", // Default, user can edit later
        difficulty: "intermediate", // Default, user can edit later
        content,
        isBuiltin: false
      }
    });

    return NextResponse.json({ persona });
  } catch (error) {
    console.error("[POST /api/personas/import] Error:", error);
    return NextResponse.json({ error: "Failed to import persona" }, { status: 500 });
  }
}

