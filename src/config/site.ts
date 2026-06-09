import { env, ROOT_DOMAIN } from "@/lib/env";

export const siteConfig = {
  name: "Shubalekha",
  tagline: "Create Beautiful Invitations That Guests Never Forget.",
  description:
    "Shubalekha is a premium digital invitation platform. Choose a template, customise it, " +
    "and publish a beautiful invitation website on your own link — free.",
  url: env.NEXT_PUBLIC_APP_URL,
  rootDomain: ROOT_DOMAIN,
  ogImage: "/og-default.png",
  contactEmail: "hello@shubalekha.com",
  social: {
    instagram: "https://instagram.com/shubalekha",
  },
} as const;

/** Build the public URL for a published invitation slug. */
export function inviteUrl(slug: string): string {
  const proto = env.NEXT_PUBLIC_APP_URL.startsWith("https") ? "https" : "http";
  return `${proto}://${slug}.${env.NEXT_PUBLIC_ROOT_DOMAIN}`;
}
