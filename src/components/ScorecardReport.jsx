import { fmtDay, ordinal } from "../lib/dataService";
import { INTEREST, SECTIONS, band, overallPercent, scoreTone, strengths, suggestAreas } from "../lib/scorecard";

// Shown on every score card, on screen and when printed or saved as PDF.
const CONTACTS = ["anobyt@anobyt.in", "contact@anobyt.in"];

/** A published interview scorecard (ScorecardView from the data service), as the student reads it. */
export default function ScorecardReport({ card }) {
  const overall = card.overallPercent ?? overallPercent(card.sections);
  const b = band(overall);
  const areas = card.areasToImprove?.length ? card.areasToImprove : suggestAreas(card.sections, card.interest);
  const good = strengths(card.sections);

  return (
    <div className="report">
      <div className="report-head">
        <div>
          <span className="eyebrow">Mock interview score card</span>
          <p className="report-collab">In collaboration with Anobyt for CSE students</p>
          <h2 style={{ margin: "6px 0 2px" }}>{card.studentName || "Student"}</h2>
          <p className="note" style={{ margin: 0 }}>{[card.regNo, card.templateName].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="report-score">
          <b>{overall === null || overall === undefined ? "—" : `${Math.round(overall * 10) / 10}%`}</b>
          <span className={`tag ${b.tone}`}>{b.label}</span>
        </div>
      </div>

      <dl className="report-facts">
        <div><dt>Interview</dt><dd>{ordinal(card.studentInterviewNo)}{card.interviewNo ? ` (#${card.interviewNo})` : ""}</dd></div>
        <div><dt>Interviewer</dt><dd>{card.interviewerName || "—"}</dd></div>
        <div><dt>Date</dt><dd>{fmtDay(card.scheduledAt)}</dd></div>
        <div><dt>Duration</dt><dd>{card.interviewDurationMinutes ? `${card.interviewDurationMinutes} min` : "—"}</dd></div>
        <div>
          <dt>Interest</dt>
          <dd>{card.interest ? <span className={`tag ${card.interest === "POSITIVE" ? "free" : "adv"}`}>{INTEREST[card.interest]}</span> : "—"}</dd>
        </div>
      </dl>

      <h3 className="report-h">Section scores</h3>
      <div className="report-bars">
        {SECTIONS.map(([k, label]) => {
          const v = card.sections?.[k];
          const scored = v !== null && v !== undefined;
          return (
            <div key={k} className={`report-bar${scored ? "" : " na"}`}>
              <span>{label}</span>
              <div className="track" aria-hidden="true">
                <div className={`fill ${scoreTone(v)}`} style={{ width: scored ? `${v * 10}%` : 0 }} />
              </div>
              <b>{scored ? `${v}/10` : "Not assessed"}</b>
            </div>
          );
        })}
      </div>

      <div className="report-overall">
        <span>Overall</span>
        <b>{overall === null || overall === undefined ? "—" : `${Math.round(overall * 10) / 10}%`}</b>
        <small className="note">Average of the assessed sections, each out of 10.</small>
      </div>

      {good.length > 0 && (
        <>
          <h3 className="report-h">Strengths</h3>
          <p style={{ marginTop: 0 }}>{good.join(", ")}.</p>
        </>
      )}

      <h3 className="report-h">Areas to improve</h3>
      {areas.length ? (
        <ul className="ck">
          {areas.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : (
        <p className="note" style={{ marginTop: 0 }}>No section scored below 6. Keep practising to stay sharp.</p>
      )}

      {card.remarks && (
        <>
          <h3 className="report-h">Remarks from your interviewer</h3>
          <p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>{card.remarks}</p>
        </>
      )}
      <div className="report-foot">
        <span>{card.publishedAt ? `Published ${fmtDay(card.publishedAt)}` : ""}</span>
        <span>
          Contact:{" "}
          {CONTACTS.map((m, i) => (
            <span key={m}>
              {i > 0 && " · "}
              <a href={`mailto:${m}`}>{m}</a>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
