"use client";

import Image from "next/image";

interface JimmycoinRewardProps {
  amount: number;
  className?: string;
}

/** Small inline "+N Jimmycoin" chip for win messages */
export default function JimmycoinReward({ amount, className = "" }: JimmycoinRewardProps) {
  if (amount <= 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-lounge-gold-light ${className}`}
    >
      <Image
        src="/jimmycoin.png"
        alt=""
        width={18}
        height={18}
        className="rounded-full object-cover ring-1 ring-lounge-gold/40"
      />
      <span className="text-sm font-semibold">+{amount} Jimmycoin</span>
    </span>
  );
}
