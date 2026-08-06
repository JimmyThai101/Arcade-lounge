"use client";

import { ReactNode } from "react";
import { playClick } from "@/lib/sounds";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "gold";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

const variants = {
  primary:
    "bg-lounge-red hover:bg-lounge-red-light text-white border-lounge-red-light/30",
  secondary:
    "bg-lounge-surface hover:bg-lounge-border text-gray-200 border-lounge-border",
  danger:
    "bg-red-900/60 hover:bg-red-800/80 text-red-200 border-red-700/40",
  gold:
    "bg-lounge-gold/20 hover:bg-lounge-gold/30 text-lounge-gold-light border-lounge-gold/40",
};

export default function GameButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    playClick();
    onClick?.();
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`rounded-lg border px-6 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
