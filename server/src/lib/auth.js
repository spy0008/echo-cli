import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db.js";
import { deviceAuthorization } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  basePath: process.env.AUTH_BASE_PATH || "/api/auth",
  trustedOrigins: (
    process.env.AUTH_TRUSTED_ORIGINS || "http://localhost:3000"
  ).split(","),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    deviceAuthorization({
      expiresIn: "30m",
      interval: "5s"
    }),
  ],
});
