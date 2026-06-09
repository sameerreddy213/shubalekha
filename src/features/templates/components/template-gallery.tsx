"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateCard } from "./template-card";
import type { TemplateListItem } from "@/features/templates/services";
import type { TemplateCategory } from "@/types/invite";

// ── Filter config ──────────────────────────────────────────────────────────

const ALL_FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All" },
  { key: "hindu", label: "Hindu Wedding" },
  { key: "south-indian", label: "South Indian" },
  { key: "muslim", label: "Muslim / Nikah" },
  { key: "christian", label: "Christian" },
  { key: "sikh", label: "Sikh" },
  { key: "engagement", label: "Engagement" },
  { key: "birthday", label: "Birthday" },
  { key: "save-the-date", label: "Save the Date" },
  { key: "anniversary", label: "Anniversary" },
  { key: "baby-shower", label: "Baby Shower" },
  { key: "housewarming", label: "Housewarming" },
  { key: "corporate", label: "Corporate" },
  { key: "other", label: "Other" },
];

// ── Filter chip ────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                  active:scale-[0.97]
                  ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
    >
      {label}
    </button>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────

interface TemplateGalleryProps {
  templates: TemplateListItem[];
  activeCategories: string[];
}

export function TemplateGallery({ templates, activeCategories }: TemplateGalleryProps) {
  const [active, setActive] = useState<string>("all");
  const [, startTransition] = useTransition();

  // Filter client-side from the server-fetched set
  const visible =
    active === "all"
      ? templates
      : templates.filter((t) => t.category === (active as TemplateCategory));

  const filters = ALL_FILTERS.filter(
    (f) => f.key === "all" || activeCategories.includes(f.key),
  );

  function handleFilter(key: string) {
    startTransition(() => setActive(key));
  }

  return (
    <div>
      {/* Filter chips — horizontal scroll on mobile */}
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        role="group"
        aria-label="Filter templates by category"
      >
        {filters.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            active={active === f.key}
            onClick={() => handleFilter(f.key)}
          />
        ))}
      </div>

      {/* Result count */}
      <p className="mt-5 text-sm text-muted-foreground">
        {visible.length === templates.length
          ? `${templates.length} templates`
          : `${visible.length} of ${templates.length} templates`}
      </p>

      {/* Grid — asymmetric: 2 cols mobile, 3 cols md, 4 cols xl */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {visible.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {visible.map((template, i) => (
                <TemplateCard key={template.slug} template={template} index={i} />
              ))}
            </div>
          ) : (
            <div className="mt-16 text-center">
              <p className="text-muted-foreground">No templates in this category yet.</p>
              <button
                type="button"
                onClick={() => handleFilter("all")}
                className="mt-3 text-sm text-primary underline-offset-4 hover:underline"
              >
                View all templates
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
