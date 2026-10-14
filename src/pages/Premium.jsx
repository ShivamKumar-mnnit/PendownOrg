import { Link } from "react-router-dom";
import { Check, CheckCircle2, Crown, Minus, ShieldCheck } from "lucide-react";
import Buy from "../components/Buy";
import { Head, Page } from "../components/ui";
import { rupees, useAccount, usePayConfig, validity } from "../lib/account";
import { useCollection } from "../lib/contentApi";
import { usePractice } from "../lib/problemBank";
import { FREE_PERKS, MEMBER_PERKS, PRACTICE_PERKS } from "../lib/plans";
import { usePageSEO } from "../lib/seo";

const LINKS = { createTests: "/tests", studentData: "/workspace", collegePanel: "/workspace", allCourses: "/courses", practice: "/problems", allAccess: "/problems" };

// Rows of the comparison table: [feature, free, practice, membership].
const COMPARE = [
  ["Free problems in every year and topic", true, true, true],
  ["Premium problems in all four years", false, true, true],
  ["Online compiler (5 languages)", true, true, true],
  ["Free course modules and practice tests", true, true, true],
  ["Solutions and hints (as each year allows)", "On free problems", true, true],
  ["Premium course modules", false, false, true],
  ["Create and share your own tests", false, false, true],
];

const PAY_STEPS = [
  ["Choose a plan", "Every price and what it includes is shown before you pay."],
  ["Sign in", "Create a free account so the purchase is saved to you, on every device."],
  ["Pay securely", "Pay through Razorpay (UPI, cards, net banking). If UPI by QR is offered, we confirm the transaction ID by hand."],
  ["Access opens", "Online payments unlock straight away. Access lasts for the period shown and is checked by our server, not your browser."],
];

function Cell({ v }) {
  if (v === true) return <Check className="h-4 w-4" style={{ color: "var(--color-accent-emerald)" }} />;
  if (v === false) return <Minus className="h-4 w-4" style={{ color: "var(--color-fg-faint)" }} />;
  return <small>{v}</small>;
}

