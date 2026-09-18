import { Code2, Database, BrainCircuit, Briefcase, ShieldCheck, LineChart, MoreHorizontal } from "lucide-react";

// Single source of truth for domain options — used by the booking form
// dropdown and the homepage "Domains" grid.
export const DOMAINS = [
  {
    id: "sde",
    label: "Software Development (SDE)",
    blurb: "DSA, system design & coding rounds for product/service companies.",
    icon: Code2,
  },
  {
    id: "data-ai-ml",
    label: "Data Science & AI/ML",
    blurb: "ML fundamentals, case studies & applied stats interviews.",
    icon: BrainCircuit,
  },
  {
    id: "core-cs-dsa",
    label: "Core CS & DSA",
    blurb: "Pure problem-solving rounds — arrays to graphs to DP.",
    icon: Database,
  },
  {
    id: "product-management",
    label: "Product Management",
    blurb: "Product sense, metrics & guesstimate style mock rounds.",
    icon: LineChart,
  },
  {
    id: "consulting-case-prep",
    label: "Consulting & Case Prep",
    blurb: "Case interviews & structured problem-solving practice.",
    icon: Briefcase,
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity",
    blurb: "Security fundamentals, scenario-based interview rounds.",
    icon: ShieldCheck,
  },
  {
    id: "other",
    label: "Other",
    blurb: "Not sure, or something else? Tell us in your message.",
    icon: MoreHorizontal,
  },
];

export const DOMAIN_LABELS = DOMAINS.map((d) => d.label);
