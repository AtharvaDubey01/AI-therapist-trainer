"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

export default function StartSessionButton({ personaId }: { personaId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      router.push(`/chat/${data.session.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start session";
      alert(message);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 w-full mt-4 bg-accent-primary hover:bg-accent-primary-hover text-white py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
    >
      <Play size={16} />
      {isLoading ? "Starting..." : "Start Session"}
    </button>
  );
}
