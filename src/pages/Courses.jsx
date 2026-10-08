import { Head, CTA, Page } from "../components/ui";
import { usePageSEO } from "../lib/seo";

const COURSES = [
  ["Free", 24, "Programming Foundations", "1st year", "Pick a language, learn syntax and control flow, and practice until a blank editor stops being scary."],
  ["Premium", 120, "DSA Mastery", "2nd to 3rd year", "Arrays to graphs to DP, with a problem set mapped to real company questions."],
  ["Premium", 90, "Full Stack Development", "3rd year", "Build and ship a real product: frontend, backend, database and deployment."],
  ["Premium", 60, "AI/ML Essentials", "3rd year", "Enough ML to hold your own in interviews and build an intelligent feature."],
  ["Free", 40, "CS Fundamentals", "All years", "OS, DBMS, CN and OOP, the four subjects that show up in most interviews."],
  ["Free", 35, "Aptitude and Reasoning", "Final year", "The round that eliminates the most people, and the easiest to fix with practice."],
  ["Premium", 30, "System Design", "Final year", "Caching, load balancing, databases and trade-offs."],
  ["Premium", 200, "Company Preparation Bundle", "Final year", "Company vault pages, past-question sets and mock tests in one track."],
];

export default function Courses() {
  usePageSEO({
    title: "Courses",
    description: "Free and premium learning tracks for every year of college, from programming foundations to company preparation.",
    path: "/courses",
  });

  return (
    <>
      <Page>
        <Head title="Free and premium learning tracks">Free content gets you started. Premium gets you placed.</Head>
        <div className="cards">
          {COURSES.map(([tier, lessons, title, year, text]) => (
            <div className="card" key={title}>
              <div className="meta">
                <span className={`tag${tier === "Free" ? " free" : ""}`}>{tier}</span>
                <small>{lessons} lessons</small>
              </div>
              <h3>{title}</h3>
              <small style={{ color: "var(--color-accent)", fontWeight: 600 }}>{year}</small>
              <p style={{ marginTop: 10 }}>{text}</p>
            </div>
          ))}
        </div>
      </Page>
      <CTA title="Start learning today" text="Ask us which track fits your year." />
    </>
  );
}
