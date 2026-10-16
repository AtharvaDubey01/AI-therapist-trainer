import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import StartSessionButton from "./StartSessionButton";
import LogoutButton from "@/components/LogoutButton";
import DeleteSessionButton from "./DeleteSessionButton";
import { MessageSquare, Clock, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch personas available to this user
  const personas = await prisma.persona.findMany({
    where: {
      OR: [
        { isBuiltin: true },
        { userId: user.id }
      ]
    },
    orderBy: [
      { isBuiltin: 'desc' },
      { name: 'asc' }
    ]
  });

  // Fetch user's recent sessions
  const recentSessions = await prisma.chatSession.findMany({
    where: { userId: user.id },
    include: { persona: true },
    orderBy: { startedAt: 'desc' }
  });

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-display text-text-primary mb-2">Dashboard</h1>
          <p className="text-body text-text-secondary">Start a new practice session or review past ones.</p>
        </div>
        <LogoutButton />
      </header>

      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-heading text-text-primary">Available Personas</h2>
          <Link href="/personas" className="text-sm text-accent-primary hover:text-accent-primary-hover flex items-center gap-1">
            Manage Personas <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map(persona => (
            <div key={persona.id} className="bg-surface border border-border-subtle rounded-xl p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-text-primary">{persona.name}</h3>
                {persona.isBuiltin && (
                  <span className="text-xs bg-surface-raised text-text-secondary px-2 py-1 rounded-full">Built-in</span>
                )}
              </div>
              <div className="flex gap-2 mb-4">
                <span className="text-xs border border-border-subtle text-text-secondary px-2 py-1 rounded-md capitalize">
                  {persona.difficulty}
                </span>
                <span className="text-xs border border-border-subtle text-text-secondary px-2 py-1 rounded-md capitalize">
                  {persona.languagePref.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-text-secondary line-clamp-3 mb-4 flex-1">
                {persona.content.split('\n')[0] || "No description"}
              </p>
              <StartSessionButton personaId={persona.id} />
            </div>
          ))}
          {personas.length === 0 && (
            <div className="col-span-full text-center py-12 text-text-secondary bg-surface rounded-xl border border-border-subtle border-dashed">
              No personas available. Create one first!
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-heading text-text-primary mb-6">Recent Sessions</h2>
        <div className="space-y-4">
          {recentSessions.map(session => (
            <div key={session.id} className="relative group bg-surface border border-border-subtle rounded-xl hover:border-accent-primary/50 transition-colors">
              <div className="flex items-center justify-between p-4 pr-16">
                <Link 
                  href={`/chat/${session.id}`} 
                  className="flex items-center gap-4 flex-1 group/link"
                >
                  <div className="p-3 bg-surface-raised rounded-lg text-accent-primary group-hover/link:bg-accent-primary/10 transition-colors">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary group-hover/link:text-accent-primary transition-colors">Session with {session.persona.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary mt-1">
                      <Clock size={12} />
                      {new Date(session.startedAt).toLocaleDateString()} at {new Date(session.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  {session.endedAt && (
                    <Link 
                      href={`/reports/${session.id}`}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 px-2 py-1 rounded-md transition-colors border border-indigo-900/50"
                    >
                      Report
                    </Link>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${session.endedAt ? 'bg-surface-raised text-text-secondary' : 'bg-accent-primary/20 text-accent-primary'}`}>
                    {session.endedAt ? 'Ended' : 'Active'}
                  </span>
                  <Link href={`/chat/${session.id}`}>
                    <ArrowRight size={16} className="text-text-tertiary hover:text-accent-primary transition-colors" />
                  </Link>
                </div>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DeleteSessionButton sessionId={session.id} personaName={session.persona.name} />
              </div>
            </div>
          ))}
          {recentSessions.length === 0 && (
            <div className="text-center py-12 text-text-secondary bg-surface rounded-xl border border-border-subtle border-dashed">
              No recent sessions.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
