import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Check, ClipboardList, Crown, Lock } from "lucide-react";
import Buy from "../components/Buy";
import { Head, Page } from "../components/ui";
import { rupees, useAccount, usePayConfig, validity } from "../lib/account";
import { USER_TESTS } from "../lib/myTests";
import { usePageSEO } from "../lib/seo";

const TestsAdmin = lazy(() => import("./admin/TestsAdmin"));

const WHAT_YOU_CAN_DO = [
  "MCQ (single or multiple correct), numeric and coding questions",
  "Set the time limit, marks, negative marking and difficulty of each question",
  "Coding questions in Python, Java, C, C++ and JavaScript with hidden test cases",
  "Save drafts, preview the test, then publish and share one link",
  "See every student's score and export the results as a spreadsheet",
];

const STEPS = ["Pay once for test creation (or Premium membership).", "Access opens on your account straight away.", "Create a test here, publish it and share the link with your students.", "Watch results come in on this page."];

/**
 * Create tests: a premium feature. Signed-out visitors and accounts without
 * access see what it does, the price and how to get it; accounts with access
 * get the full test builder (saved on the server, results included).
 */
export default function CreateTest() {
  usePageSEO({
    title: "Create tests",
    description: "Create MCQ and coding tests for your students, share them as a link and see every score. A premium feature on Anobyt.",
    path: "/tests",
  });
  const { user, features, loaded } = useAccount();
  const cfg = usePayConfig();

  if (!loaded) return <Page narrow={620}><p className="note">Loading…</p></Page>;

  const f = features?.createTests || cfg?.features?.createTests;
  if (user && features?.createTests?.has)
    return (
      <Page>
        <Head eyebrow="Create tests" title="Your tests">
          Build MCQ, coding and Olympiad tests. Save a draft, preview it, then publish and copy its link for your students. Only people with the link can take it; results show up here.
        </Head>
        <Suspense fallback={<p className="note">Loading the test builder…</p>}>
          <TestsAdmin api={USER_TESTS} title="Your tests" intro="Click New test to start. Published tests can be taken by anyone with the link." />
        </Suspense>
      </Page>
    );

  if (f && !f.enabled)
    return (
      <Page narrow={720}>
        <Head title="Create tests">This feature is switched off right now. Message us on WhatsApp if you need a test for your class.</Head>
      </Page>
    );

  const member = features?.allAccess || cfg?.features?.allAccess;
  return (
    <Page>
      <Head eyebrow="Premium feature" title="Create your own tests">
        Build tests for your class or study group, share one link, and see every score in one place.
      </Head>
      <div className="ct-gate">
        <div className="panel">
          <h3 style={{ fontSize: 20, display: "flex", gap: 8, alignItems: "center" }}>
            <ClipboardList className="h-5 w-5" /> What you can do
          </h3>
          <ul className="ticks">
            {WHAT_YOU_CAN_DO.map((x) => (
              <li key={x}>
                <Check className="h-4 w-4" /> {x}
              </li>
            ))}
          </ul>
          <h3 style={{ fontSize: 18, marginTop: 18 }}>How it works</h3>
          <ol className="ct-steps">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="note">
            Just want to try a test? <Link to="/practice" className="linkish">Take a free practice test</Link>.
          </p>
        </div>

        <div className="upgrade">
          <div className="upgrade-head">
            <span className="upgrade-icon">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h3>{user ? "Creating tests needs premium access" : "Sign in to create tests"}</h3>
              <p>{user ? "Choose a plan below. If you already bought one, it opens automatically." : "Creating tests is a premium feature. Sign in or create a free account first, then choose a plan."}</p>
            </div>
          </div>
          {!f ? (
            <p className="note">Loading prices…</p>
          ) : (
            <div className="upgrade-plans">
              {f.paid && (
                <div className="upgrade-plan">
                  <b>Create tests</b>
                  <div className="price">
                    {rupees(f.price)} <small>/ {validity(f.days)}</small>
                  </div>
                  <p className="note" style={{ margin: 0 }}>The test builder with results and exports.</p>
                  <Buy item={{ type: "feature", id: "createTests" }} price={f.price} label="Get test creation" className="btn ghost" />
                </div>
              )}
              {member?.enabled && member.paid && (
                <div className="upgrade-plan best">
                  <div className="meta" style={{ justifyContent: "flex-start", gap: 8 }}>
                    <Crown className="h-4 w-4" /> <b>Premium membership</b>
                  </div>
                  <div className="price">
                    {rupees(member.price)} <small>/ {validity(member.days)}</small>
                  </div>
                  <p className="note" style={{ margin: 0 }}>Test creation plus every premium problem and course.</p>
                  <Buy item={{ type: "feature", id: "allAccess" }} price={member.price} label="Get premium membership" />
                </div>
              )}
              {!f.paid && !user && (
                <Link className="btn" to="/account?next=/tests">
                  Sign in to start (free)
                </Link>
              )}
            </div>
          )}
          <p className="upgrade-foot">
            Colleges: the <Link to="/workspace" className="linkish">college panel</Link> includes test creation and student records. <Link to="/premium" className="linkish">Compare all plans</Link>
          </p>
        </div>
      </div>
    </Page>
  );
}
