import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import ChatClient from "./ChatClient";

export default async function ChatSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const session = await prisma.chatSession.findUnique({
    where: { id: resolvedParams.sessionId },
    include: { persona: true },
  });

  if (!session || session.userId !== user.id) {
    notFound();
  }

  // Parse transcript here so we don't have to deal with string JSON in the client props
  let transcript = [];
  try {
    transcript = JSON.parse(session.transcript);
  } catch (e) {
    console.error("Failed to parse transcript", e);
  }

  let hintLog = [];
  try {
    hintLog = JSON.parse(session.hintLog || "[]");
  } catch (e) {
    console.error("Failed to parse hintLog", e);
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center">
      <ChatClient
        initialSession={{
          id: session.id,
          endedAt: session.endedAt?.toISOString() || null,
        }}
        initialTranscript={transcript}
        initialHintLog={hintLog}
        persona={{
          name: session.persona.name,
          difficulty: session.persona.difficulty,
          languagePref: session.persona.languagePref,
        }}
      />
    </div>
  );
}
