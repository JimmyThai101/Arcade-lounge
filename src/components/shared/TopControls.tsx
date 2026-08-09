"use client";

import MuteButton from "./MuteButton";
import AuthButton from "@/components/auth/AuthButton";

export default function TopControls() {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <AuthButton />
      <MuteButton />
    </div>
  );
}
