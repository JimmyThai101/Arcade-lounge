import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isAuthConfigured } from "@/lib/auth-config";

export { isAuthConfigured };

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "not-configured",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "not-configured",
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = user.username ?? null;
        session.user.wins = user.wins;
        session.user.losses = user.losses;
        session.user.ties = user.ties;
        session.user.gamesPlayed = user.gamesPlayed;
      }
      return session;
    },
  },
  trustHost: true,
});
