import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { Template } from "@/models";
import { createInvite } from "@/features/invites/services";
import { Button } from "@/components/ui/button";
import type { TemplateDoc } from "@/models";

export const metadata: Metadata = { title: "New Invitation" };
export const dynamic = "force-dynamic";

// ── Palette preview ────────────────────────────────────────────────────────

function PalettePreview({
  palette,
}: {
  palette: { bg: string; surface: string; primary: string; accent: string } | undefined;
}) {
  const p = palette ?? { bg: "#f5f5f5", surface: "#ebebeb", primary: "#1a1a1a", accent: "#e07b00" };
  return (
    <div
      className="relative flex h-36 w-full items-end overflow-hidden"
      style={{ backgroundColor: p.bg }}
    >
      {/* Abstract shapes */}
      <div
        className="absolute right-4 top-4 h-14 w-14 rounded-full opacity-25"
        style={{ backgroundColor: p.accent }}
      />
      <div
        className="absolute left-3 top-8 h-5 w-16 rounded-full opacity-20"
        style={{ backgroundColor: p.primary }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-x-0 bottom-0 h-14"
        style={{
          background: `linear-gradient(to top, ${p.surface} 40%, transparent)`,
        }}
      />
    </div>
  );
}

// ── Template card ──────────────────────────────────────────────────────────

function TemplateCard({
  tpl,
  preselected,
  action,
}: {
  tpl: TemplateDoc & { _id: { toString(): string } };
  preselected: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  const defaultVariant = (
    tpl.variants as Array<{
      key: string;
      name: string;
      theme?: { palette?: { bg: string; surface: string; primary: string; accent: string } };
    }>
  ).find((v) => v.key === (tpl.defaultVariantKey ?? "default")) ?? (tpl.variants as Array<{ key: string; name: string; theme?: { palette?: { bg: string; surface: string; primary: string; accent: string } } }>).at(0);

  return (
    <form action={action}>
      <input type="hidden" name="templateId" value={tpl._id.toString()} />
      <input
        type="hidden"
        name="variantKey"
        value={tpl.defaultVariantKey ?? "default"}
      />
      <button
        type="submit"
        className={`group w-full overflow-hidden rounded-xl border bg-card text-left
                    shadow-[0_1px_3px_rgba(0,0,0,0.07)]
                    transition-[transform,box-shadow,border-color]
                    duration-200
                    ease-[cubic-bezier(0.23,1,0.32,1)]
                    hover:-translate-y-1
                    hover:border-primary/50
                    hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]
                    active:scale-[0.98]
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-primary/60
                    ${preselected ? "ring-2 ring-primary border-primary" : "border-border/60"}`}
      >
        <PalettePreview palette={defaultVariant?.theme?.palette} />
        <div className="flex items-start justify-between p-3">
          <div className="min-w-0">
            {preselected && (
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-primary">
                Pre-selected
              </span>
            )}
            <p className="truncate text-sm font-medium text-foreground">
              {tpl.name}
            </p>
            <p className="text-xs capitalize text-muted-foreground">
              {String(tpl.category).replace("-", " ")}
            </p>
          </div>
          <ArrowRight
            className="mt-0.5 size-4 shrink-0 text-muted-foreground
                       transition-colors group-hover:text-primary"
          />
        </div>
      </button>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function NewInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  await requireUser();
  await dbConnect();
  const { template: preselectedSlug } = await searchParams;

  async function createFromTemplate(formData: FormData) {
    "use server";
    const templateId = formData.get("templateId") as string;
    const variantKey = (formData.get("variantKey") as string) || "default";
    const user = await requireUser();
    const { inviteId } = await createInvite({ templateId, variantKey, ownerId: user.id });
    redirect(`/invites/${inviteId}/edit`);
  }

  const templates = (await Template.find({ status: "published" })
    .sort({ featured: -1, order: 1 })
    .lean()) as (TemplateDoc & { _id: { toString(): string } })[];

  if (templates.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <Sparkles className="mx-auto size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No templates yet</h2>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          Run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            npm run seed-templates
          </code>{" "}
          to load the launch templates.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  // Put the pre-selected template first if the user arrived from the marketing page
  const sorted = preselectedSlug
    ? [
        ...templates.filter((t) => t.slug === preselectedSlug),
        ...templates.filter((t) => t.slug !== preselectedSlug),
      ]
    : templates;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Choose a template</h1>
        <p className="mt-1 text-muted-foreground">
          Pick a design — you can change everything after.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((tpl) => (
          <TemplateCard
            key={tpl._id.toString()}
            tpl={tpl}
            preselected={tpl.slug === preselectedSlug}
            action={createFromTemplate}
          />
        ))}
      </div>
    </div>
  );
}