export default function Premium() {
  usePageSEO({ title: "Free and premium plans", description: "What is free on Anobyt, what premium practice and premium membership include, prices and how access works.", path: "/premium" });
  const cfg = usePayConfig();
  const { features } = useAccount();
  const { data: practice } = usePractice();
  const { items: courses } = useCollection("courses");
  const f = cfg?.features || {};
  const paidCourses = courses.filter((c) => c.tier === "premium" && c.price > 0);
  const college = ["createTests", "studentData", "collegePanel"].filter((id) => f[id]?.enabled);

  const student = [
    { id: "free", name: "Free", perks: FREE_PERKS },
    f.practice?.enabled && { id: "practice", name: "Premium practice", perks: PRACTICE_PERKS },
    f.allAccess?.enabled && { id: "allAccess", name: "Premium membership", perks: MEMBER_PERKS, best: true },
  ].filter(Boolean);

  return (
    <Page>
      <Head eyebrow="Free and premium" title="Know exactly what you get">
        Most of Anobyt is free. Premium opens the rest of the practice problems, solutions, premium courses and the test builder. Prices are shown up front and nothing renews by itself.
      </Head>

      {!cfg ? (
        <p className="note">Loading prices…</p>
      ) : cfg.offline ? (
        <p className="note bad">Prices couldn't load right now. Please refresh in a moment.</p>
      ) : (
        <>
          <div className="fvp">
            {student.map((p) => {
              const plan = f[p.id];
              const has = p.id !== "free" && features?.[p.id]?.has;
              return (
                <div key={p.id} className={`fvp-col${p.best ? " best" : ""}`}>
                  <div className="meta" style={{ justifyContent: "flex-start", gap: 8 }}>
                    {p.id === "free" ? <span className="badge free">FREE</span> : <span className="badge prem">{p.best && <Crown className="h-3 w-3" />} PREMIUM</span>}
                    {p.best && <span className="tag prem">Best value</span>}
                  </div>
                  <h3>{p.name}</h3>
                  <div className="price">
                    {p.id === "free" || !plan.paid ? "₹0" : rupees(plan.price)} <small>/ {p.id === "free" || !plan.paid ? "forever" : validity(plan.days)}</small>
                  </div>
                  <ul className="ticks">
                    {p.perks.map((x) => (
                      <li key={x}>
                        <Check className="h-4 w-4" /> {x}
                      </li>
                    ))}
                  </ul>
                  {p.id === "free" ? (
                    <Link className="btn ghost" to="/problems">
                      Start practising free
                    </Link>
                  ) : has ? (
                    <>
                      <span className="owned">
                        <CheckCircle2 className="h-4 w-4" /> You have this
                        {features[p.id].expiresAt ? ` until ${new Date(features[p.id].expiresAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : ""}
                      </span>
                      <Link className="btn ghost" to={LINKS[p.id]}>
                        Open practice
                      </Link>
                    </>
                  ) : plan.paid ? (
                    <Buy item={{ type: "feature", id: p.id }} price={plan.price} label={`Get ${p.name.toLowerCase()}`} className={p.best ? "btn" : "btn ghost"} />
                  ) : (
                    <Link className="btn ghost" to="/account?mode=signup">
                      Free with an account
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <h2 style={{ fontSize: 28, margin: "56px 0 18px" }}>Compare plans</h2>
          <div className="tablewrap">
            <table className="dtable compare">
              <thead>
                <tr>
                  <th>What you get</th>
                  <th>Free</th>
                  <th>Premium practice</th>
                  <th>Premium membership</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, ...v]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {v.map((x, i) => (
                      <td key={i}>
                        <Cell v={x} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {practice && (
        <>
          <h2 style={{ fontSize: 28, margin: "56px 0 8px" }}>Which problems need payment</h2>
          <p className="note" style={{ marginTop: 0 }}>
            About {practice.freePercent}% of every year is free, spread over every topic. The rest is premium and shows a lock until you unlock it.
          </p>
          <div className="tablewrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Free</th>
                  <th>Premium</th>
                  <th>Solutions</th>
                </tr>
              </thead>
              <tbody>
                {practice.years.map((y) => (
                  <tr key={y.year}>
                    <td>
                      <Link to={`/problems/year/${y.year}`} className="linkish">
                        {y.title}
                      </Link>
                    </td>
                    <td>
                      <span className="badge free">{y.free} FREE</span>
                    </td>
                    <td>
                      <span className="badge prem">{y.total - y.free} PREMIUM</span>
                    </td>
                    <td>
                      <small>{y.solutions}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 style={{ fontSize: 28, margin: "56px 0 18px" }}>How payment and access work</h2>
      <ol className="jsteps">
        {PAY_STEPS.map(([t, x], i) => (
          <li key={t}>
            <span className="jsteps-n">{i + 1}</span>
            <div>
              <b>{t}</b>
              <p>{x}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="note" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ShieldCheck className="h-4 w-4" /> Payments are verified on our server before anything unlocks. Your purchases are listed on your <Link to="/account" className="linkish">account page</Link>.
      </p>

      {college.length > 0 && (
        <>
          <h2 style={{ fontSize: 28, margin: "56px 0 18px" }}>For teachers, TPOs and colleges</h2>
          <div className="plans">
            {college.map((id) => {
              const x = f[id];
              const has = features?.[id]?.has;
              return (
                <div key={id} className={`plan${id === "collegePanel" ? " best" : ""}`}>
                  {id === "collegePanel" && <span className="badge">For colleges and TPOs</span>}
                  <h3>{x.title}</h3>
                  <p>{x.text}</p>
                  <div className="price">
                    {x.paid ? rupees(x.price) : "Free"}
                    {x.paid && <small>{validity(x.days)}</small>}
                  </div>
                  {has ? (
                    <Link className="btn ghost" to={LINKS[id]}>
                      Open
                    </Link>
                  ) : x.paid ? (
                    <Buy item={{ type: "feature", id }} price={x.price} label={`Get ${x.title.toLowerCase()}`} />
                  ) : (
                    <Link className="btn ghost" to={features ? LINKS[id] : "/account?mode=signup"}>
                      {features ? "Open" : "Create a free account"}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {paidCourses.length > 0 && (
        <>
          <h2 style={{ fontSize: 28, margin: "56px 0 18px" }}>Courses</h2>
          <p className="note" style={{ marginTop: 0 }}>Buy a single course, or get every premium course with Premium membership.</p>
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
