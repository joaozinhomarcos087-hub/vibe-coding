import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma/bcrypt imports) used by middleware for route
// protection. The full config with the Credentials provider lives in
// `auth.ts` and is only loaded in Node.js runtime (API route, server
// components, server actions).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", request.nextUrl));
        return true;
      }
      return isLoggedIn;
    },
  },
};
