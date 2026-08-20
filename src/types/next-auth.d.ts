import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    organizationId?: string;
    departmentId?: string | null;
    roleId?: string;
    roleName?: string;
    roleKey?: string;
    permissions?: string[];
  }

  interface Session {
    user: {
      id: string;
      organizationId: string;
      departmentId: string | null;
      roleId: string;
      roleName: string;
      roleKey: string;
      permissions: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId: string;
    departmentId: string | null;
    roleId: string;
    roleName: string;
    roleKey: string;
    permissions: string[];
  }
}
