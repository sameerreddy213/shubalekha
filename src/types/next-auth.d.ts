import type { DefaultSession } from "next-auth";

/** Augment the session/user with our app fields (id, role, status). */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "user" | "admin";
      status: "active" | "disabled";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "user" | "admin";
    status?: "active" | "disabled";
  }
}
