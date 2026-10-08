import { useState } from "react";
import { Link } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { COMPANIES, COMPANY_CATEGORIES, COMPANY_DISCLAIMER } from "../lib/companyPrep";
import { usePageSEO } from "../lib/seo";

export default function Companies() {
  usePageSEO({
    title: "Companies and their hiring process",
    description: `Browse ${COMPANIES.length} companies and their typical hiring rounds, topics to prepare and tips, then book a mock session built around one.`,
    path: "/companies",
  });

  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = COMPANIES.filter((c) => (category === "All" || c.category === category) && c.name.toLowerCase().includes(q));

  return (
    <Page>
      <Head title="Companies and their hiring process">
        Browse {COMPANIES.length} companies. Open one to see its typical rounds, topics to prepare and tips, then book a mock session built around it.
      </Head>
      <input
        className="inp"
        placeholder={`Search ${COMPANIES.length} companies`}
        aria-label="Search companies"
        style={{ maxWidth: 340, marginBottom: 16 }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="row" style={{ marginBottom: 24 }}>
        {COMPANY_CATEGORIES.map((c) => (
          <button key={c} type="button" className={`chip${c === category ? " on" : ""}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="note">{shown.length ? `${shown.length} companies` : "No company found. Try a different search."}</div>
      <div className="cards" style={{ marginTop: 12 }}>
        {shown.map((c) => (
          <Link key={c.id} className="card" style={{ padding: 18 }} to={`/companies/${c.id}`}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div className="ic" style={{ fontWeight: 700, fontSize: 14, flex: "none" }}>
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17 }}>{c.name}</h3>
                <span className="tag" style={{ marginTop: 6 }}>
                  {c.category}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="note" style={{ marginTop: 28 }}>
        {COMPANY_DISCLAIMER}
      </div>
    </Page>
  );
}
