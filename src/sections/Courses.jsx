import { GraduationCap, BookOpen } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const COURSES = [
  {
    tier: "free",
    lessons: 24,
    title: "Programming Foundations",
    year: "1st Year",
    desc: "Pick a language and get fluent. Syntax, control flow, functions, and enough practice to stop fearing a blank editor.",
  },
  {
    tier: "premium",
    lessons: 120,
    title: "DSA Mastery",
    year: "2nd–3rd Year",
    desc: "The single highest-return thing you can study. Arrays to graphs to DP, with a problem set mapped to real company questions.",
  },
  {
    tier: "premium",
    lessons: 90,
    title: "Full Stack Development",
    year: "3rd Year",
    desc: "Build and ship a real product. Frontend, backend, database and deployment — the project that carries your resume.",
  },
  {
    tier: "premium",
    lessons: 60,
    title: "AI/ML Essentials",
    year: "3rd Year",
    desc: "Enough ML to hold your own in a technical interview and build an intelligent feature, without the maths rabbit hole.",
  },
  {
    tier: "free",
    lessons: 40,
    title: "CS Fundamentals Crash Course",
    year: "All Years",
    desc: "OS, DBMS, CN and OOP — the four subjects that show up in almost every service-company technical MCQ round.",
  },
  {
    tier: "free",
    lessons: 35,
    title: "Aptitude & Reasoning",
    year: "Final Year",
    desc: "The round that eliminates the most people, and the easiest one to fix with two weeks of deliberate practice.",
  },
  {
    tier: "premium",
    lessons: 30,
    title: "System Design",
    year: "Final Year",
    desc: "How to talk about scale. Caching, load balancing, databases and trade-offs — the differentiator for product companies.",
  },
  {
    tier: "premium",
    lessons: 200,
    title: "Company Preparation Bundle",
    year: "Final Year",
    desc: "Every company vault page, past-question set and mock test in one track. Drill the exact pattern before you walk in.",
  },
];

function CourseCard({ course }) {
  const isPremium = course.tier === "premium";
  return (
    <StaggerItem
      className={`flex h-full flex-col rounded-2xl border p-6 ${
        isPremium
          ? "border-(--color-accent)/30 bg-(--color-accent)/5"
          : "border-(--color-border) bg-(--color-card)"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
            isPremium
              ? "bg-(--color-accent)/15 text-(--color-accent)"
              : "bg-(--color-accent-emerald)/15 text-(--color-accent-emerald)"
          }`}
        >
          {isPremium ? <BookOpen className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
          {isPremium ? "Premium" : "Free"}
        </span>
        <div className="text-right">
          <p className="text-xl font-extrabold text-(--color-fg)">{course.lessons}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-(--color-fg-faint)">Lessons</p>
        </div>
      </div>

      <h3 className="mt-4 text-base font-bold text-(--color-fg)">{course.title}</h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-(--color-accent)">{course.year}</p>
      <p className="mt-3 text-sm text-(--color-fg-muted)">{course.desc}</p>
    </StaggerItem>
  );
}

export default function Courses() {
  return (
    <section className="border-y border-(--color-border)">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Courses"
            title="Free + Premium learning tracks"
            subtitle="Everything you need — programming to system design. Free content gets you started; premium gets you placed."
          />
        </Reveal>

        <StaggerGrid className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {COURSES.map((course) => (
            <CourseCard key={course.title} course={course} />
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
