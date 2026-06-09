import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { Template } from "@/models";
import { createInvite } from "@/features/invites/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import type { TemplateDoc } from "@/models";

export const metadata: Metadata = { title: "New Invitation — Shubalekha" };
export const dynamic = "force-dynamic";

interface TemplateSelectFormProps {
  templates: (TemplateDoc & { _id: { toString(): string } })[];
}

function TemplateSelectForm({ templates }: TemplateSelectFormProps) {
  async function createFromTemplate(formData: FormData) {
    "use server";
    const templateId = formData.get("templateId") as string;
    const variantKey = (formData.get("variantKey") as string) || "default";
    const user = await requireUser();
    const { inviteId } = await createInvite({ templateId, variantKey, ownerId: user.id });
    redirect(`/invites/${inviteId}/edit`);
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No templates yet</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Templates are coming in Phase 9. Ask an admin to publish one to get started.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {templates.map((tpl) => (
        <form key={tpl._id.toString()} action={createFromTemplate}>
          <input type="hidden" name="templateId" value={tpl._id.toString()} />
          <input type="hidden" name="variantKey" value={tpl.defaultVariantKey ?? "default"} />
          <button
            type="submit"
            className="group w-full rounded-xl border border-border bg-card overflow-hidden text-left hover:shadow-md hover:border-primary/50 transition-all duration-200"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 relative">
              {tpl.previewImage ? (
                <img src={tpl.previewImage} alt={tpl.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🎊</div>
              )}
              {tpl.featured && (
                <div className="absolute top-2 right-2">
                  <Badge className="text-xs">Featured</Badge>
                </div>
              )}
            </div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{tpl.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{tpl.category}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </form>
      ))}
    </div>
  );
}

export default async function NewInvitePage() {
  await requireUser();
  await dbConnect();

  const templates = await Template.find({ status: "published" })
    .sort({ featured: -1, order: 1 })
    .lean() as (TemplateDoc & { _id: { toString(): string } })[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Choose a template</h1>
        <p className="text-muted-foreground mt-1">Pick a design and we&apos;ll set it up for you.</p>
      </div>
      <TemplateSelectForm templates={templates} />
    </div>
  );
}
