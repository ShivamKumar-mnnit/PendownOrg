import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Code2, Lock, Timer, Trophy, Unlock } from "lucide-react";
import { Head, CTA, Page } from "../components/ui";
import { lessonTotal, useCollection } from "../lib/contentApi";
import { usePageSEO } from "../lib/seo";
import { rupees } from "../lib/account";
import { isCodevitaCourse, useCvPromo } from "../lib/codevita/api";

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
  const promo = useCvPromo();
  // The CodeVita course has its own page; its card below replaces any CMS copy of it.
  const shown = items.filter((c) => (filter === "all" || c.tier === filter) && !isCodevitaCourse(c.id, promo));
  const showCv = promo?.visible && filter !== "free";

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
        {showCv && <CodevitaCard promo={promo} />}
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
        {!shown.length && !showCv && <p className="note">No courses here yet.</p>}
      </Page>
      <CTA title="Not sure which track fits?" text="Tell us your year and goal, and we will suggest one." />
    </>
  );
}

/** Featured card for the TCS CodeVita Crash Course. It opens the course itself (/courses/tcs-codevita), not a copy. */
function CodevitaCard({ promo }) {
  return (
    <Link to="/courses/tcs-codevita" className="card cv-course-card">
      <div className="cv-course-thumb" aria-hidden="true">
        <Trophy className="h-7 w-7" />
        <b>TCS CodeVita</b>
        <span>Crash Course</span>
        <code>{"while (!ready) practise();"}</code>
      </div>
      <div className="cv-course-info">
        <div className="meta">
          <span className="tag t-olympiad">
            <Lock className="h-3 w-3" style={{ display: "inline", verticalAlign: -1 }} /> Premium · free preview
          </span>
          <span className="tag free">New</span>
        </div>
        <h3>{promo.card?.title || "TCS CodeVita Crash Course"}</h3>
        <p>{promo.card?.summary}</p>
        <ul className="cv-course-feats">
          <li>
            <BookOpen className="h-4 w-4" /> Lessons
          </li>
          <li>
            <Code2 className="h-4 w-4" /> Practice + solutions
          </li>
          <li>
            <Timer className="h-4 w-4" /> Mock tests
          </li>
        </ul>
        <div className="cv-course-foot">
          {promo.price > 0 && (
            <span className="cv-course-price">
              {rupees(promo.price)} <small>one-time</small>
            </span>
          )}
          <span className="btn">
            {promo.price > 0 ? "Explore and buy" : "Explore course"} <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
