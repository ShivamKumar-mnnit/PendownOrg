import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Buy from "../components/Buy";
import { Head, Page } from "../components/ui";
import { rupees, useAccount, usePayConfig, validity } from "../lib/account";
import { useCollection } from "../lib/contentApi";
import { usePageSEO } from "../lib/seo";

const LINKS = { createTests: "/workspace?tab=tests", studentData: "/workspace", collegePanel: "/workspace", allCourses: "/courses" };

export default function Premium() {
  usePageSEO({ title: "Premium plans", description: "Unlock premium courses, test creation, student records and the college panel on Anobyt.", path: "/premium" });
  const cfg = usePayConfig();
  const { features } = useAccount();
  const { items: courses } = useCollection("courses");
  const plans = Object.entries(cfg?.features || {}).filter(([, f]) => f.enabled);
  const paidCourses = courses.filter((c) => c.tier === "premium" && c.price > 0);

  return (
    <Page>
      <Head eyebrow="Premium" title="Unlock more of Anobyt">
        Problems, the compiler and free course modules stay free. Pay only for what you need, with Razorpay or UPI.
      </Head>
      {!cfg ? (
        <p className="note">Loading prices…</p>
      ) : cfg.offline ? (
        <p className="note bad">Prices couldn't load right now. Please refresh in a moment.</p>
      ) : (
        <div className="plans">
          {plans.map(([id, f]) => {
            const has = features?.[id]?.has;
            return (
              <div key={id} className={`plan${id === "collegePanel" ? " best" : ""}`}>
                {id === "collegePanel" && <span className="badge">For colleges and TPOs</span>}
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <div className="price">
                  {f.paid ? rupees(f.price) : "Free"}
                  {f.paid && <small>{validity(f.days)}</small>}
                </div>
                {has ? (
                  <>
                    <span className="owned">
                      <CheckCircle2 className="h-4 w-4" /> You have this
                    </span>
                    <Link className="btn ghost" to={LINKS[id]}>
                      Open
                    </Link>
                  </>
                ) : f.paid ? (
                  <Buy item={{ type: "feature", id }} price={f.price} label={`Get ${f.title.toLowerCase()}`} />
                ) : (
                  <Link className="btn ghost" to={features ? LINKS[id] : "/account?mode=signup"}>
                    {features ? "Open" : "Create a free account"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {paidCourses.length > 0 && (
        <>
          <h2 style={{ fontSize: 28, margin: "56px 0 18px" }}>Courses</h2>
          <div className="plans">
            {paidCourses.map((c) => (
              <Link key={c.id} to={`/courses/${c.id}`} className="plan" style={{ color: "inherit" }}>
                <h3>
                  {c.icon} {c.title}
                </h3>
                <p>{c.summary}</p>
                <div className="price">
                  {rupees(c.price)}
                  <small>{c.freeModules ? `first ${c.freeModules} module${c.freeModules > 1 ? "s" : ""} free` : "lifetime"}</small>
                </div>
                <span className="btn ghost">See the course</span>
              </Link>
            ))}
          </div>
        </>
      )}
      <p className="note" style={{ marginTop: 32 }}>
        Colleges buying for a whole batch can also <Link className="linkish" to="/colleges">talk to us</Link> for a custom plan.
      </p>
    </Page>
  );
}
