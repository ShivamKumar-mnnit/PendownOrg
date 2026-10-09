import { Head, CTA, Page } from "../components/ui";
import { usePageSEO } from "../lib/seo";
import { useCollection } from "../lib/contentApi";

export default function Faq() {
  usePageSEO({
    title: "FAQ",
    description: "Answers to common questions about booking, rescheduling and mentor matching on Anobyt.",
    path: "/faq",
  });
  const { items } = useCollection("faqs");

  return (
    <>
      <Page narrow={760}>
        <Head eyebrow="FAQ" title="Frequently asked questions" />
        {items.map((f) => (
          <details className="faq-item" key={f.id}>
            <summary>{f.q}</summary>
            <p style={{ whiteSpace: "pre-wrap" }}>{f.a}</p>
          </details>
        ))}
      </Page>
      <CTA title="Still have questions?" text="Message us and we will help you pick the right session." />
    </>
  );
}
