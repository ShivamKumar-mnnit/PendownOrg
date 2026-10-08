import { Link, useParams } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { COMPANIES, COMPANY_DISCLAIMER, getCompany } from "../lib/companyPrep";
import { usePageSEO } from "../lib/seo";

export default function CompanyDetail() {
  const { id } = useParams();
  const c = getCompany(id);

  usePageSEO({
    title: c ? `${c.name} hiring process` : "Company not found",
    description: c ? c.summary : "Pick a company from the list.",
    path: `/companies/${id}`,
    noindex: !c,
  });

  if (!c) {
    return (
      <Page>
        <Head title="Company not found">Pick a company from the list.</Head>
        <Link className="btn" to="/companies">
          View companies
        </Link>
      </Page>
    );
  }

  return (
    <Page>
      <Link to="/companies" className="note back">
        ‹ All companies
      </Link>
      <Head title={`${c.name} hiring process`}>{c.summary}</Head>
      <span className="tag">{c.category}</span>

      <Head title="Rounds" style={{ margin: "40px 0 24px" }} />
      <div className="steps">
        {c.rounds.map((r) => (
          <div key={r.title}>
            <h3>{r.title}</h3>
            <p>{r.detail}</p>
          </div>
        ))}
      </div>

      <Head title="What to prepare" style={{ margin: "56px 0 20px" }} />
      <div className="row">
        {c.topics.map((t) => (
          <span className="chip" key={t}>
            {t}
          </span>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18 }}>Preparation tip</h3>
        <p style={{ margin: "8px 0 0", color: "var(--color-fg-muted)" }}>{c.tip}</p>
      </div>

      <div className="row" style={{ marginTop: 28 }}>
        <Link className="btn" to={`/book?company=${encodeURIComponent(c.name)}`}>
          Book a mock session for {c.name}
        </Link>
        <Link className="btn ghost" to="/practice">
          Take a practice test
        </Link>
      </div>
      <div className="note" style={{ marginTop: 28 }}>
        {COMPANY_DISCLAIMER}
      </div>

      <Head title="Other companies" style={{ margin: "56px 0 20px" }} />
      <div className="row">
        {COMPANIES.filter((x) => x.id !== c.id).map((x) => (
          <Link key={x.id} className="chip" to={`/companies/${x.id}`}>
            {x.name}
          </Link>
        ))}
      </div>
    </Page>
  );
}
