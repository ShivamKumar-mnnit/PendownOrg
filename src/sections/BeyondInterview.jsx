import { Link } from "react-router-dom";
import { FileText, CalendarClock, MessageCircle, BookOpenCheck, Award } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const ITEMS = [
  {
    icon: FileText,
    title: "Resume review, included",
    desc: "Share your resume link when you book — your mentor reviews it ahead of the session.",
  },
  {
    icon: CalendarClock,
    title: "Reschedule without hassle",
    desc: "Plans change — message us on WhatsApp and we'll move your slot, no forms to fill.",
  },
  {
    icon: MessageCircle,
    title: "Follow-up support",
    desc: "Questions after your session? Our WhatsApp line stays open, not just during booking.",
  },
  {
    icon: BookOpenCheck,
    title: "Pointers, not just a verdict",
    desc: "Feedback comes with what to practice next, not just a pass or fail.",
  },
  {
    icon: Award,
    title: "A certificate to show for it",
    desc: "Get an InoByt certificate of completion once your session wraps up — yours to keep and share.",
  },
];

export default function BeyondInterview() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <SectionHeading eyebrow="Beyond the Interview" title="What happens after your session" />
      </Reveal>

      <StaggerGrid className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <StaggerItem key={title}>
            <Link
              to="/book"
              className="group block h-full rounded-2xl border border-(--color-border) bg-(--color-card) p-6 hover:border-(--color-border-strong) transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                <Icon className="h-5 w-5 text-(--color-accent)" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-(--color-fg)">{title}</h3>
              <p className="mt-2 text-sm text-(--color-fg-muted)">{desc}</p>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}
