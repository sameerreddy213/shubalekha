"use client";

/**
 * Thin animated wrappers used by the (server-component) homepage.
 * Keeping animation code here means the homepage itself has zero client JS —
 * only these small islands are hydrated, so First Contentful Paint is instant.
 */

import { motion } from "framer-motion";

const ease = [0.23, 1, 0.32, 1] as const;

// ── Generic fade-up wrapper ────────────────────────────────────────────────
export function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Feature card grid ──────────────────────────────────────────────────────
interface Feature {
  icon: React.ReactNode;
  title: string;
  body: string;
}

export function AnimatedFeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          transition={{ duration: 0.55, ease, delay: i * 0.06 }}
          className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            {f.icon}
          </div>
          <h3 className="mt-4 font-medium">{f.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Stats strip ────────────────────────────────────────────────────────────
export function AnimatedStats({
  stats,
}: {
  stats: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 text-center">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease, delay: i * 0.1 }}
          className="flex flex-col"
        >
          <span className="font-display text-3xl font-semibold">{s.value}</span>
          <span className="mt-1 text-sm text-muted-foreground">{s.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
