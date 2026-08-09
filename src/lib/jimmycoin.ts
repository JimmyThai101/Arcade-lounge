export const JIMMYCOIN_KEY = "arcade-lounge-jimmycoin";
export const JIMMYCOIN_EVENT = "jimmycoin-change";

/** Cost to pull the slots lever */
export const SLOT_SPIN_COST = 5;

/** Jimmycoin earned for winning a free (non-wager) game */
export const WIN_REWARDS = {
  "rock-paper-scissors": 3,
  "high-card": 3,
  "dice-duel": 3,
  "memory-match": 10,
} as const;

/** Slots payouts (Jimmycoin returned on a winning spin) */
export const SLOT_PAYOUTS = {
  pair: 8,
  triple: 30,
  jackpot: 100,
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function notify(balance: number): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(JIMMYCOIN_EVENT, { detail: balance }));
}

export function getJimmycoin(): number {
  if (!isBrowser()) return 0;
  try {
    const raw = localStorage.getItem(JIMMYCOIN_KEY);
    if (raw === null) return 0;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function setJimmycoin(amount: number): number {
  const next = Math.max(0, Math.floor(amount));
  if (!isBrowser()) return next;
  localStorage.setItem(JIMMYCOIN_KEY, String(next));
  notify(next);
  return next;
}

export function addJimmycoin(amount: number): number {
  if (amount <= 0) return getJimmycoin();
  return setJimmycoin(getJimmycoin() + amount);
}

export function spendJimmycoin(amount: number): boolean {
  if (amount <= 0) return true;
  const balance = getJimmycoin();
  if (balance < amount) return false;
  setJimmycoin(balance - amount);
  return true;
}

export function canAfford(amount: number): boolean {
  return getJimmycoin() >= amount;
}
