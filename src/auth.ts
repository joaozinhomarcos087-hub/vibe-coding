import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        });

        if (!user || user.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            organizationId: user.organizationId,
            userId: user.id,
            action: "LOGIN",
            entityType: "User",
            entityId: user.id,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          organizationId: user.organizationId,
          departmentId: user.departmentId,
          roleId: user.roleId,
          roleName: user.role.name,
          roleKey: user.role.key,
          permissions: user.role.permissions.map((rp) => rp.permission.code),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.organizationId = user.organizationId as string;
        token.departmentId = user.departmentId ?? null;
        token.roleId = user.roleId as string;
        token.roleName = user.roleName as string;
        token.roleKey = user.roleKey as string;
        token.permissions = user.permissions ?? [];
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string;
        session.user.departmentId = token.departmentId as string | null;
        session.user.roleId = token.roleId as string;
        session.user.roleName = token.roleName as string;
        session.user.roleKey = token.roleKey as string;
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
  },
});
