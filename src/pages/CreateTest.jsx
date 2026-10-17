import { Link, Navigate } from "react-router-dom";
import { Check, ClipboardList } from "lucide-react";
import { Head, Page } from "../components/ui";
import { logout, useAccount } from "../lib/account";
import { isAdminRole } from "../lib/dataService";
import { usePageSEO } from "../lib/seo";

const WHAT_YOU_CAN_DO = [
  "Single-correct, multiple-correct and numeric questions, from a reusable question bank or an Excel upload",
  "Marks, negative marking, time limit, start and end time, and attempts per student",
  "A random set of questions for each student, with the options shuffled too",
  "Proctoring that counts tab switches and fullscreen exits, and submits after too many",
  "Pass mark, rank, percentile, leaderboard and per-question analytics",
  "Results as a spreadsheet, plus a scorecard that combines tests, coding and interviews",
];

const STEPS = [
  "Send us your college or class details. We set up your trainer account.",
  "Create a batch and add your students, one by one or from Excel.",
  "Build a test, preview it, publish it and share the link.",
  "Watch results, analytics and the leaderboard come in.",
];

/**
 * Create tests: tests live inside a batch on the data service, so trainer and
 * college accounts go straight to their panel; everyone else sees how to get one.
 */
export default function CreateTest() {
  usePageSEO({
    title: "Create tests",
    description: "Create proctored MCQ tests for your students, share one link and see every score, rank and analytics. For trainers and colleges on Anobyt.",
    path: "/tests",
  });
  const { user, loaded } = useAccount();

  if (!loaded) return <Page narrow={620}><p className="note">Loading…</p></Page>;
  if (isAdminRole(user)) return <Navigate to="/workspace" replace />;

  return (
    <Page>
      <Head eyebrow="For trainers and colleges" title="Create tests for your students">
        Build a test, share one link and see every score in one place. Tests are part of the college panel.
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
          <p className="note">
            Just want to practise? <Link to="/practice" className="linkish">Take a free practice test</Link>.
          </p>
        </div>

        <div className="panel">
          <h3 style={{ fontSize: 20 }}>How to start</h3>
          <ol className="ct-steps">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="row" style={{ marginTop: 6 }}>
            <Link className="btn" to="/colleges#bulk-onboard">
              Request a trainer account
            </Link>
            {user ? (
              <button type="button" className="btn ghost" onClick={() => logout()}>
                Sign in as a trainer
              </button>
            ) : (
              <Link className="btn ghost" to="/login?next=/workspace">
                Trainer sign-in
              </Link>
            )}
          </div>
          {user && (
            <p className="note" style={{ marginTop: 14 }}>
              You're signed in as a student. Tests shared with your batch are on your <Link to="/dashboard" className="linkish">dashboard</Link>.
            </p>
          )}
        </div>
      </div>
    </Page>
  );
}
