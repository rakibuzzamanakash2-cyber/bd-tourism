import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { env, features } from "@/lib/env";
import { RATE_LIMITS, ipFromHeaders, rateLimit } from "@/lib/rate-limit";
import type { UserRole } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // "Continue with Google" is only offered when its keys are configured
    ...(features.google
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, request) {
        // Our login form has its own friendlier limits; this catches scripts
        // posting straight to /api/auth/callback/credentials.
        const limited = await rateLimit(
          `authorize:ip:${ipFromHeaders(request.headers)}`,
          RATE_LIMITS.authorizeIp,
        );
        if (!limited.ok) return null;

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in, stuff the user's id and role into the JWT
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: UserRole }).role ?? "TOURIST";
      }

      // On Google OAuth, look up the fresh role from DB (adapter creates user)
      if (trigger === "signIn" && token.email && !token.role) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  events: {
    // After a Google OAuth user is created, also create their TouristProfile
    async createUser({ user }) {
      if (!user.id) return;
      await db.touristProfile
        .create({ data: { userId: user.id } })
        .catch(() => {
          // Profile already exists — no-op
        });
    },
  },
});
