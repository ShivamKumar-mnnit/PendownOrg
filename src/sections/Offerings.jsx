import { Video, Users, Code2, FileText } from "lucide-react";
import SectionHeading from "../components/SectionHeading";

const OFFERINGS = [
  {
    icon: Video,
    title: "Mock Interviews",
    desc: "Realistic, company-style interview rounds with structured feedback you can actually act on.",
  },
  {
    icon: Users,
    title: "1:1 Mentorship",
    desc: "Ongoing guidance on resumes, projects, and interview strategy from someone who's done it.",
  },
  {
    icon: Code2,
    title: "Domain-Specific Prep",
    desc: "Practice tailored to SDE, Data Science, Product, Consulting, Cybersecurity & more.",
  },
  {
    icon: FileText,
    title: "Resume Review",
    desc: "Share your resume link when you book — your mentor reviews it before your session.",
  },
];

export default function Offerings() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <SectionHeading
        eyebrow="What You Get"
        title="Everything you need to walk in prepared"
        subtitle="No subscriptions, no long onboarding — just book a session and show up."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {OFFERINGS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-white/20 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
              <Icon className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
