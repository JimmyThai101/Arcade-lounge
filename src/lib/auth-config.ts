export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("johndoe:randompassword")
  );
}
