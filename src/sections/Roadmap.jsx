import { CheckCircle2 } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";

const STEPS = [
  "Programming",
  "DSA",
  "Full Stack",
  "Projects",
  "AI/ML",
  "CS Fundamentals",
  "Aptitude",
  "Resume",
  "Company Preparation",
  "Mock Interviews",
  "Placement Ready",
];

const YEARS = [
  {
    year: "Year 01",
    label: "1st Year",
    title: "Programming & Fundamentals",
    blurb:
      "Build the base. The students who crack placements later are the ones who stopped memorizing syntax and started solving problems now.",
    items: ["C / C++ Basics", "Python Foundations", "Java Fundamentals", "OOP Concepts", "Logic Building & Patterns", "Intro to Problem Solving"],
  },
  {
    year: "Year 02",
    label: "2nd Year",
    title: "DSA, OOP, SQL & Development",
    blurb:
      "The year that decides your shortlist. DSA depth here is what separates an offer from a rejection two years later.",
    items: ["Data Structures (Arrays to Trees)", "Basic Algorithms", "OOP in Depth", "DBMS & SQL", "Frontend + Backend Basics", "LeetCode Practice Track"],
  },
  {
    year: "Year 03",
    label: "3rd Year",
    title: "Advanced DSA, Full Stack, Projects, AI/ML & System Design",
    blurb:
      "Turn skill into proof. Recruiters read your projects before they read your CGPA — this is where you build things worth talking about.",
    items: ["Advanced DSA (Graphs, DP)", "Full Stack Project", "AI/ML Essentials", "System Design Basics", "OS / CN / DBMS Core", "Open Source Contribution"],
  },
  {
    year: "Year 04",
    label: "Final Year",
    title: "Company Preparation, Tests & Interviews",
    blurb:
      "Execution season. Same skill, different outcome — the students who drill company-specific patterns convert far more interviews.",
    items: ["Aptitude & Reasoning", "Company-Specific Prep", "Resume Review", "Mock Tests", "Mock Interviews", "Placement Ready"],
  },
];

export default function Roadmap() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <SectionHeading
          eyebrow="The Ascent Engine"
          title="From 1st Year to Dream Placement"
          subtitle="A clear 11-step progression — divided by academic year so you always know what to do next."
        />
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-card) px-4 py-2 text-xs font-semibold text-(--color-fg)">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--color-accent)/15 text-[10px] font-bold text-(--color-accent)">
                  {i + 1}
                </span>
                {step}
              </span>
              {i < STEPS.length - 1 && <span className="text-(--color-fg-faint)">&rarr;</span>}
            </div>
          ))}
        </div>
      </Reveal>

      <div className="relative mt-14 space-y-8 border-l border-(--color-border) pl-8 sm:pl-10">
        {YEARS.map((y, i) => (
          <Reveal key={y.year} delay={0.06 * i}>
            <div className="relative rounded-2xl border border-(--color-border) bg-(--color-card) p-6 sm:p-8">
              <span className="absolute -left-[2.55rem] top-7 flex h-8 w-8 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-[11px] font-bold text-(--color-accent) sm:-left-[3.05rem]">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-(--color-accent)/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-(--color-accent)">
                  {y.year}
                </span>
                <span className="text-xs font-semibold text-(--color-fg-muted)">{y.label}</span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-(--color-fg) sm:text-2xl">{y.title}</h3>
              <p className="mt-2 max-w-3xl text-sm text-(--color-fg-muted)">{y.blurb}</p>

              <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {y.items.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-sm text-(--color-fg)">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-(--color-accent-emerald)" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
