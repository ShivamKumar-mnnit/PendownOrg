import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, CircleDot, Clock, Crown, Flag, Loader2, Lock, Medal, PlayCircle, RotateCcw, Timer, Trophy } from "lucide-react";
import { cvMockFinish, cvMockStart, useCv } from "../../lib/codevita/api";
import { usePageSEO } from "../../lib/seo";
import { HomeUpgrade, dClass, mins, when } from "./HubSections";
import "./codevita.css";

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n) => String(n).padStart(2, "0");
  return `${h ? `${h}:` : ""}${pad(m)}:${pad(s % 60)}`;
};
const dur = (sec) => (sec >= 3600 ? `${Math.floor(sec / 3600)} h ${Math.floor((sec % 3600) / 60)} min` : `${Math.max(1, Math.round(sec / 60))} min`);

/** Remaining time from the server's clock, so a wrong device clock can't stretch the test. */
function useCountdown(endsAt, serverNow, onEnd) {
  const [offset] = useState(() => (serverNow ? serverNow - Date.now() : 0));
  const [left, setLeft] = useState(() => (endsAt ? endsAt - (Date.now() + offset) : 0));
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const l = endsAt - (Date.now() + offset);
      setLeft(l);
      if (l <= 0) onEnd?.();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, offset]);
  return left;
}

/** /codevita/mock/:id: lobby, live round and report for one mock test. */
export default function MockPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [bump, setBump] = useState(0);
  const { data, error } = useCv(`/api/cv/mocks/${encodeURIComponent(id)}`, bump);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [upgrade, setUpgrade] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const m = data?.mock;
  usePageSEO({
    title: m ? `${m.title} · CodeVita mock test` : "CodeVita mock test",
    description: m?.summary || "A timed CodeVita-style mock test on Anobyt.",
    path: `/codevita/mock/${id}`,
  });

  if (error)
    return (
      <section className="page cv-page">
        <div className="wrap cv-lesson-wrap">
          <div className="cv-empty">
            <Timer className="h-6 w-6" />
            <p>{error}</p>
            <Link className="btn ghost" to="/codevita?tab=mocks">
              All mock tests
            </Link>
          </div>
        </div>
      </section>
    );
  if (!data)
    return (
      <section className="page cv-page">
        <div className="wrap cv-lesson-wrap">
          <p className="note">Loading mock test…</p>
        </div>
      </section>
    );

  const a = data.attempt;
  const live = a && !a.finishedAt && a.endsAt > data.now;
  const refresh = () => setBump((n) => n + 1);

  const start = async () => {
    if (!data.signedIn) return nav(`/account?next=${encodeURIComponent(`/codevita/mock/${id}`)}`);
    if (m.locked) return setUpgrade(true);
    setBusy("start");
    setMsg("");
    try {
      await cvMockStart(id);
      refresh();
    } catch (e) {
      setMsg(e.message);
    }
    setBusy("");
  };
  const finish = async () => {
    setBusy("finish");
    setMsg("");
    try {
      await cvMockFinish(id);
      setConfirmEnd(false);
      refresh();
    } catch (e) {
      setMsg(e.message);
    }
    setBusy("");
  };

  return (
    <section className="page cv-page">
      <div className="wrap cv-lesson-wrap">
        <nav className="cv-crumbs" aria-label="Breadcrumb">
          <Link to="/codevita">CodeVita Crash Course</Link> <span>/</span> <Link to="/codevita?tab=mocks">Mock tests</Link> <span>/</span> <b>{m.title}</b>
        </nav>

        {live ? (
          <LiveRound key={a.id} data={data} mockId={id} onEnd={refresh} onFinish={() => setConfirmEnd(true)} />
        ) : (
          <Lobby m={m} a={a} data={data} busy={busy} onStart={start} onUpgrade={() => setUpgrade(true)} />
        )}
        {msg && <p className="note bad">{msg}</p>}

        {!live && a?.finishedAt && <Report data={data} />}
        {!live && data.history.length > 0 && <History items={data.history} />}
        <Board data={data} />
      </div>

      {confirmEnd && (
        <div className="cv-modal-back" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setConfirmEnd(false)}>
          <div className="cv-modal small" role="dialog" aria-modal="true" aria-labelledby="cv-end-title">
            <h2 id="cv-end-title">Finish the mock test now?</h2>
            <p className="cv-muted">Your score is final once you finish. Problems you haven't solved score zero. You can retake the test later, but only your first attempt goes on the leaderboard.</p>
            <div className="cv-hero-cta">
              <button type="button" className="btn" onClick={finish} disabled={busy === "finish"}>
                {busy === "finish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />} Finish and see report
              </button>
              <button type="button" className="btn ghost" onClick={() => setConfirmEnd(false)}>
                Keep going
              </button>
            </div>
          </div>
        </div>
      )}
      {upgrade && <HomeUpgrade problem={null} onClose={() => setUpgrade(false)} onDone={() => (setUpgrade(false), refresh())} />}
    </section>
  );
}

