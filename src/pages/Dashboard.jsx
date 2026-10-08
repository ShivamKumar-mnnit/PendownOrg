import { useState } from "react";
import { Link } from "react-router-dom";
import { Head, Cards, Page } from "../components/ui";
import { PROBLEMS, BOOK_NAMES, difficultyClass } from "../lib/problems";
import { LEADERBOARD, REWARDS, getStudent, saveStudent, logOutStudent } from "../lib/student";
import { usePageSEO } from "../lib/seo";

function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const n = name.trim();
    const e = id.trim();
    if (!n || !e) {
      setError("Enter your name and email or roll number.");
      return;
    }
    onLogin({ name: n, id: e, solved: 0 });
  }

  return (
    <Page narrow={520}>
      <Head title="Student login">Log in to track the problems you solve, see your rank and unlock rewards.</Head>
      <div className="panel">
        <label className="l" htmlFor="ln" style={{ marginTop: 0 }}>
          Full name
        </label>
        <input id="ln" className="inp" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="l" htmlFor="le">
          College email or roll number
        </label>
        <input id="le" className="inp" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        <div className="row" style={{ marginTop: 18 }}>
          <button type="button" className="btn" onClick={submit}>
            Log in
          </button>
        </div>
        {error && (
          <div className="note">
            <span className="bad">{error}</span>
          </div>
        )}
        <div className="note">Demo login, saved only in this browser. Real accounts and a shared leaderboard are not connected yet.</div>
      </div>
    </Page>
  );
}

function PracticeProgress({ user }) {
  const done = user.done || {};
  const recent = Object.keys(done)
    .map((id) => PROBLEMS.find((p) => p.id === id))
    .filter(Boolean)
    .slice(-8)
    .reverse();

  return (
    <>
      <Head title="Practice problems" style={{ margin: "56px 0 24px" }} />
      <div className="cards">
        {["Easy", "Medium", "Advanced"].map((d) => {
          const all = PROBLEMS.filter((p) => p.d === d);
          const n = all.filter((p) => done[p.id]).length;
          return (
            <div className="card" key={d}>
              <div className="meta">
                <span className={`tag ${difficultyClass(d)}`}>{d}</span>
                <small>
                  {n} of {all.length} solved
                </small>
              </div>
              <div className="bar2" style={{ margin: "14px 0 0" }}>
                <b style={{ width: `${Math.round((n / all.length) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {recent.length ? (
        <div className="panel" style={{ marginTop: 18 }}>
          <b>Recently solved</b>
          <ul className="ck">
            {recent.map((p) => (
              <li key={p.id}>
                <Link to={`/problem/${p.id}`} style={{ color: "var(--color-fg)" }}>
                  {p.t}
                </Link>{" "}
                ({BOOK_NAMES[p.b]}, {p.d})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="note" style={{ marginTop: 14 }}>
          Solve a practice problem and it shows up here.{" "}
          <Link to="/problems" style={{ color: "var(--color-accent)" }}>
            Browse problems
          </Link>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  usePageSEO({
    title: "Dashboard",
    description: "Track the problems you solve, see your rank and unlock rewards.",
    path: "/dashboard",
  });

  const [user, setUser] = useState(getStudent);

  function update(next) {
    if (next) saveStudent(next);
    else logOutStudent();
    setUser(next);
  }

  if (!user) return <Login onLogin={update} />;

  const all = LEADERBOARD.concat([[user.name, user.solved]]).sort((a, b) => b[1] - a[1]);
  const isMe = (x) => x[0] === user.name && x[1] === user.solved;
  const rank = all.findIndex(isMe) + 1;
  const next = REWARDS.find((r) => r[0] > user.solved);
  const prev = REWARDS.filter((r) => r[0] <= user.solved).pop();
  const base = prev ? prev[0] : 0;
  const pct = next ? Math.round(((user.solved - base) / (next[0] - base)) * 100) : 100;

  return (
    <Page>
      <Head title={`Welcome, ${user.name}`}>Your progress, rank and rewards.</Head>
      <Cards
        items={[
          ["✅", `${user.solved} problems solved`, "Questions you answered correctly"],
          ["🏅", `Rank #${rank}`, `out of ${all.length} students`],
          ["🎯", next ? `${next[0] - user.solved} to go` : "All rewards unlocked", next ? `Next reward: ${next[2]}` : "You have unlocked every reward"],
        ]}
      />
      <div className="panel" style={{ marginTop: 18 }}>
        <b>{next ? `Progress to ${next[2]}` : "Top tier reached"}</b>
        <div className="bar2" style={{ marginBottom: 0 }}>
          <b style={{ width: `${pct}%` }} />
        </div>
      </div>

      <PracticeProgress user={user} />

      <Head title="Rewards" style={{ margin: "56px 0 24px" }} />
      <div className="cards">
        {REWARDS.map(([at, icon, title]) => {
          const on = user.solved >= at;
          return (
            <div className="card" key={title} style={{ opacity: on ? 1 : 0.55 }}>
              <div className="ic">{icon}</div>
              <h3>{title}</h3>
              <p>{on ? "Unlocked" : `Unlocks at ${at} problems`}</p>
            </div>
          );
        })}
      </div>

      <Head title="Leaderboard" style={{ margin: "56px 0 24px" }} />
      <div className="panel" style={{ padding: 8 }}>
        {all.map((x, i) => {
          const me = isMe(x);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 10,
                ...(me ? { background: "var(--ab-soft)", fontWeight: 600 } : {}),
              }}
            >
              <span>
                #{i + 1} {x[0]}
                {me ? " (you)" : ""}
              </span>
              <b>{x[1]}</b>
            </div>
          );
        })}
      </div>

      <div className="row" style={{ marginTop: 28 }}>
        <button type="button" className="btn ghost" onClick={() => update({ ...user, solved: user.solved + 1 })}>
          Demo: add 1 solved
        </button>
        <button type="button" className="btn ghost" onClick={() => update({ ...user, solved: user.solved + 10 })}>
          Demo: add 10 solved
        </button>
        <button type="button" className="btn ghost" onClick={() => update(null)}>
          Log out
        </button>
      </div>
      <div className="note">Problems also count automatically when you submit a practice test or solve a practice problem while logged in.</div>
    </Page>
  );
}
