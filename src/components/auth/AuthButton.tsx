"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import UsernameModal from "./UsernameModal";

export default function AuthButton() {
  const { data: session, status, update } = useSession();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [showUsername, setShowUsername] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data: { configured?: boolean }) => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    if (session?.user && !session.user.username) {
      setShowUsername(true);
    }
  }, [session]);

  if (status === "loading" || configured === null) {
    return (
      <div className="h-10 w-28 animate-pulse rounded-full border border-lounge-border bg-lounge-surface/60" />
    );
  }

  if (!configured) {
    return (
      <div
        className="rounded-full border border-lounge-border bg-lounge-surface/70 px-3 py-2 text-xs text-gray-500"
        title="Add Google OAuth + database env vars to enable sign-in"
      >
        Sign-in setup needed
      </div>
    );
  }

  if (session?.user) {
    return (
      <>
        <div className="flex items-center gap-2 rounded-full border border-lounge-border bg-lounge-surface/80 py-1 pl-1 pr-3 backdrop-blur-sm">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt=""
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lounge-gold/20 text-xs text-lounge-gold">
              {(session.user.username || session.user.name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">
              {session.user.username || "Set username"}
            </p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-[10px] text-gray-500 hover:text-lounge-gold"
            >
              Sign out
            </button>
          </div>
        </div>
        <UsernameModal
          open={showUsername || !session.user.username}
          onComplete={async () => {
            setShowUsername(false);
            await update();
          }}
        />
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-full border border-lounge-border bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-2.9-11.9-7.1l-6.5 5C9.5 39.6 16.2 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.6 6.9l6.3 5.3C38.9 37.1 44 31.5 44 24c0-1.2-.1-2.3-.4-3.5z"
        />
      </svg>
      Sign in with Google
    </button>
  );
}
