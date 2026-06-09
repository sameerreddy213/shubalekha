import type { Metadata } from "next";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  Eye, EyeOff, Star, StarOff,
  ChevronUp, ChevronDown, ExternalLink,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { dbConnect } from "@/lib/db/connect";
import { Template } from "@/models";
import { listAdminTemplates } from "@/features/admin/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin — Templates" };
export const dynamic = "force-dynamic";

// ── Server actions ────────────────────────────────────────────────────────

async function toggleStatus(formData: FormData) {
  "use server";
  await requireRole("admin");
  await dbConnect();
  const id = formData.get("templateId") as string;
  const current = formData.get("currentStatus") as string;
  const next = current === "published" ? "draft" : "published";
  await Template.updateOne({ _id: id }, { $set: { status: next } });
  revalidateTag("templates");
  revalidatePath("/admin/templates");
}

async function toggleFeatured(formData: FormData) {
  "use server";
  await requireRole("admin");
  await dbConnect();
  const id = formData.get("templateId") as string;
  const current = formData.get("currentFeatured") === "true";
  await Template.updateOne({ _id: id }, { $set: { featured: !current } });
  revalidateTag("templates");
  revalidatePath("/admin/templates");
}

async function shiftOrder(formData: FormData) {
  "use server";
  await requireRole("admin");
  await dbConnect();
  const id = formData.get("templateId") as string;
  const direction = formData.get("direction") as "up" | "down";
  const delta = direction === "up" ? -1 : 1;
  // Swap orders with adjacent template
  const target = await Template.findById(id).select("order").lean() as { order?: number } | null;
  if (!target) return;
  const currentOrder = target.order ?? 0;
  const adjacent = await Template.findOne({
    order: currentOrder + delta,
  }).select("_id order").lean() as { _id: unknown; order?: number } | null;
  if (adjacent) {
    await Promise.all([
      Template.updateOne({ _id: id }, { $set: { order: currentOrder + delta } }),
      Template.updateOne({ _id: adjacent._id }, { $set: { order: currentOrder } }),
    ]);
  } else {
    await Template.updateOne({ _id: id }, { $inc: { order: delta } });
  }
  revalidateTag("templates");
  revalidatePath("/admin/templates");
}

// ── Page ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  hindu: "Hindu",
  "south-indian": "South Indian",
  muslim: "Muslim",
  christian: "Christian",
  sikh: "Sikh",
  engagement: "Engagement",
  reception: "Reception",
  housewarming: "Housewarming",
  birthday: "Birthday",
  "baby-shower": "Baby Shower",
  anniversary: "Anniversary",
  naming: "Naming",
  corporate: "Corporate",
  "save-the-date": "Save the Date",
  other: "Other",
};

export default async function AdminTemplatesPage() {
  await requireRole("admin");
  const templates = await listAdminTemplates();

  const published = templates.filter((t) => t.status === "published").length;
  const drafts = templates.filter((t) => t.status === "draft").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {published} published · {drafts} drafts · {templates.length} total
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/templates" target="_blank" rel="noopener noreferrer" className="flex gap-1.5 items-center">
            <ExternalLink className="size-4" />
            View public gallery
          </a>
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8">#</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Template</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Sections</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Variants</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Updated</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {templates.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No templates found. Run{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    npm run seed-templates
                  </code>
                  .
                </td>
              </tr>
            ) : (
              templates.map((tpl, idx) => (
                <tr key={tpl._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{tpl.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {tpl.featured && (
                        <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                      )}
                      <div>
                        <div className="font-medium">{tpl.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{tpl.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {CATEGORY_LABELS[tpl.category] ?? tpl.category}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tpl.status === "published" ? "default" : "secondary"}>
                      {tpl.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {tpl.sectionCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {tpl.variantCount}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(tpl.updatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {/* Reorder */}
                      <form action={shiftOrder}>
                        <input type="hidden" name="templateId" value={tpl._id} />
                        <input type="hidden" name="direction" value="up" />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          title="Move up"
                          className="size-8"
                          disabled={idx === 0}
                        >
                          <ChevronUp className="size-3.5" />
                        </Button>
                      </form>
                      <form action={shiftOrder}>
                        <input type="hidden" name="templateId" value={tpl._id} />
                        <input type="hidden" name="direction" value="down" />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          title="Move down"
                          className="size-8"
                          disabled={idx === templates.length - 1}
                        >
                          <ChevronDown className="size-3.5" />
                        </Button>
                      </form>

                      {/* Featured toggle */}
                      <form action={toggleFeatured}>
                        <input type="hidden" name="templateId" value={tpl._id} />
                        <input type="hidden" name="currentFeatured" value={String(tpl.featured)} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          title={tpl.featured ? "Remove from featured" : "Mark as featured"}
                          className="size-8"
                        >
                          {tpl.featured ? (
                            <StarOff className="size-3.5 text-amber-500" />
                          ) : (
                            <Star className="size-3.5" />
                          )}
                        </Button>
                      </form>

                      {/* Publish toggle */}
                      <form action={toggleStatus}>
                        <input type="hidden" name="templateId" value={tpl._id} />
                        <input type="hidden" name="currentStatus" value={tpl.status} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          title={tpl.status === "published" ? "Unpublish" : "Publish"}
                          className="size-8"
                        >
                          {tpl.status === "published" ? (
                            <EyeOff className="size-3.5 text-muted-foreground" />
                          ) : (
                            <Eye className="size-3.5 text-primary" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: run{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">npm run seed-templates</code>
        {" "}to upsert all 22 launch templates.
      </p>
    </div>
  );
}
