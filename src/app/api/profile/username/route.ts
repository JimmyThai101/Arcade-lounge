import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateUsername, normalizeUsername } from "@/lib/username";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const validation = validateUsername(body.username ?? "");
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: {
      username: { equals: validation.username, mode: "insensitive" },
      NOT: { id: session.user.id },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  // Extra server-side check on normalized form uniqueness collisions like Cool_Guy vs coolguy
  const normalized = normalizeUsername(validation.username);
  const allNamed = await prisma.user.findMany({
    where: {
      username: { not: null },
      NOT: { id: session.user.id },
    },
    select: { username: true },
  });
  if (allNamed.some((u) => u.username && normalizeUsername(u.username) === normalized)) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username: validation.username,
      usernameSetAt: new Date(),
    },
    select: {
      username: true,
      wins: true,
      losses: true,
      ties: true,
      gamesPlayed: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
