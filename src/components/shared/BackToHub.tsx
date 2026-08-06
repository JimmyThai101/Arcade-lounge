"use client";

import Link from "next/link";
import { playClick } from "@/lib/sounds";

interface BackToHubProps {
  className?: string;
}

export default function BackToHub({ className = "" }: BackToHubProps) {
  return (
    <Link
      href="/"
      onClick={() => playClick()}
      className={`inline-flex items-center gap-2 text-sm text-gray-400 hover:text-lounge-gold transition-colors duration-200 ${className}`}
    >
      <span className="text-lg">←</span>
      <span>Back to Hub</span>
    </Link>
  );
}
