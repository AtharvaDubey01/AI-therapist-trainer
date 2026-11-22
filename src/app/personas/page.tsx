"use client";

import { useState, useEffect } from "react";
import { Persona } from "@/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Sparkles, Upload, FileUser, User, Loader2 } from "lucide-react";



export default function PersonasPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Creation State
  const [manualName, setManualName] = useState("");
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  // AI Generation State
  const [aiName, setAiName] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [aiLanguage, setAiLanguage] = useState("english");
  const [aiDifficulty, setAiDifficulty] = useState("intermediate");
  const [aiGender, setAiGender] = useState("other");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");



  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/personas");
        if (res.ok && isMounted) {
          const data = await res.json();
          setPersonas(data.personas);
        }
      } catch (error) {
        console.error("Failed to fetch personas", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    
    setIsCreatingManual(true);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          languagePref: "english",
          difficulty: "intermediate",
          isAiGenerated: false,
          content: `# Character Profile: ${manualName}\n\n**Basic Info**\n- **Age:** 30\n- **Language:** English\n- **Difficulty:** Intermediate\n\n**Background Context**\n\n\n**Presenting Problem**\n\n\n**Personality & Tone**\n\n\n**Coaching Goals**\n\n\n**Soft Sea Constraints (For AI Generation)**\n`,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/personas/${data.persona.id}`);
      } else {
        const data = await res.json();
        alert(data.error || "Manual create failed");
      }
    } catch (error) {
      console.error("Manual create failed", error);
    } finally {
      setIsCreatingManual(false);
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiName.trim() || !aiDescription.trim()) return;
    
    setIsGenerating(true);
    setAiError("");
    
    try {
      const res = await fetch("/api/personas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: aiName,
          shortDescription: aiDescription,
          languagePref: aiLanguage,
          difficulty: aiDifficulty,
          gender: aiGender
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        setAiError(data.error || "Generation failed");
        setIsGenerating(false);
        return;
      }

      // Now save the generated persona
      // The name comes straight from user input
      const name = aiName.trim();
      
      const saveRes = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          languagePref: aiLanguage,
          difficulty: aiDifficulty,
          gender: aiGender,
          content: data.content,
          isAiGenerated: true,
        }),
      });

      if (saveRes.ok) {
        const saveData = await saveRes.json();
        router.push(`/personas/${saveData.persona.id}`);
      } else {
        const saveData = await saveRes.json();
        setAiError(saveData.error || "Failed to save generated persona");
      }
    } catch (error) {
      console.error("AI generate failed", error);
      setAiError("Network error during generation");
    } finally {
      if (aiError) setIsGenerating(false); // Only reset if error, else we are redirecting
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/personas/import", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/personas/${data.persona.id}`);
      }
    } catch (error) {
      console.error("Import failed", error);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Practice Clients</h1>
            <p className="text-[var(--color-text-secondary)]">Manage personas for your AI therapist trainer.</p>
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-lg transition-colors border border-[var(--color-border-subtle)]">
              <Upload className="w-4 h-4" />
              <span>Import .md</span>
              <input type="file" accept=".md" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Panel: Creation Tools */}
          <div className="lg:w-1/3 flex flex-col gap-6">
            {/* AI Generator Card */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Generate
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Describe a client in one sentence, and AI will build a full psychological profile.
              </p>
              
              <form onSubmit={handleAIGenerate} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  placeholder="Client Name (e.g., Pankaj)"
                  className="w-full p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  required
                />
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="e.g., A nervous first-time manager who struggles to delegate tasks..."
                  className="w-full h-24 p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text-primary)] resize-none focus:outline-none focus:border-[var(--color-accent-primary)]"
                  required
                />
                <div className="flex gap-3">
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    className="flex-1 p-2 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  >
                    <option value="english">English</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="flex-1 p-2 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <select
                  value={aiGender}
                  onChange={(e) => setAiGender(e.target.value)}
                  className="w-full p-2 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                >
                  <option value="other">Gender: Other / Not Specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {aiError && <p className="text-red-400 text-xs">{aiError}</p>}
                <button 
                  type="submit" 
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Profile</>
                  )}
                </button>
              </form>
            </div>

            {/* Manual Create Card */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-green-400" />
                Manual Create
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Start from scratch with a blank markdown template.
              </p>
              
              <form onSubmit={handleManualCreate} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Client Name"
                  className="w-full p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isCreatingManual}
                  className="w-full py-2.5 bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-border-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isCreatingManual ? "Creating..." : "Create Blank Persona"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: Persona List */}
          <div className="lg:w-2/3">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <FileUser className="w-5 h-5 text-[var(--color-text-secondary)]" />
              Your Clients
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-secondary)]" />
              </div>
            ) : personas.length === 0 ? (
              <div className="bg-[var(--color-bg-surface)] border border-dashed border-[var(--color-border-subtle)] rounded-xl p-12 text-center">
                <User className="w-12 h-12 text-[var(--color-border-subtle)] mx-auto mb-4" />
                <h3 className="text-[var(--color-text-primary)] font-medium mb-1">No clients yet</h3>
                <p className="text-[var(--color-text-secondary)] text-sm">Create a persona to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personas.map((persona) => (
                  <Link 
                    href={`/personas/${persona.id}`} 
                    key={persona.id}
                    className="block group bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-raised)] border border-[var(--color-border-subtle)] rounded-xl p-5 transition-all hover:border-[var(--color-accent-primary)]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors">
                        {persona.name}
                      </h3>
                      {persona.isBuiltin && (
                        <span className="text-[10px] uppercase tracking-wider bg-[#2A2A33] text-[#A0A0AC] px-2 py-1 rounded">
                          Built-in
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-[var(--color-text-tertiary)]">
                      <span className="capitalize">{persona.difficulty}</span>
                      <span>•</span>
                      <span className="capitalize">{persona.languagePref}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

