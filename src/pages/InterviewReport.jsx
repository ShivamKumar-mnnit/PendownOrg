import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Page } from "../components/ui";
import ScorecardReport from "../components/ScorecardReport";
import { useAccount } from "../lib/account";
import { interviewApi, isAdminRole, studentApi } from "../lib/dataService";
import { usePageSEO } from "../lib/seo";

/** One interview score card: the student's published report, or the trainer's preview of it. */
export default function InterviewReport() {
  usePageSEO({ title: "Interview score card", description: "Your mock interview score card.", path: "/interview-report", noindex: true });
  const { id } = useParams();
  const { user, loaded } = useAccount();
  const [card, setCard] = useState(null);
  const [err, setErr] = useState("");
  const admin = isAdminRole(user);

  useEffect(() => {
    if (!user) return;
    let on = true;
    (admin ? interviewApi.scorecard(id) : studentApi.interviewScorecard(id)).then(
      (c) => on && setCard(c),
      (e) => on && setErr(e.status === 404 ? "This score card isn't published yet." : e.message),
    );
    return () => {
      on = false;
    };
  }, [id, user, admin]);

  if (!loaded) return <Page narrow={520}><p className="note">Loading…</p></Page>;
  if (!user) return <Navigate to={`/login?next=/interview-report/${id}`} replace />;

  return (
    <Page narrow={860}>
      <div className="row no-print" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <Link className="linkish" to={admin ? "/admin" : "/dashboard"}>
          <ArrowLeft className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> Back
        </Link>
        {card && (
          <button type="button" className="btn ghost" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print or save as PDF
          </button>
        )}
      </div>
      {admin && card && !card.published && <p className="note no-print">Preview: the student can't see this until you publish it.</p>}
      {err ? <p className="note bad">{err}</p> : card ? <ScorecardReport card={card} /> : <p className="note">Loading…</p>}
    </Page>
  );
}
