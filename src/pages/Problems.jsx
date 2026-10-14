import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, BookOpenCheck, CheckCircle2, Crown, GraduationCap, Lock, Unlock } from "lucide-react";
import { Head, Page } from "../components/ui";
import Upgrade from "../components/Upgrade";
import { usePractice, useSolved } from "../lib/problemBank";
import { usePageSEO } from "../lib/seo";

// Old /problems/<book> links open that topic on its year page.
const BOOK_YEAR = { ops: 1, ascii: 1, ifelse: 1, loops: 1, pattern: 1, rec: 1, func: 1, arr: 1, str: 1, ll: 1, med: 2, adv: 3, hard: 4 };

const PLATFORMS = [
  ["https://leetcode.com/problemset/", "LeetCode", "Large problem set with company-tagged questions"],
  ["https://www.hackerrank.com/domains", "HackerRank", "Structured tracks by domain and language"],
  ["https://www.hackerearth.com/practice/", "HackerEarth", "Practice problems and hiring challenges"],
];

const JOURNEY = [
  [GraduationCap, "Pick your year", "Problems are arranged for 1st, 2nd, 3rd and 4th year."],
  [BookOpenCheck, "Solve free problems", "Every year starts with free problems in every topic. No payment needed."],
  [Unlock, "Unlock premium", "Get every premium problem, plus solutions where your year allows."],
  [CheckCircle2, "Track your progress", "Each accepted solution is saved to your dashboard."],
];

export default function Problems() {
  const { bookId } = useParams();
  const { data, error } = usePractice();
  const solved = useSolved();

  usePageSEO({
    title: "Coding practice by year",
    description: "Year-wise coding practice for B.Tech students: free problems in every topic, premium problems with solutions, and an online editor that checks your code.",
    path: "/problems",
  });

  if (bookId) return <Navigate replace to={`/problems/year/${BOOK_YEAR[bookId] || 1}#${bookId}`} />;

  const totalFree = data?.years.reduce((n, y) => n + y.free, 0) || 0;
  const total = data?.years.reduce((n, y) => n + y.total, 0) || 0;

  return (
    <Page>
      <Head eyebrow="Coding practice" title="Choose your year and start solving">
        Problems are arranged by academic year. Free problems are marked <span className="badge free">FREE</span> and premium ones <span className="badge prem">PREMIUM</span>, so you always know what you can open.
      </Head>

      <ol className="jsteps">
        {JOURNEY.map(([Icon, t, x], i) => (
          <li key={t}>
            <span className="jsteps-n">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <small>Step {i + 1}</small>
              <b>{t}</b>
              <p>{x}</p>
            </div>
          </li>
        ))}
      </ol>

      {error && <p className="note bad">{error}</p>}
      <div className="year-cards">
        {(data?.years || [1, 2, 3, 4].map((y) => ({ year: y, title: `Year ${y}`, loading: true }))).map((y) => {
          if (y.loading) return <div key={y.year} className="year-card skeleton" />;
          const premium = y.total - y.free;
          return (
            <Link key={y.year} to={`/problems/year/${y.year}`} className="year-card">
              <div className="yc-top">
                <span className="yc-num">{y.year}</span>
                <h2>{y.title}</h2>
              </div>
              <p>{y.blurb}</p>
              <div className="yc-stats">
                <span>
                  <b>{y.total}</b> problems
                </span>
                <span className="badge free">{y.free} FREE</span>
                {premium > 0 && (
                  <span className="badge prem">
                    <Lock className="h-3 w-3" /> {premium} PREMIUM
                  </span>
                )}
              </div>
              <small className="yc-rule">{y.solutions}</small>
              <span className="yc-go">
                Open {y.title} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </div>

      {data &&
        (data.unlocked && data.plan.practice.paid ? (
          <div className="plan-strip ok">
            <Crown className="h-5 w-5" />
            <div>
              <b>Premium practice is active on your account.</b> All {total} problems are open.
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 40 }}>
            <Upgrade
              plan={data.plan}
              title={`${totalFree} problems are free. Unlock all ${total}.`}
              text="The free plan gives you a quarter of every year's problems, spread over every topic. Premium opens the rest, with solutions where your year allows."
            />
          </div>
        ))}

      {solved.size > 0 && (
        <p className="note" style={{ marginTop: 18 }}>
          You've solved {solved.size} problem{solved.size > 1 ? "s" : ""} so far. <Link to="/dashboard" className="linkish">See your dashboard</Link>
        </p>
      )}

      <Head title="Want more practice?" style={{ margin: "56px 0 20px" }}>
        For a wider library, keep practising on these platforms too.
      </Head>
      <div className="more">
        {PLATFORMS.map(([href, name, text]) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer">
            <b>{name}</b>
            <span>{text}</span>
          </a>
        ))}
      </div>
    </Page>
  );
}
