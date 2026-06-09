import "server-only";
import { unstable_cache } from "next/cache";
import { dbConnect } from "@/lib/db/connect";
import { Template } from "@/models";
import type { TemplateDoc } from "@/models/Template";
import type { TemplateCategory } from "@/types/invite";

export interface TemplateListItem {
  _id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  featured: boolean;
  order: number;
  defaultVariantKey: string;
  variants: Array<{
    key: string;
    name: string;
    theme: {
      palette: {
        bg: string;
        surface: string;
        primary: string;
        accent: string;
        text: string;
        muted: string;
      };
      animationPreset: string;
    };
    previewImage: string;
  }>;
  previewImage?: string;
}

async function _listTemplates(category?: string): Promise<TemplateListItem[]> {
  await dbConnect();
  const filter: Record<string, unknown> = { status: "published" };
  if (category && category !== "all") filter.category = category;

  const docs = await Template.find(filter)
    .select("-sections") // gallery doesn't need the full section schema
    .sort({ featured: -1, order: 1 })
    .limit(60)
    .lean();

  return (docs as unknown as Array<TemplateDoc & { _id: { toString(): string } }>).map((d) => ({
    _id: d._id.toString(),
    slug: d.slug,
    name: d.name,
    description: d.description ?? "",
    category: d.category as TemplateCategory,
    tags: d.tags ?? [],
    featured: d.featured ?? false,
    order: d.order ?? 0,
    defaultVariantKey: d.defaultVariantKey ?? "default",
    variants: (d.variants ?? []).map((v) => {
      const p = v.theme?.palette;
      return {
        key: v.key,
        name: v.name,
        theme: {
          palette: {
            bg: p?.bg ?? "#ffffff",
            surface: p?.surface ?? "#f5f5f5",
            primary: p?.primary ?? "#1a1a1a",
            accent: p?.accent ?? "#e07b00",
            text: p?.text ?? "#0a0a0a",
            muted: p?.muted ?? "#888888",
          },
          animationPreset: v.theme?.animationPreset ?? "reveal-soft",
        },
        previewImage: v.previewImage ?? "",
      };
    }),
    previewImage: d.previewImage ?? undefined,
  }));
}

export const listTemplates = unstable_cache(
  _listTemplates,
  ["templates-list"],
  { tags: ["templates"], revalidate: 300 },
);

async function _getTemplateBySlug(slug: string): Promise<(TemplateDoc & { _id: { toString(): string } }) | null> {
  await dbConnect();
  const doc = await Template.findOne({ slug, status: "published" }).lean();
  return doc as unknown as (TemplateDoc & { _id: { toString(): string } }) | null;
}

export const getTemplateBySlug = unstable_cache(
  _getTemplateBySlug,
  ["template-by-slug"],
  { tags: ["templates"], revalidate: 300 },
);

export async function listAllCategories(): Promise<string[]> {
  await dbConnect();
  const cats = await Template.distinct("category", { status: "published" });
  return cats as string[];
}
