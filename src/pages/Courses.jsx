import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Unlock } from "lucide-react";
import { Head, CTA, Page } from "../components/ui";
import { lessonTotal, useCollection } from "../lib/contentApi";
import { usePageSEO } from "../lib/seo";

const FILTERS = [
  ["all", "All tracks"],
  ["free", "Free"],
  ["premium", "Premium"],
];

export default function Courses() {
  usePageSEO({
    title: "Courses",
    description: "Free and premium learning tracks for every year of college, from programming foundations to company preparation.",
    path: "/courses",
  });
  const { items } = useCollection("courses");
  const [filter, setFilter] = useState("all");
  const shown = items.filter((c) => filter === "all" || c.tier === filter);

  return (
    <>
      <Page>
        <Head eyebrow="Courses" title="Free and premium learning tracks">
          Free content gets you started. Premium gets you placed. Open any track to see the full curriculum.
        </Head>
        <div className="chips" style={{ marginTop: 0, marginBottom: 22 }}>
          {FILTERS.map(([k, v]) => (
            <button key={k} type="button" className={`chip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
              {v}
            </button>
          ))}
        </div>
        <div className="cards">
          {shown.map((c) => (
            <Link className="card tcard course-card" key={c.id} to={`/courses/${c.id}`}>
              <div className="meta">
                <span className={`tag ${c.tier === "free" ? "free" : "t-olympiad"}`}>
                  {c.tier === "free" ? <Unlock className="h-3 w-3" style={{ display: "inline", verticalAlign: -1 }} /> : <Lock className="h-3 w-3" style={{ display: "inline", verticalAlign: -1 }} />}{" "}
                  {c.tier === "free" ? "Free" : "Premium"}
                </span>
                <small>{lessonTotal(c) ? `${lessonTotal(c)} lessons` : ""}</small>
              </div>
              <div className="cicon">{c.icon || "📘"}</div>
              <h3>{c.title}</h3>
              {c.level && <small className="clevel">{c.level}</small>}
              <p style={{ marginTop: 10 }}>{c.summary}</p>
              <div className="tfoot">
                {c.priceLabel && <span>{c.priceLabel}</span>}
                <b>View course →</b>
              </div>
            </Link>
          ))}
        </div>
        {!shown.length && <p className="note">No courses here yet.</p>}
      </Page>
      <CTA title="Not sure which track fits?" text="Tell us your year and goal, and we will suggest one." />
    </>
  );
}
