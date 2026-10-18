import { lazy, Suspense, useState } from "react";
import {
  BadgeIndianRupee, BookOpen, Building2, CalendarRange, ClipboardList, Code2, Cpu, CreditCard, FileQuestion, Gauge, Inbox as Inbox_, KeyRound, Layers, Link2, LogOut, Mic,
  School, Settings2, UserCog, UsersRound, Video,
} from "lucide-react";
import { Page } from "../components/ui";
import { ForgotForm, SignInForm } from "../components/AuthForms";
import { logout, useAccount } from "../lib/account";
import { ROLE_LABELS, isAdminRole } from "../lib/dataService";
import { usePageSEO } from "../lib/seo";

// Data-service sections (sign in with an ADMIN or SUPERADMIN account).
const Batches = lazy(() => import("./admin/ds/Batches"));
const QuestionBank = lazy(() => import("./admin/ds/QuestionBank"));
const TrainerInterviews = lazy(() => import("./admin/ds/TrainerInterviews"));
const MeetingLinks = lazy(() => import("./admin/ds/MeetingLinks"));
const InterviewSchedule = lazy(() => import("./admin/ds/InterviewSchedule"));
const CodingProblems = lazy(() => import("./admin/ds/CodingProblems"));
const superPanel = (name) => lazy(() => import("./admin/ds/SuperAdmin").then((m) => ({ default: m[name] })));
const Overview = superPanel("Overview");
const Onboarding = superPanel("Onboarding");
const Accounts = superPanel("Accounts");
const CollegesAdmin = superPanel("CollegesAdmin");

// Site content sections, stored in Netlify (they also ask for the site's ADMIN_PASSWORD).
const TestsAdmin = lazy(() => import("./admin/TestsAdmin"));
const Inbox = lazy(() => import("./admin/Inbox"));
const CoursesAdmin = lazy(() => import("./admin/CoursesAdmin"));
const EventsAdmin = lazy(() => import("./admin/EventsAdmin"));
const AccessCodes = lazy(() => import("./admin/AccessCodes"));
const SiteAdmin = lazy(() => import("./admin/SiteAdmin"));
const PaymentsAdmin = lazy(() => import("./admin/PaymentsAdmin"));
const AccessAdmin = lazy(() => import("./admin/AccessAdmin"));
const UsersAdmin = lazy(() => import("./admin/UsersAdmin"));
const ProblemsAdmin = lazy(() => import("./admin/ProblemsAdmin"));
const RunnerAdmin = lazy(() => import("./admin/RunnerAdmin"));

// [id, label, icon, component, who]: "admin" = every admin, "super" = super admins only.
const TABS = [
  ["overview", "Overview", Gauge, Overview, "super"],
  ["interviews", "Interviews", Video, TrainerInterviews, "admin"],
  ["batches", "Batches", Layers, Batches, "admin"],
  ["questions", "Question bank", FileQuestion, QuestionBank, "admin"],
  ["coding", "Coding problems", Code2, CodingProblems, "admin"],
  ["schedule", "Interview schedule", CalendarRange, InterviewSchedule, "super"],
  ["meetings", "Meeting links", Link2, MeetingLinks, "super"],
  ["onboarding", "College requests", School, Onboarding, "super"],
  ["accounts", "Accounts", UserCog, Accounts, "super"],
  ["colleges", "Colleges", Building2, CollegesAdmin, "super"],
  ["inbox", "Inbox", Inbox_, Inbox, "super", true],
  ["tests", "Coding tests", ClipboardList, TestsAdmin, "super", true],
  ["courses", "Courses", BookOpen, CoursesAdmin, "super", true],
  ["problems", "Problems", Code2, ProblemsAdmin, "super", true],
  ["events", "Events", Mic, EventsAdmin, "super", true],
  ["users", "Purchases and users", UsersRound, UsersAdmin, "super", true],
  ["payments", "Payments", CreditCard, PaymentsAdmin, "super", true],
  ["pricing", "Prices and features", BadgeIndianRupee, AccessAdmin, "super", true],
  ["access", "Access codes", KeyRound, AccessCodes, "super", true],
  ["runner", "Compiler", Cpu, RunnerAdmin, "super", true],
  ["site", "Site and FAQ", Settings2, SiteAdmin, "super", true],
];
const TAB_KEY = "anobyt_admin_tab";

export default function Admin() {
  usePageSEO({ title: "Admin", description: "Internal admin panel.", path: "/admin", noindex: true });
  const { user, loaded } = useAccount();
  const [forgot, setForgot] = useState(false);

  if (!loaded) return <Page narrow={420}><p className="note">Loading…</p></Page>;

  if (!user)
    return (
      <Page narrow={440}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Admin sign-in</h1>
          <p className="note" style={{ marginTop: 0 }}>Use your Anobyt admin account.</p>
        </div>
        {forgot ? <ForgotForm onMode={() => setForgot(false)} /> : <SignInForm adminOnly onMode={() => setForgot(true)} />}
      </Page>
    );

  if (!isAdminRole(user))
    return (
      <Page narrow={520}>
        <div className="panel" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Admins only</h1>
          <p className="note">
            You're signed in as {user.name} ({ROLE_LABELS[user.role] || user.role}). This area is for trainers, companies and the Anobyt team.
          </p>
          <button type="button" className="btn ghost" style={{ marginTop: 12 }} onClick={() => logout()}>
            <LogOut className="h-4 w-4" /> Sign in with another account
          </button>
        </div>
      </Page>
    );

  return <Panel me={user} />;
}

function Panel({ me }) {
  const isSuper = me.role === "SUPERADMIN";
  const tabs = TABS.filter((t) => t[4] === "admin" || isSuper);
  const [tab, setTab] = useState(() => {
    const saved = sessionStorage.getItem(TAB_KEY);
    return tabs.some((t) => t[0] === saved) ? saved : tabs[0][0];
  });
  const choose = (id) => {
    setTab(id);
    sessionStorage.setItem(TAB_KEY, id);
  };
  const current = tabs.find((t) => t[0] === tab) || tabs[0];
  const C = current[3];
  const main = tabs.filter((t) => !t[5]);
  const site = tabs.filter((t) => t[5]);

  return (
    <section className="page">
      <div className="wrap" style={{ maxWidth: 1200 }}>
        <div className="admin-top">
          <div>
            <span className="eyebrow">{ROLE_LABELS[me.role]}</span>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 38px)", marginTop: 6 }}>{isSuper ? "Manage Anobyt" : `Hi, ${me.name.split(" ")[0]}`}</h1>
          </div>
          <button type="button" className="btn ghost" onClick={() => logout()}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
        <div className="seg tabs" role="tablist" aria-label="Admin sections">
          {main.map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => choose(id)}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        {site.length > 0 && (
          <div className="seg tabs" role="tablist" aria-label="Site content" style={{ marginTop: -6, opacity: 0.9 }}>
            {site.map(([id, label, Icon]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => choose(id)}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        )}
        <Suspense fallback={<p className="note">Loading…</p>}>
          <C me={me} onGo={choose} />
        </Suspense>
      </div>
    </section>
  );
}
