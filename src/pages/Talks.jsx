import { Head, Cards, CTA, Page } from "../components/ui";
import { usePageSEO } from "../lib/seo";

export default function Talks() {
  usePageSEO({
    title: "Tech talks and events",
    description: "Tech talks, workshops and mock interview drives for colleges and companies, online or in person.",
    path: "/talks",
  });

  return (
    <>
      <Page>
        <Head title="Tech talks, workshops and mock sessions">
          For colleges and companies. Bring industry mentors to your campus, online or in person.
        </Head>
        <Cards
          items={[
            ["🎤", "Mock tech talk", "An industry mentor presents a technical topic, followed by a student Q&A."],
            ["🧑‍💻", "Mock interview drive", "Run a full batch through 1:1 mock interviews with feedback for every student."],
            ["🏢", "Company-prep class", "A focused class on one company hiring rounds, topics and tips."],
            ["⚡", "Bootcamp", "A multi-day program on DSA, projects or interview skills."],
            ["🎙️", "Podcast and fireside chat", "A conversation with working professionals about careers and placements."],
            ["🌟", "Career and motivation talk", "A speaker session to help students plan their next two years."],
          ]}
        />
        <Head title="How we run a campus session" style={{ margin: "72px 0 40px" }} />
        <div className="steps">
          <div>
            <h3>Share your goals</h3>
            <p>Tell us the batch size, year and what students need.</p>
          </div>
          <div>
            <h3>Choose a format</h3>
            <p>We suggest the session type and matching mentors.</p>
          </div>
          <div>
            <h3>Schedule</h3>
            <p>We fix the date, mode and logistics with your placement cell.</p>
          </div>
          <div>
            <h3>Run and follow up</h3>
            <p>We deliver the session and share feedback for students.</p>
          </div>
        </div>
      </Page>
      <CTA title="Plan a session for your campus" text="Tell us your batch size and goals, and we will suggest a format." />
    </>
  );
}
