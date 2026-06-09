import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">About {siteConfig.name}</h1>
      <div className="prose mt-6 space-y-4 text-muted-foreground">
        <p>
          {siteConfig.name} is a premium digital invitation platform built for the way India
          celebrates. Choose a beautiful template, make it yours, and share a live invitation
          website with everyone you love — on your own link, completely free.
        </p>
        <p>
          From weddings and engagements to birthdays, housewarmings and naming ceremonies, every
          template is mobile-first, fast, and designed to feel unforgettable.
        </p>
      </div>
    </div>
  );
}