function Lobby({ m, a, data, busy, onStart, onUpgrade }) {
  const retake = Boolean(a?.finishedAt);
  return (
    <header className="cv-mock-lobby">
      <div>
        <div className="cv-lcard-top">
          {m.access === "free" ? <span className="cv-pill good">Free</span> : <span className="cv-pill gold">{m.locked ? <Lock className="h-3 w-3" /> : <Crown className="h-3 w-3" />} Premium</span>}
          <small>
            <Clock className="h-3.5 w-3.5" /> {mins(m.minutes)}
          </small>
        </div>
        <h1>{m.title}</h1>
        <p className="cv-muted cv-lead">{m.summary}</p>
        <div className="cv-hero-facts">
          <span>
            <b>{m.count}</b> problems
          </span>
          <span>
            <b>{m.maxScore}</b> points
          </span>
          {["Easy", "Medium", "Hard"].map((d) =>
            m.mix?.[d] ? (
              <span key={d}>
                <i className={`cv-dot ${dClass(d)}`} /> {m.mix[d]} {d}
              </span>
            ) : null,
          )}
        </div>
        <div className="cv-hero-cta">
          {m.locked ? (
            <button type="button" className="btn" onClick={onUpgrade}>
              <Crown className="h-4 w-4" /> Unlock this mock test
            </button>
          ) : (
            <button type="button" className="btn" onClick={onStart} disabled={busy === "start"}>
              {busy === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : retake ? <RotateCcw className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              {!data.signedIn ? "Sign in to start" : retake ? "Retake the test" : "Start the test"}
            </button>
          )}
          <Link className="btn ghost" to="/codevita?tab=mocks">
            All mock tests
          </Link>
        </div>
      </div>
      <aside className="cv-panel cv-rules">
        <h2>
          <AlertTriangle className="h-5 w-5" /> Before you start
        </h2>
        <ul>
          <li>The clock starts when you press Start and keeps running if you close the page.</li>
          <li>Problem titles appear only after you start. Solve them in any order.</li>
          <li>Hints, editorials and solutions are hidden until the test ends.</li>
          <li>Each problem scores by the share of hidden test cases you pass. Your best submission counts.</li>
          <li>When time runs out the test ends on its own and your report opens here.</li>
          <li>Only your first attempt goes on the leaderboard. Retakes still get a full report.</li>
        </ul>
      </aside>
    </header>
  );
}

function LiveRound({ data, mockId, onEnd, onFinish }) {
  const a = data.attempt;
  const left = useCountdown(a.endsAt, data.now, onEnd);
  const total = a.endsAt - a.startedAt;
  const urgent = left < 10 * 60000;
  return (
    <div className="cv-mock-live">
      <div className={`cv-mock-clock${urgent ? " urgent" : ""}`}>
        <div>
          <small>Time left</small>
          <b>{clock(left)}</b>
          <div className="cv-bar">
            <span style={{ width: `${total ? Math.max(0, (left / total) * 100) : 0}%` }} />
          </div>
        </div>
        <div>
          <small>Score</small>
          <b>
            {a.score}
            <em>/{data.mock.maxScore}</em>
          </b>
        </div>
        <div>
          <small>Solved</small>
          <b>
            {a.solved}
            <em>/{data.problems.length}</em>
          </b>
        </div>
        <button type="button" className="btn ghost" onClick={onFinish}>
          <Flag className="h-4 w-4" /> Finish test
        </button>
      </div>
      <h2 className="cv-mock-h">{data.mock.title}: problems</h2>
      <ol className="cv-mock-problems">
        {data.problems.map((p, i) => (
          <li key={p.id}>
            <Link to={`/codevita/solve/${p.id}?mock=${encodeURIComponent(mockId)}`}>
              <span className="cv-mock-n">{String.fromCharCode(65 + i)}</span>
              <div>
                <b>{p.title}</b>
                <small>
                  <span className={`cv-diff ${dClass(p.difficulty)}`}>{p.difficulty}</span> {p.topics.slice(0, 2).join(" · ")}
                </small>
              </div>
              <span className="cv-mock-st">
                {p.status === "Accepted" ? <CheckCircle2 className="h-5 w-5 good" /> : p.status ? <CircleDot className="h-5 w-5 warn" /> : <Circle className="h-5 w-5 faint" />}
                {p.score}/{p.points}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </li>
        ))}
      </ol>
      <p className="cv-fine">Open a problem, write your code and submit. Come back here to switch problems or finish early.</p>
    </div>
  );
}

function Report({ data }) {
  const a = data.attempt;
  const pct = data.mock.maxScore ? Math.round((a.score / data.mock.maxScore) * 100) : 0;
  const verdict = pct >= 80 ? "Contest-ready on this set." : pct >= 50 ? "Good base. Close the gaps below before the next mock." : "Work through the lessons for the topics below, then retake.";
  const missed = data.problems.filter((p) => p.status !== "Accepted");
  return (
    <section className="cv-panel cv-mock-report">
      <h2>
        <Trophy className="h-5 w-5" /> Your report
      </h2>
      <div className="cv-kpis">
        <div>
          <small>Score</small>
          <b>
            {a.score}
            <em>/{data.mock.maxScore}</em>
          </b>
        </div>
        <div>
          <small>Solved</small>
          <b>
            {a.solved}
            <em>/{data.problems.length}</em>
          </b>
        </div>
        <div>
          <small>Time used</small>
          <b>{dur(Math.round((a.finishedAt - a.startedAt) / 1000))}</b>
        </div>
        <div>
          <small>Rank</small>
          <b>{data.myRank ? `#${data.myRank.rank}` : "—"}</b>
        </div>
      </div>
      <p className="cv-muted">{verdict}</p>
      <table className="cv-ttable">
        <thead>
          <tr>
            <th>Problem</th>
            <th>Level</th>
            <th>Result</th>
            <th>Score</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.problems.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>
                <span className={`cv-diff ${dClass(p.difficulty)}`}>{p.difficulty}</span>
              </td>
              <td>{p.status || "Not attempted"}</td>
              <td>
                {p.score}/{p.points}
              </td>
              <td className="cv-row-links">
                {p.subId && <Link to={`/codevita/report/${p.subId}`}>Scorecard</Link>}
                <Link to={`/codevita/solve/${p.id}`}>Editorial</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {missed.length > 0 && (
        <p className="cv-hint">
          <b>Practise next:</b> {[...new Set(missed.flatMap((p) => p.topics))].slice(0, 4).map((t, i) => (
            <span key={t}>
              {i ? ", " : ""}
              <Link to={`/codevita?tab=practice&topic=${encodeURIComponent(t)}`}>{t}</Link>
            </span>
          ))}
          . Editorials are open now that the test is over.
        </p>
      )}
    </section>
  );
}

function History({ items }) {
  return (
    <section className="cv-panel">
      <h2>
        <RotateCcw className="h-5 w-5" /> Your attempts
      </h2>
      <table className="cv-ttable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Score</th>
            <th>Solved</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={h.id}>
              <td>{when(h.finishedAt)}</td>
              <td>
                {h.score}/{h.max}
              </td>
              <td>
                {h.solved}/{h.total}
              </td>
              <td>{dur(h.timeSec)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Board({ data }) {
  return (
    <section className="cv-panel">
      <h2>
        <Medal className="h-5 w-5" /> Leaderboard
      </h2>
      {data.board.length ? (
        <>
          <table className="cv-ttable cv-board">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Score</th>
                <th>Solved</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.board.map((r) => (
                <tr key={r.rank} className={r.me ? "me" : ""}>
                  <td>{r.rank}</td>
                  <td>{r.me ? "You" : r.name}</td>
                  <td>
                    {r.score}/{r.max}
                  </td>
                  <td>{r.solved}</td>
                  <td>{dur(r.timeSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.myRank && data.myRank.rank > 20 && <p className="cv-fine">Your rank: #{data.myRank.rank} of {data.boardSize}.</p>}
        </>
      ) : (
        <p className="cv-muted">No one has finished this mock test yet. Be the first on the board.</p>
      )}
    </section>
  );
}
