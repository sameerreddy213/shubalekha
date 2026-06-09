"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { TemplateListItem } from "@/features/templates/services";

// ── Category label map ─────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  hindu: "Hindu Wedding",
  "south-indian": "South Indian",
  muslim: "Muslim / Nikah",
  christian: "Christian",
  sikh: "Sikh",
  engagement: "Engagement",
  reception: "Reception",
  housewarming: "Housewarming",
  birthday: "Birthday",
  "baby-shower": "Baby Shower",
  anniversary: "Anniversary",
  naming: "Naming Ceremony",
  corporate: "Corporate",
  "save-the-date": "Save the Date",
  other: "Other",
};

// ── Colour preview block ───────────────────────────────────────────────────

function ColourPreview({
  palette,
  name,
  featured,
}: {
  palette: { bg: string; surface: string; primary: string; accent: string; muted: string };
  name: string;
  featured: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col justify-end overflow-hidden rounded-t-xl ${
        featured ? "h-52" : "h-40"
      }`}
      style={{ backgroundColor: palette.bg }}
    >
      {/* Decorative abstract shapes — suggest a design without fake UI */}
      <div
        className="absolute right-5 top-5 rounded-full opacity-25 transition-transform
                   duration-300 ease-out group-hover:scale-110"
        style={{
          width: featured ? 80 : 56,
          height: featured ? 80 : 56,
          backgroundColor: palette.accent,
        }}
      />
      <div
        className="absolute left-4 top-10 h-6 w-20 rounded-full opacity-20"
        style={{ backgroundColor: palette.primary }}
      />
      <div
        className="absolute bottom-10 right-8 h-4 w-14 rounded-full opacity-15"
        style={{ backgroundColor: palette.primary }}
      />

      {/* Bottom surface gradient + name */}
      <div
        className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-10"
        style={{
          background: `linear-gradient(to top, ${palette.surface} 40%, transparent)`,
        }}
      >
        <p
          className="line-clamp-1 font-display text-sm font-semibold"
          style={{ color: palette.primary }}
        >
          {name}
        </p>
      </div>

      {/* Featured badge */}
      {featured && (
        <div className="absolute left-3 top-3">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: palette.accent,
              color: palette.bg,
            }}
          >
            Featured
          </span>
        </div>
      )}
    </div>
  );
}

// ── Variant palette strip ──────────────────────────────────────────────────

function PaletteStrip({
  palette,
  label,
}: {
  palette: { bg: string; primary: string; accent: string; muted: string };
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full">
        <span className="flex-[3]" style={{ backgroundColor: palette.bg }} />
        <span className="flex-[2]" style={{ backgroundColor: palette.primary }} />
        <span className="flex-[2]" style={{ backgroundColor: palette.accent }} />
        <span className="flex-[1]" style={{ backgroundColor: palette.muted }} />
      </div>
      <span className="w-28 shrink-0 truncate text-[10px] text-muted-foreground/60">
        {label}
      </span>
    </div>
  );
}

// ── Main card ──────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: TemplateListItem;
  index: number;
}

export function TemplateCard({ template, index }: TemplateCardProps) {
  const activeVariant =
    template.variants.find((v) => v.key === template.defaultVariantKey) ??
    template.variants.at(0);

  if (!activeVariant) return null;

  const { palette } = activeVariant.theme;
  const categoryLabel = CATEGORY_LABELS[template.category] ?? template.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.5,
        // Cap stagger at 8 so late-page cards don't wait forever
        delay: (index % 8) * 0.055,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <Link
        href={`/templates/${template.slug}`}
        className="group block"
        aria-label={`Open ${template.name} template`}
      >
        <article
          className="overflow-hidden rounded-xl border border-border/60 bg-card
                     shadow-[0_1px_3px_rgba(0,0,0,0.07)]
                     transition-[transform,box-shadow]
                     duration-200
                     ease-[cubic-bezier(0.23,1,0.32,1)]
                     hover:-translate-y-1
                     hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]
                     active:scale-[0.98]"
        >
          <ColourPreview
            palette={palette}
            name={template.name}
            featured={template.featured}
          />

          {/* Body */}
          <div className="px-4 pb-4 pt-3">
            <span className="mb-1.5 inline-block rounded-full bg-muted px-2.5 py-0.5
                            text-[11px] font-medium text-muted-foreground">
              {categoryLabel}
            </span>

            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {template.description}
            </p>

            {/* Palette strips for all variants */}
            {template.variants.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {template.variants.slice(0, 2).map((v) => (
                  <PaletteStrip
                    key={v.key}
                    palette={v.theme.palette}
                    label={v.name}
                  />
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-4">
              <span
                className="block w-full rounded-lg border border-border bg-background
                           py-2 text-center text-xs font-medium text-foreground
                           transition-colors duration-150
                           group-hover:border-primary group-hover:bg-primary
                           group-hover:text-primary-foreground"
              >
                Use this template
              </span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
