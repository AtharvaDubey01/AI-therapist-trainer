// Phase 6: Report page — placeholder
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import ReportClient from "./ReportClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const session = await prisma.chatSession.findUnique({
    where: { id: resolvedParams.sessionId },
    include: {
      persona: true,
      evaluation: true
    }
  });

  if (!session || session.userId !== user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 print:bg-white print:text-black print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header - Hidden when printing */}
        <div className="flex items-center justify-between print:hidden">
          <Link 
            href="/dashboard"
            className="flex items-center text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* Client component handles the logic and rendering */}
        <ReportClient 
          sessionId={session.id} 
          evaluation={session.evaluation} 
          personaName={session.persona.name}
        />
        
      </div>
    </div>
  );
}
