import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      wins: number;
      losses: number;
      ties: number;
      gamesPlayed: number;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string | null;
    wins: number;
    losses: number;
    ties: number;
    gamesPlayed: number;
  }
}
