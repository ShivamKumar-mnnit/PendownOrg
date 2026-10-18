import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { Head, Page } from "../components/ui";
import { ForgotForm, SignInForm } from "../components/AuthForms";
import { logout, useAccount } from "../lib/account";
import { ROLE_LABELS, isAdminRole } from "../lib/dataService";
import { usePageSEO } from "../lib/seo";

const TrainerInterviews = lazy(() => import("./admin/ds/TrainerInterviews"));

/**
 * Trainer sign-in and dashboard. Trainers are ADMIN accounts on the data service, created by
 * the Anobyt team; the dashboard lists the interviews they take.
 */
export default function Trainer() {
  usePageSEO({ title: "Trainer dashboard", description: "Sign in as an Anobyt trainer to run your mock interviews.", path: "/trainer", noindex: true });
  const { user, loaded } = useAccount();
  const [forgot, setForgot] = useState(false);

  if (!loaded) return <Page narrow={480}><p className="note">Loading…</p></Page>;

  if (!user)
    return (
      <Page narrow={460}>
        <Head title="Trainer sign-in">Sign in to see the interviews assigned to you, fill score cards and publish them to students.</Head>
        {forgot ? <ForgotForm onMode={() => setForgot(false)} /> : <SignInForm adminOnly onMode={() => setForgot(true)} />}
        <p className="note" style={{ fontSize: 13, textAlign: "center", marginTop: 18 }}>
          New trainer? Your account is created by the Anobyt team. Ask them for your login.
          <br />
          Student? <Link className="linkish" to="/login">Sign in here</Link>
        </p>
      </Page>
    );

  if (!isAdminRole(user))
    return (
      <Page narrow={520}>
        <Head title="Trainer dashboard">
          You're signed in as {user.name} ({ROLE_LABELS[user.role] || user.role}). This page is for trainers.
        </Head>
        <div className="row">
          <Link className="btn" to="/dashboard">
            Go to your dashboard
          </Link>
          <button type="button" className="btn ghost" onClick={() => logout()}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </Page>
    );

  return (
    <section className="page">
      <div className="wrap" style={{ maxWidth: 1240 }}>
        <div className="admin-top">
          <div>
            <span className="eyebrow">Trainer dashboard</span>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 38px)", marginTop: 6 }}>Hi, {user.name.split(" ")[0]}</h1>
          </div>
          <div className="row">
            <Link className="btn ghost" to="/admin">
              <LayoutDashboard className="h-4 w-4" /> {user.role === "SUPERADMIN" ? "Admin panel" : "Batches"}
            </Link>
            <Link className="btn ghost" to="/account">
              <UserRound className="h-4 w-4" /> Account
            </Link>
            <button type="button" className="btn ghost" onClick={() => logout()}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
        <Suspense fallback={<p className="note">Loading your interviews…</p>}>
          <TrainerInterviews me={user} />
        </Suspense>
      </div>
    </section>
  );
}
