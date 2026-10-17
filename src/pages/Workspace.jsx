import { lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Award, Bell, Building2, ClipboardList, FileQuestion, Layers, LogOut, Users, Video } from "lucide-react";
import { Head, Page } from "../components/ui";
import { logout, useAccount } from "../lib/account";
import { ROLE_LABELS, isAdminRole } from "../lib/dataService";
import { usePageSEO } from "../lib/seo";

// The same data-service panels the admin area uses.
const Batches = lazy(() => import("./admin/ds/Batches"));
const QuestionBank = lazy(() => import("./admin/ds/QuestionBank"));

const TABS = [
  ["batches", "Batches", Layers, Batches],
  ["questions", "Question bank", FileQuestion, QuestionBank],
];

const WHAT_YOU_GET = [
  [Users, "Students", "Add students one by one or from Excel. Each gets a login with your college code and reg. no."],
  [ClipboardList, "Proctored tests", "MCQ and numeric tests with random question sets, shuffled options, pass marks and a leaderboard."],
  [Video, "Mock interviews", "Schedule interviews with Zoom links. Students get email and WhatsApp confirmations and reminders."],
  [Award, "Scorecards", "Tests, coding and interview scores in one ranked list, with a shortlist you can export."],
  [Bell, "Announcements", "Message the whole batch by email, WhatsApp or in the app."],
];

/**
 * College panel: batches, students, tests, interviews and scorecards on the
 * Anobyt data service. Open to trainer, company and college accounts (ADMIN);
 * everyone else can ask for one through the college onboarding form.
 */
export default function Workspace() {
  usePageSEO({ title: "College panel", description: "Manage students, tests, interviews and scorecards for your college on Anobyt.", path: "/workspace", noindex: true });
  const { user, loaded } = useAccount();
  const [params, setParams] = useSearchParams();

  if (!loaded) return <Page narrow={520}><p className="note">Loading…</p></Page>;
  if (!user || !isAdminRole(user)) return <RequestAccess user={user} />;

  const current = TABS.find((t) => t[0] === params.get("tab")) || TABS[0];
  const C = current[3];
  return (
    <section className="page">
      <div className="wrap" style={{ maxWidth: 1200 }}>
        <div className="admin-top">
          <div>
            <span className="eyebrow">College panel</span>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 34px)", marginTop: 8 }}>{user.organization || user.collegeName || user.name}</h1>
          </div>
          <div className="row">
            {user.role === "SUPERADMIN" && (
              <Link className="btn ghost" to="/admin">
                Admin panel
              </Link>
            )}
            <button type="button" className="btn ghost" onClick={() => logout()}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
        <div className="seg tabs" role="tablist" aria-label="College panel">
          {TABS.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={current[0] === id}
              className={current[0] === id ? "on" : ""}
              onClick={() => setParams(id === TABS[0][0] ? {} : { tab: id })}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <Suspense fallback={<p className="note">Loading…</p>}>
          <C me={user} />
        </Suspense>
      </div>
    </section>
  );
}

function RequestAccess({ user }) {
  return (
    <Page>
      <Head eyebrow="College panel" title="Run placement prep for your whole batch">
        Trainers, companies and college placement cells get a panel to manage students, tests, interviews and results. Panels are set up by the Anobyt team.
      </Head>
      <div className="ct-gate">
        <div className="panel">
          <h3 style={{ fontSize: 20, display: "flex", gap: 8, alignItems: "center" }}>
            <Building2 className="h-5 w-5" /> What's in the panel
          </h3>
          <ul className="ws-list">
            {WHAT_YOU_GET.map(([Icon, title, text]) => (
              <li key={title}>
                <Icon className="h-4 w-4" />
                <div>
                  <b>{title}</b>
                  <span>{text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          {user ? (
            <>
              <h3 style={{ fontSize: 20 }}>This account can't open a panel</h3>
              <p className="note">
                You're signed in as {user.name} ({ROLE_LABELS[user.role] || user.role}). Panels belong to trainer and college accounts. Send us your college's details and we'll set one up, or sign in with your panel account.
              </p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 20 }}>Already have a panel account?</h3>
              <p className="note">Sign in with the email and password we sent you.</p>
            </>
          )}
          <div className="row" style={{ marginTop: 14 }}>
            <Link className="btn" to="/colleges#bulk-onboard">
              Request a college panel
            </Link>
            {user ? (
              <button type="button" className="btn ghost" onClick={() => logout()}>
                Use another account
              </button>
            ) : (
              <Link className="btn ghost" to="/login?next=/workspace">
                Sign in
              </Link>
            )}
          </div>
          <p className="note" style={{ marginTop: 16 }}>
            Students: your tests, interviews and scores are on your <Link to="/dashboard" className="linkish">dashboard</Link>.
          </p>
        </div>
      </div>
    </Page>
  );
}
