import { Head, Cards, CTA, Page } from "../components/ui";
import { usePageSEO } from "../lib/seo";

const STAGES = [
  ["Build your profile", "One-page resume, GitHub and LinkedIn, and two solid projects."],
  ["Online assessment", "Aptitude, reasoning and coding rounds that filter the first batch."],
  ["Group discussion", "Used by some companies to check communication and teamwork."],
  ["Technical interview", "Projects, core subjects and problem solving."],
  ["HR interview", "Motivation, communication, relocation and joining details."],
  ["Offer and onboarding", "Documents, joining date and pre-joining training."],
];

const RESUME = [
  "Keep it to one page and save it as a PDF",
  "Lead with projects and skills if you have no work experience",
  "Describe what you built and the result, with numbers where you can",
  "Add working GitHub and LinkedIn links",
  "Proofread for spelling and consistent formatting",
];

const HR = [
  "Tell me about yourself",
  "Why do you want to join this company?",
  "What are your strengths and weaknesses?",
  "Describe a challenge you faced and how you handled it",
  "Where do you see yourself in five years?",
  "Are you willing to relocate?",
];

export default function Placement() {
  usePageSEO({
    title: "Placement guide",
    description: "Everything students need for campus placements, from the first resume to the offer letter.",
    path: "/placement",
  });

  return (
    <>
      <Page>
        <Head title="Placement guide">Everything students need for campus placements, from the first resume to the offer letter.</Head>
        <div className="steps">
          {STAGES.map(([title, text]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <Head title="What to prepare" style={{ margin: "72px 0 24px" }} />
        <Cards
          items={[
            ["🧮", "Aptitude", "Quantitative ability, logical reasoning and verbal ability. Practice under time pressure."],
            ["💻", "Coding and DSA", "Arrays, strings, recursion, trees, graphs and dynamic programming."],
            ["🖥️", "CS fundamentals", "OS, DBMS, computer networks and OOP, the subjects interviewers return to."],
            ["🗣️", "Communication", "Self-introduction, group discussion and clear explanations of your projects."],
          ]}
        />

        <div className="tools" style={{ marginTop: 56 }}>
          <div className="panel">
            <h3 style={{ fontSize: 20 }}>Resume checklist</h3>
            <ul className="ck">
              {RESUME.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3 style={{ fontSize: 20 }}>Common HR questions</h3>
            <ul className="ck">
              {HR.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </div>

        <Head title="Group discussion tips" style={{ margin: "72px 0 24px" }} />
        <Cards
          items={[
            ["🎙️", "Open with a point", "Start with a clear stance or definition rather than waiting for others."],
            ["👂", "Listen and build", "Refer to what others said, then add to it."],
            ["⏱️", "Be concise", "Two or three crisp points beat a long monologue."],
            ["🏁", "Close well", "Summarise the discussion if you get the chance."],
          ]}
        />
      </Page>
      <CTA title="Prepare with a real mentor" text="Book a mock interview and get feedback on your answers." />
    </>
  );
}
