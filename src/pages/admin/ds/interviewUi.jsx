import { useEffect, useState } from "react";
import { Sparkles, Video } from "lucide-react";
import { MEETING_PLATFORMS, adminApi, fmtWhen, interviewApi, isLegacyInterviews, ordinal } from "../../../lib/dataService";
import { INTEREST, SECTIONS, band, overallPercent, suggestAreas, toRequest } from "../../../lib/scorecard";
import { createTeamsMeeting, meetingSubject, teamsConfigured } from "../../../lib/teams";
import { Field } from "../shared";
import { act } from "./common";

const missing = (e) => e?.status === 404 || e?.status === 405;

/**
 * Interview rows for the trainer dashboard and the meeting-links register. A trainer's own rows
 * come from the trainer endpoint; "every trainer" (super admins), and older servers without that
 * endpoint, walk the batches instead (for a trainer: only interviews where they are the mentor).
 */
export async function loadInterviewRows(me, { all = false, status } = {}) {
  if (!all)
    try {
      const r = await interviewApi.dashboard({ status: status || undefined });
      return { rows: r.interviews, counts: r.counts, fallback: false };
    } catch (e) {
      if (!missing(e)) throw e;
    }
  const batches = await adminApi.templates({ size: 100 });
  const lists = await Promise.all((batches.items || []).map((b) => adminApi.interviews(b.id).then((l) => l.map((i) => ({ ...i, templateName: i.templateName || b.name })))));
  const email = (me.email || "").toLowerCase();
  let rows = lists.flat();
  if (!all) rows = rows.filter((i) => i.interviewerId === me.id || (email && (i.mentorEmail || "").toLowerCase() === email));
  if (status) rows = rows.filter((i) => i.status === status);
  rows.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  return { rows, counts: null, fallback: !all || isLegacyInterviews() };
}

export function countByStatus(rows) {
  const c = {};
  for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
  return c;
}

/** Moves an interview to a new status (trainer endpoint, or the batch PATCH on older servers). */
export async function changeStatus(i, status) {
  try {
    return await interviewApi.setStatus(i.id, status);
  } catch (e) {
    if (!missing(e)) throw e;
    if (status === "IN_PROGRESS") throw new Error("\"In progress\" needs the data service update. Use Upcoming or Done for now.");
    return adminApi.updateInterview(i.id, { status, sendConfirmation: false });
  }
}

/** Saves meeting / recording links (links endpoint, or the batch PATCH on older servers). */
export async function saveLinks(i, b) {
  try {
    return await interviewApi.setLinks(i.id, b);
  } catch (e) {
    if (!missing(e)) throw e;
    return adminApi.updateInterview(i.id, { ...b, meetingLink: b.meetingLink || undefined, sendConfirmation: false });
  }
}

const WHO = { STUDENT: "student", TRAINER: "trainer" };

/**
 * Emails the meeting link and a calendar invite to the student and trainer, and returns a
 * one-line summary such as "Emailed the student and trainer." or what failed.
 */
export async function emailMeeting(interviewId, { meetingLink, meetingPlatform, message } = {}) {
  const r = await interviewApi.sendMeetingEmail(interviewId, {
    meetingLink: meetingLink || undefined,
    meetingPlatform: meetingPlatform || undefined,
    sendTo: ["STUDENT", "TRAINER"],
    message: message?.trim() || undefined,
    calendarInvite: true,
  });
  const rows = r?.deliveries || [];
  const sent = rows.filter((d) => d.status === "SENT").map((d) => WHO[d.recipient] || d.name || d.email);
  const bad = rows.filter((d) => d.status !== "SENT").map((d) => `${WHO[d.recipient] || d.email} ${d.status === "SKIPPED" ? "skipped" : "failed"}${d.error ? ` (${d.error})` : ""}`);
  const parts = [];
  if (sent.length) parts.push(`Emailed the ${sent.join(" and ")}.`);
  else if (!rows.length) parts.push(r?.sent ? `${r.sent} email${r.sent === 1 ? "" : "s"} sent.` : "No email was sent.");
  if (bad.length) parts.push(`Not sent: ${bad.join("; ")}.`);
  return { text: parts.join(" "), ok: !bad.length && (sent.length > 0 || r?.sent > 0) };
}

export const interviewLabel = (i) => (i.interviewNo ? `#${i.interviewNo}` : "—");

