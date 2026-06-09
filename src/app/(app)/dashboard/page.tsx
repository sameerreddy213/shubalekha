import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText, Send, Clock } from "lucide-react";
import { currentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Hi {firstName} 👋</h1>
          <p className="mt-1 text-muted-foreground">Your invitations live here.</p>
        </div>
        <Button asChild size="pill">
          <Link href="/invites/new">
            <Plus /> Create invitation
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<FileText className="size-5" />} label="Drafts" value="0" />
        <StatCard icon={<Send className="size-5" />} label="Published" value="0" />
        <StatCard icon={<Clock className="size-5" />} label="Expired" value="0" />
      </div>

      <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
        <h2 className="font-display text-xl font-medium">No invitations yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Browse our templates and publish your first beautiful invitation in minutes. (The editor
          and template gallery arrive in Phase 8 &amp; 9.)
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/templates">Browse templates</Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
