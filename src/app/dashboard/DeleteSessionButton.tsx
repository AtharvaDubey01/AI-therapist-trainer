"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, Check } from "lucide-react";

export default function DeleteSessionButton({ sessionId, personaName }: { sessionId: string; personaName: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(true);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(false);
  };

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete session");
      }

      router.refresh();
      // Leave isDeleting as true so it stays disabled while it unmounts
    } catch (error) {
      console.error(error);
      alert("Failed to delete the session.");
      setIsDeleting(false);
      setIsConfirming(false);
    }
  };

  if (isConfirming) {
    return (
      <div 
        className="flex items-center gap-2 bg-[#1C1C24] border border-[#2A2A33] p-1.5 pl-3 rounded-lg shadow-md z-50 absolute right-0"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <span className="text-xs text-text-primary font-medium whitespace-nowrap">Delete?</span>
        <button
          onClick={handleCancel}
          disabled={isDeleting}
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-[#2A2A33] rounded-md transition-colors"
          title="Cancel"
        >
          <X size={14} />
        </button>
        <button
          onClick={handleConfirm}
          disabled={isDeleting}
          className="p-1.5 text-red-500 hover:text-red-400 hover:bg-[#2A2A33] rounded-md transition-colors"
          title="Confirm Delete"
        >
          <Check size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDeleteClick}
      className="p-2 text-text-tertiary hover:text-red-500 hover:bg-surface-raised rounded-lg transition-colors z-10 relative"
      title={`Delete session with ${personaName}`}
    >
      <Trash2 size={16} />
    </button>
  );
}
