import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";
import { COMPANIES } from "../lib/companies";

function CompanyCard({ company }) {
  return (
    <StaggerItem className="group">
      <Link
        to={`/book?company=${encodeURIComponent(company.name)}`}
        className="flex h-full flex-col rounded-2xl border border-(--color-border) bg-(--color-card) p-5 hover:border-(--color-accent)/40 hover:bg-(--color-card-alt) transition-colors"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${company.from}, ${company.to})` }}
        >
          {company.initials}
        </span>
        <p className="mt-4 text-sm font-semibold text-(--color-fg)">{company.name}</p>
        <p className="text-xs text-(--color-fg-faint)">{company.category}</p>

        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-(--color-accent) opacity-0 transition-opacity group-hover:opacity-100">
          View prep
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </StaggerItem>
  );
}

export default function CompanyPrep() {
  return (
    <section id="company-prep" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <SectionHeading
          eyebrow="The Company Vault"
          title="Prep for the companies that matter"
          subtitle="Pick a company to see its typical hiring rounds — and book a 1:1 session to mock it beforehand."
        />
      </Reveal>

      <Reveal delay={0.08}>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-(--color-fg-faint)">
          <CheckCircle2 className="h-3.5 w-3.5 text-(--color-accent-emerald)" />
          Publicly known process outlines — not affiliated with the companies listed, and actual rounds vary by role and year.
        </p>
      </Reveal>

      <StaggerGrid className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {COMPANIES.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </StaggerGrid>
    </section>
  );
}
