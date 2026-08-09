"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import GameButton from "@/components/shared/GameButton";

interface UsernameModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function UsernameModal({ open, onComplete }: UsernameModalProps) {
  const { update } = useSession();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };

      if (!res.ok) {
        setError(data.error || "Could not save username.");
        setSaving(false);
        return;
      }

      await update();
      onComplete();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-lounge-gold/40 bg-lounge-surface p-6 shadow-2xl animate-slide-up">
        <p className="text-xs uppercase tracking-[0.2em] text-lounge-gold">Choose username</p>
        <h2 className="font-display mt-2 text-2xl font-bold text-white">Join the leaderboard</h2>
        <p className="mt-2 text-sm text-gray-400">
          Pick a clean display name (3–16 characters). Slurs and bypass spellings are blocked.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
            autoFocus
            placeholder="CoolPlayer"
            className="w-full rounded-lg border border-lounge-border bg-lounge-black/60 px-4 py-3 text-white outline-none focus:border-lounge-gold/60"
            aria-label="Username"
          />
          {error && <p className="text-sm text-lounge-red-light">{error}</p>}
          <GameButton type="submit" variant="gold" disabled={saving || !username.trim()} className="w-full">
            {saving ? "Saving…" : "Save username"}
          </GameButton>
        </form>
      </div>
    </div>
  );
}
