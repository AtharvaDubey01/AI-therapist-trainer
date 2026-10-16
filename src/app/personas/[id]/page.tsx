"use client";

import { useState, useEffect } from "react";
import { Persona } from "@/types";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Download, Trash2, Loader2, Check } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";



export default function PersonaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");


  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [languagePref, setLanguagePref] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [gender, setGender] = useState("other");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/personas/${id}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setPersona(data.persona);
          setContent(data.persona.content);
          setName(data.persona.name);
          setLanguagePref(data.persona.languagePref);
          setDifficulty(data.persona.difficulty);
          setGender(data.persona.gender || "other");
        } else if (isMounted) {
          setError("Persona not found or unauthorized");
        }
      } catch {
        if (isMounted) {
          setError("Failed to load persona");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSave = async () => {
    if (persona?.isBuiltin) return;
    
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch(`/api/personas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          languagePref,
          difficulty,
          gender,
          content,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setPersona(prev => prev ? { ...prev, name, languagePref, difficulty, gender, content } : null);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (persona?.isBuiltin) return;
    if (!confirm("Are you sure you want to delete this persona?")) return;

    try {
      const res = await fetch(`/api/personas/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/personas");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch {
      alert("Network error while deleting");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-secondary)]" />
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error || "Persona not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none px-8 py-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/personas" className="p-2 hover:bg-[var(--color-bg-surface-raised)] rounded-full transition-colors text-[var(--color-text-secondary)]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              {persona.isBuiltin ? (
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{persona.name}</h1>
              ) : (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold bg-transparent text-[var(--color-text-primary)] focus:outline-none focus:border-b focus:border-[var(--color-accent-primary)] px-1 -ml-1 w-64"
                />
              )}
              {persona.isBuiltin && (
                <span className="text-[10px] uppercase tracking-wider bg-[#2A2A33] text-[#A0A0AC] px-2 py-1 rounded">
                  Built-in (Read-Only)
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-2">
                <span>Language:</span>
                {persona.isBuiltin || persona.isAiGenerated ? (
                  <span className="capitalize">{persona.languagePref}</span>
                ) : (
                  <select
                    value={languagePref}
                    onChange={(e) => setLanguagePref(e.target.value)}
                    className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded px-2 py-0.5 text-xs focus:outline-none"
                  >
                    <option value="english">English</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>Difficulty:</span>
                {persona.isBuiltin || persona.isAiGenerated ? (
                  <span className="capitalize">{persona.difficulty}</span>
                ) : (
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded px-2 py-0.5 text-xs focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>Gender:</span>
                {persona.isBuiltin || persona.isAiGenerated ? (
                  <span className="capitalize">{persona.gender || "Other"}</span>
                ) : (
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded px-2 py-0.5 text-xs focus:outline-none"
                  >
                    <option value="other">Other</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/personas/${persona.id}/export`}
            download={`${persona.slug}.md`}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-surface-raised)] hover:bg-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-lg transition-colors border border-[var(--color-border-subtle)] text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Export .md
          </a>
          
          {!persona.isBuiltin && (
            <>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-red-500/20"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : saved ? (
                  <><Check className="w-4 h-4" /> Saved</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Changes</>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {error && !persona?.isBuiltin && (
        <div className="flex-none px-8 py-2 bg-red-500/10 text-red-400 text-sm text-center">
          {error}
        </div>
      )}


      {/* Editor Area */}
      <div className="flex-1 p-8 min-h-0">
        <MarkdownEditor
          initialValue={content}
          onChange={setContent}
          readOnly={persona.isBuiltin}
        />
      </div>
    </div>
  );
}
