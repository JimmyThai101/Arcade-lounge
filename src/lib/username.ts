/**
 * Username rules + moderation.
 * Normalizes leetspeak / separators so common bypasses still match the blocklist.
 */

const MIN_LENGTH = 3;
const MAX_LENGTH = 16;
const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

const RESERVED = new Set([
  "admin",
  "administrator",
  "mod",
  "moderator",
  "official",
  "support",
  "system",
  "staff",
  "owner",
  "root",
  "null",
  "undefined",
  "api",
  "jimmycoin",
  "gamelounge",
  "arcadelounge",
  "leaderboard",
]);

/**
 * Normalized slur / abuse terms (lowercase, no separators).
 * Short terms (≤4) match the whole name only to avoid false positives like "classic".
 */
const BLOCKED = [
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "retarded",
  "kike",
  "spic",
  "chink",
  "gook",
  "tranny",
  "troon",
  "rape",
  "rapist",
  "molest",
  "pedo",
  "paedo",
  "pedophile",
  "childporn",
  "nazi",
  "hitler",
  "holocaust",
  "kkk",
  "beaner",
  "wetback",
  "coon",
  "darkie",
  "paki",
  "slut",
  "whore",
  "bastard",
  "bitch",
  "cunt",
  "pussy",
  "asshole",
  "shit",
  "fuck",
  "fucker",
  "motherfucker",
  "stfu",
  "porn",
  "onlyfans",
  "nudes",
  "anal",
  "anus",
  "penis",
  "vagina",
  "boob",
  "tits",
  "cock",
  "dildo",
  "hentai",
  "nsfw",
  "murder",
  "suicide",
  "terrorist",
  "dick",
  "cumshot",
];

function foldLeet(value: string): string {
  return value
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/\$/g, "s")
    .replace(/@/g, "a")
    .replace(/!/g, "i");
}

/** Strip separators so "f.u_c-k" / "f u c k" collapse to the slur. */
export function normalizeUsername(raw: string): string {
  return foldLeet(raw).replace(/[^a-z0-9]/g, "");
}

function isBlocked(normalized: string): boolean {
  for (const word of BLOCKED) {
    if (word.length <= 4) {
      if (normalized === word) return true;
    } else if (normalized.includes(word)) {
      return true;
    }
  }

  // Catch stretched spellings: fuuuck, shiiit, niiigger
  const collapsed = normalized.replace(/(.)\1{2,}/g, "$1$1");
  if (collapsed !== normalized) {
    for (const word of BLOCKED) {
      if (word.length <= 4) {
        if (collapsed === word) return true;
      } else if (collapsed.includes(word)) {
        return true;
      }
    }
  }

  return false;
}

export type UsernameValidation =
  | { ok: true; username: string }
  | { ok: false; error: string };

export function validateUsername(raw: string): UsernameValidation {
  const trimmed = raw.trim();

  if (trimmed.length < MIN_LENGTH) {
    return { ok: false, error: `Username must be at least ${MIN_LENGTH} characters.` };
  }
  if (trimmed.length > MAX_LENGTH) {
    return { ok: false, error: `Username must be at most ${MAX_LENGTH} characters.` };
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error: "Use letters, numbers, and underscores only. Must start with a letter.",
    };
  }

  const normalized = normalizeUsername(trimmed);

  if (RESERVED.has(normalized)) {
    return { ok: false, error: "That username is reserved." };
  }

  if (isBlocked(normalized)) {
    return { ok: false, error: "That username isn’t allowed. Pick another." };
  }

  return { ok: true, username: trimmed };
}
