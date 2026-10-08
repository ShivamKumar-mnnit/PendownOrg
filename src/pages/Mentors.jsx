import { Head, Cards, CTA, Page } from "../components/ui";
import { usePageSEO } from "../lib/seo";

export default function Mentors() {
  usePageSEO({
    title: "Mentors",
    description: "Every Anobyt booking goes to a mentor whose background fits the domain you pick: SDE, Data / AI, Product or Consulting.",
    path: "/mentors",
  });

  return (
    <>
      <Page>
        <Head title="Matched to a mentor in your domain">
          Every booking goes to a mentor whose background fits the domain you pick. No random queue.
        </Head>
        <Cards
          items={[
            ["💻", "SDE mentor", "Working engineers at product and service companies. Coding and system design rounds."],
            ["🧠", "Data / AI mentor", "Practitioners in ML and data science running applied technical rounds."],
            ["📊", "Product mentor", "Product managers covering product sense, metrics and estimation."],
            ["🧩", "Consulting mentor", "Case-interview practitioners who teach structured problem solving."],
          ]}
        />
        <Head title="What happens after your session" style={{ marginTop: 72 }} />
        <Cards
          items={[
            ["📄", "Resume review included", "Your mentor reviews your resume before the session."],
            ["🗓️", "Easy rescheduling", "Message us on WhatsApp and we move your slot."],
            ["💬", "Follow-up support", "Our WhatsApp line stays open after the session."],
            ["📚", "Pointers for next time", "Feedback comes with what to practice next."],
            ["🏅", "Certificate", "Get an Anobyt certificate of completion."],
          ]}
        />
      </Page>
      <CTA title="Meet your mentor" text="Pick your domain and book a session." />
    </>
  );
}
