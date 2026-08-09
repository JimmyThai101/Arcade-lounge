"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getJimmycoin, JIMMYCOIN_EVENT } from "@/lib/jimmycoin";

interface JimmycoinBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export default function JimmycoinBadge({ className = "", size = "md" }: JimmycoinBadgeProps) {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setBalance(getJimmycoin());
    const onChange = (event: Event) => {
      const custom = event as CustomEvent<number>;
      if (typeof custom.detail === "number") setBalance(custom.detail);
      else setBalance(getJimmycoin());
    };
    window.addEventListener(JIMMYCOIN_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(JIMMYCOIN_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const iconSize = size === "sm" ? 22 : 28;
  const textClass = size === "sm" ? "text-sm" : "text-base";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-lounge-gold/40 bg-lounge-charcoal/80 px-3 py-1.5 backdrop-blur-sm ${className}`}
      title="Jimmycoin"
    >
      <Image
        src="/jimmycoin.png"
        alt="Jimmycoin"
        width={iconSize}
        height={iconSize}
        className="rounded-full object-cover ring-1 ring-lounge-gold/50"
      />
      <span className={`font-semibold tabular-nums text-lounge-gold-light ${textClass}`}>
        {balance}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        JC
      </span>
    </div>
  );
}
