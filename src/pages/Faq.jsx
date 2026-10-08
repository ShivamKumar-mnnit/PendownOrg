import { Head, CTA, Page } from "../components/ui";
import { usePageSEO } from "../lib/seo";

const FAQS = [
  ["Is Anobyt free?", "It depends on your college's partnership and the type of session you book. Message us on WhatsApp and we will tell you exactly what applies before you commit."],
  ["How do I book a session?", "Fill the booking form with your name, phone, domain and slot. We confirm over WhatsApp."],
  ["What if I need to reschedule?", "Message us on WhatsApp and we will move your slot. No forms."],
  ["Do I need prior interview experience?", "No. Sessions work for first-timers and experienced candidates alike."],
  ["How are mentors matched to me?", "By the domain you select, so your mentor's background fits your track."],
  ["Is this only for specific colleges?", "No. Any college student can book. Colleges can also onboard whole batches."],
];

export default function Faq() {
  usePageSEO({
    title: "FAQ",
    description: "Answers to common questions about booking, rescheduling and mentor matching on Anobyt.",
    path: "/faq",
  });

  return (
    <>
      <Page narrow={760}>
        <Head title="Frequently asked questions" />
        {FAQS.map(([q, a]) => (
          <details className="faq-item" key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </Page>
      <CTA title="Still have questions?" text="Message us and we will help you pick the right session." />
    </>
  );
}