export function LinkCell({ href, label }) {
  if (!href) return <span className="note" style={{ margin: 0 }}>—</span>;
  return (
    <a className="linkish" href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

/** Meeting link, platform and recording link for one interview. Teams meetings can be created here. */
export function LinksForm({ interview, onSaved }) {
  const [f, setF] = useState({
    meetingLink: interview.meetingLink || "",
    meetingPlatform: interview.meetingPlatform || (interview.zoomMeetingId ? "ZOOM" : "TEAMS"),
    recordingLink: interview.recordingLink || "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function teams() {
    setErr("");
    setBusy("teams");
    try {
      const m = await createTeamsMeeting({ subject: meetingSubject(interview), startsAt: interview.scheduledAt, minutes: interview.durationMinutes });
      setF((x) => ({ ...x, meetingLink: m.joinUrl, meetingPlatform: "TEAMS" }));
    } catch (e) {
      setErr(e.message);
    }
    setBusy("");
  }

  const upcoming = interview.status === "UPCOMING" || interview.status === "IN_PROGRESS";
  const linkChanged = f.meetingLink.trim() && f.meetingLink.trim() !== (interview.meetingLink || "");
  const [email, setEmail] = useState(true);

  /** onSaved(interview, note): note says whether the email went out. */
  async function save(e) {
    e.preventDefault();
    setBusy("save");
    const link = f.meetingLink.trim();
    const r = await act(setErr, () => saveLinks(interview, { meetingLink: link, recordingLink: f.recordingLink.trim(), meetingPlatform: f.meetingPlatform }));
    let note = r ? "Links saved." : "";
    if (r && upcoming && linkChanged && email) {
      try {
        note = `Links saved. ${(await emailMeeting(interview.id, { meetingLink: link, meetingPlatform: f.meetingPlatform })).text}`;
      } catch (x) {
        note = `Links saved, but the email failed: ${x.message}`;
      }
    }
    setBusy("");
    if (r) onSaved(r, note);
  }

  return (
    <form onSubmit={save}>
      <p className="note" style={{ marginTop: 0, fontSize: 14 }}>
        {interview.studentName} · {fmtWhen(interview.scheduledAt)} · {interview.mentorName}
      </p>
      <div className="two">
        <Field label="Platform">
          <select className="inp" value={f.meetingPlatform} onChange={set("meetingPlatform")}>
            {Object.entries(MEETING_PLATFORMS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <div style={{ display: "flex", alignItems: "end" }}>
          {teamsConfigured() ? (
            <button type="button" className="btn ghost" onClick={teams} disabled={!!busy}>
              <Video className="h-4 w-4" /> {busy === "teams" ? "Creating…" : f.meetingLink ? "New Teams meeting" : "Create Teams meeting"}
            </button>
          ) : (
            <p className="note" style={{ margin: 0, fontSize: 13 }}>Create the meeting in Teams and paste its join link.</p>
          )}
        </div>
      </div>
      <Field label="Meeting link">
        <input className="inp" type="url" value={f.meetingLink} onChange={set("meetingLink")} maxLength={1000} placeholder="https://teams.microsoft.com/l/meetup-join/…" />
      </Field>
      <Field label="Recording link" hint={isLegacyInterviews() ? "Recording links are saved once the data service update is live." : "After the interview: the Teams recording's share link (OneDrive / SharePoint)."}>
        <input className="inp" type="url" value={f.recordingLink} onChange={set("recordingLink")} maxLength={1000} placeholder="https://…sharepoint.com/…" />
      </Field>
      {upcoming && linkChanged && (
        <label className="row" style={{ gap: 6, alignItems: "center", marginTop: 12, fontSize: 14 }}>
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Email the meeting link to the student and trainer (with a calendar invite)
        </label>
      )}
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 14 }} disabled={!!busy}>
        {busy === "save" ? "Saving…" : "Save links"}
      </button>
    </form>
  );
}

const minutesBetween = (a, b) => (a && b ? Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000)) : null);

/** The trainer's scorecard for one interview: 13 sections out of 10, interest, remarks, areas to improve. */
export function ScorecardEditor({ interview, onSaved }) {
  const [f, setF] = useState(null);
  const [existing, setExisting] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let on = true;
    const blank = {
      interviewDurationMinutes: minutesBetween(interview.startedAt, interview.endedAt) ?? interview.durationMinutes ?? "",
      sections: {},
      interest: "",
      remarks: "",
      areasToImprove: "",
    };
    interviewApi.scorecard(interview.id).then(
      (c) => {
        if (!on) return;
        setExisting(c);
        setF({
          interviewDurationMinutes: c.interviewDurationMinutes ?? blank.interviewDurationMinutes,
          sections: Object.fromEntries(SECTIONS.map(([k]) => [k, c.sections?.[k] ?? ""])),
          interest: c.interest || "",
          remarks: c.remarks || "",
          areasToImprove: (c.areasToImprove || []).join("\n"),
        });
      },
      (e) => {
        if (!on) return;
        if (e.status === 404 && !isLegacyInterviews()) setF(blank);
        else setErr(e.status === 404 ? "Score cards need the data service update. Ask the Anobyt team to deploy it." : e.message);
      },
    );
    return () => {
      on = false;
    };
  }, [interview]);

  if (err && !f) return <p className="note bad">{err}</p>;
  if (!f) return <p className="note">Loading…</p>;

  const overall = overallPercent(f.sections);
  const b = band(overall);
  const setSec = (k) => (e) => setF({ ...f, sections: { ...f.sections, [k]: e.target.value } });

  async function save(publish) {
    setErr("");
    const bad = SECTIONS.find(([k]) => f.sections[k] !== "" && (Number(f.sections[k]) < 0 || Number(f.sections[k]) > 10));
    if (bad) return setErr(`${bad[1]} must be between 0 and 10.`);
    if (overall === null) return setErr("Score at least one section.");
    const body = toRequest({ ...f, areasToImprove: f.areasToImprove.trim() ? f.areasToImprove : suggestAreas(f.sections, f.interest).join("\n") });
    setBusy(publish ? "publish" : "save");
    let r = await act(setErr, () => interviewApi.saveScorecard(interview.id, body));
    if (r && publish) r = await act(setErr, () => interviewApi.publish(interview.id, true));
    setBusy("");
    if (r) onSaved(r, publish);
  }

  return (
    <form onSubmit={(e) => (e.preventDefault(), save(false))}>
      <dl className="kv" style={{ marginTop: 0 }}>
        <dt>Interview</dt>
        <dd>
          {interviewLabel(interview)} · {ordinal(interview.studentInterviewNo)} interview of {interview.studentName}
        </dd>
        <dt>Interviewer</dt>
        <dd>{interview.mentorName}</dd>
      </dl>
      <div className="two" style={{ marginTop: 10 }}>
        <Field label="Interview duration (minutes)">
          <input className="inp" type="number" min="1" max="600" value={f.interviewDurationMinutes} onChange={(e) => setF({ ...f, interviewDurationMinutes: e.target.value })} />
        </Field>
        <Field label="Interest">
          <div className="row" style={{ gap: 8 }}>
            {Object.entries(INTEREST).map(([k, v]) => (
              <button key={k} type="button" className={`chip${f.interest === k ? " on" : ""}`} onClick={() => setF({ ...f, interest: f.interest === k ? "" : k })}>
                {v}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <label className="l" style={{ marginTop: 14 }}>Scores (out of 10, leave empty if not assessed)</label>
      <div className="score-grid">
        {SECTIONS.map(([k, label]) => (
          <label key={k} className="score-in">
            <span>{label}</span>
            <input className="inp" type="number" min="0" max="10" step="0.5" inputMode="decimal" value={f.sections[k]} onChange={setSec(k)} aria-label={`${label} out of 10`} />
          </label>
        ))}
      </div>
      <p style={{ margin: "12px 0 0" }}>
        Overall: <b>{overall === null ? "—" : `${overall}%`}</b> {overall !== null && <span className={`tag ${b.tone}`}>{b.label}</span>}
      </p>

      <Field label="Remarks for the student">
        <textarea className="inp" rows={3} value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} maxLength={5000} />
      </Field>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "end", marginTop: 12 }}>
        <label className="l" style={{ margin: 0 }}>Areas to improve (one per line)</label>
        <button type="button" className="linkish" onClick={() => setF({ ...f, areasToImprove: suggestAreas(f.sections, f.interest).join("\n") })}>
          <Sparkles className="h-3.5 w-3.5" style={{ display: "inline", verticalAlign: -2 }} /> Suggest from scores
        </button>
      </div>
      <textarea
        className="inp"
        rows={4}
        value={f.areasToImprove}
        onChange={(e) => setF({ ...f, areasToImprove: e.target.value })}
        placeholder="Left empty, it's filled from the low-scoring sections when you save."
      />

      {err && <p className="note bad">{err}</p>}
      <div className="row" style={{ marginTop: 16, gap: 10 }}>
        <button className="btn" disabled={!!busy}>
          {busy === "save" ? "Saving…" : existing ? "Save changes" : "Save score card"}
        </button>
        {!existing?.published && (
          <button type="button" className="btn ghost" disabled={!!busy} onClick={() => save(true)}>
            {busy === "publish" ? "Publishing…" : "Save and publish"}
          </button>
        )}
      </div>
      {existing?.published ? (
        <p className="note ok" style={{ fontSize: 13 }}>Published. The student sees changes as soon as you save.</p>
      ) : (
        interview.status !== "DONE" && <p className="note" style={{ fontSize: 13 }}>Saving the score card marks the interview Done.</p>
      )}
    </form>
  );
}
