import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Custom adapter to map 'image' to 'avatar' field
const customPrismaAdapter = {
  ...PrismaAdapter(prisma),
  createUser: async (data: any) => {
    const { image, ...rest } = data;
    return prisma.user.create({
      data: {
        ...rest,
        avatar: image, // Map 'image' from OAuth to 'avatar' in our schema
      },
    });
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: customPrismaAdapter as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Google OAuth (optional - requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Credentials (email/password)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("=== AUTH DEBUG ===");
        console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        console.log("Looking for user:", credentials.email);

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        console.log("User found:", user ? "YES" : "NO");
        if (user) {
          console.log("User ID:", user.id);
          console.log("Has password:", user.password ? "YES" : "NO");
        }

        if (!user || !user.password) {
          console.log("User not found or no password");
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        console.log("Password valid:", isValid ? "YES" : "NO");

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
      }
      // Always refresh role from database on session update
      if (trigger === "update" || !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
