// Runs after `vite build`. The site is a single-page React app, so without this every URL served
// the same empty <div id="root"> with canonical = the home page: Google saw every page as a copy
// of the home page, and AI crawlers (which don't run JavaScript) saw nothing at all.
//
// For every public page this writes dist/<path>.html with its own title, description,
// canonical URL, Open Graph tags, structured data (JSON-LD) and the page's real text inside
// #root. React replaces that text with the app as soon as it loads (createRoot().render), so
// visitors see the same site as before. It also writes sitemap.xml, robots.txt, llms.txt,
// llms-full.txt and app.html (the shell for every other route).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPANIES, COMPANY_DISCLAIMER } from "../src/lib/companyPrep.js";
import { DEFAULT_COURSES, DEFAULT_FAQS } from "../src/lib/content/defaults.js";

const SITE = "https://anobyt.in";
const NAME = "Anobyt";
const ALT_NAMES = ["AnoByt", "Ano Byt", "Anobyt.in", "anobyt.in"];
const EMAILS = ["contact@anobyt.in", "anobyt@anobyt.in"];
const PHONE = "+91-70179-03175";
const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const TODAY = new Date().toISOString().slice(0, 10);
const UPDATED = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

// ---------------------------------------------------------------- helpers

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const p = (t) => `<p>${esc(t)}</p>`;
const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const a = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
const clip = (s, n = 158) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).replace(/\s+\S*$/, "")}…`;
};

/** Live content from the site's own API at build time, falling back to the defaults in the repo. */
async function live(col, fallback) {
  try {
    const ctl = AbortSignal.timeout(8000);
    const r = await fetch(`${SITE}/api/content/${col}`, { signal: ctl });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    const items = (d.items || []).filter((x) => x.published !== false);
    return items.length ? items : fallback;
  } catch (e) {
    console.warn(`prerender: using built-in ${col} (${e.message})`);
    return fallback;
  }
}

// ---------------------------------------------------------------- structured data

const ORG = {
  "@type": ["Organization", "EducationalOrganization"],
  "@id": `${SITE}/#organization`,
  name: NAME,
  alternateName: ALT_NAMES,
  url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: `${SITE}/anobyt-icon.svg` },
  image: `${SITE}/og-image.png`,
  description:
    "Anobyt helps college students get placement-ready with 1:1 mock interviews, mentorship from working professionals, year-wise coding practice, an online compiler, tests and company-wise hiring guides. Colleges can onboard whole batches.",
  email: EMAILS[0],
  telephone: PHONE,
  areaServed: { "@type": "Country", name: "India" },
  contactPoint: EMAILS.map((email) => ({ "@type": "ContactPoint", contactType: "customer support", email, telephone: PHONE, areaServed: "IN", availableLanguage: ["English", "Hindi"] })),
  knowsAbout: ["Mock interviews", "Campus placements", "Data structures and algorithms", "Coding interview preparation", "Mentorship", "Resume review"],
};
const WEBSITE = { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: NAME, alternateName: ALT_NAMES, publisher: { "@id": `${SITE}/#organization` }, inLanguage: "en-IN" };

const crumbs = (trail) => ({
  "@type": "BreadcrumbList",
  itemListElement: [["Home", "/"], ...trail].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${path}` })),
});
const faqLd = (faqs) => ({
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

// ---------------------------------------------------------------- pages

const NAV = [
  ["/", "Home"],
  ["/book", "Book a mock interview"],
  ["/mentors", "Mentorship"],
  ["/problems", "Coding practice"],
  ["/compiler", "Online compiler"],
  ["/practice", "Tests"],
  ["/codevita", "TCS CodeVita Crash Course"],
  ["/companies", "Company hiring guides"],
  ["/courses", "Courses"],
  ["/placement", "Placement guide"],
  ["/colleges", "For colleges"],
  ["/talks", "Tech talks"],
  ["/premium", "Plans"],
  ["/junior", "Anobyt Junior (schools)"],
  ["/about", "About and contact"],
  ["/faq", "FAQ"],
];

function pages({ faqs, courses, events }) {
  const list = [];
  const add = (pg) => list.push(pg);

  add({
    path: "/",
    title: "Anobyt | Mock Interviews & Mentorship for College Students",
    description:
      "Anobyt helps college students crack placements: 1:1 mock interviews with industry mentors, coding practice, an online compiler, tests and hiring guides.",
    h1: "Anobyt: mock interviews and mentorship for college students",
    priority: "1.0",
    body: [
      p("Anobyt (anobyt.in) helps college students in India get ready for campus placements and internships. Practise with 1:1 mock interviews, learn from working professionals, and build your coding skills with year-wise problems, tests and an online compiler."),
      "<h2>What you can do on Anobyt</h2>",
      ul([
        `${a("/book", "Book a 1:1 mock interview or mentorship session")} matched to your domain: SDE, Data / AI, Product, Consulting and more.`,
        `${a("/problems", "Practise coding by year")}, with free problems in every topic and an editor that checks your code.`,
        `${a("/compiler", "Run code online")} in Python, JavaScript, Java, C and C++, with no sign-up.`,
        `${a("/practice", "Take MCQ and coding tests")} with instant scores and explanations.`,
        `${a("/companies", "Read company-wise hiring guides")}: rounds, topics to prepare and tips for ${COMPANIES.length}+ recruiters.`,
        `${a("/courses", "Follow learning tracks")} for every year of college, and the ${a("/placement", "placement guide")}.`,
        `${a("/colleges", "Colleges and placement cells")} can onboard a whole batch for tests, mock interviews and score cards.`,
      ]),
      "<h2>Frequently asked questions</h2>",
      ...faqs.slice(0, 6).map((f) => `<h3>${esc(f.q)}</h3>${p(f.a)}`),
      `<h2>Contact Anobyt</h2>${p(`Email ${EMAILS.join(" or ")}.`)}`,
    ],
    ld: [faqLd(faqs.slice(0, 6))],
  });

  add({
    path: "/book",
    title: "Book a Mock Interview or Mentorship Session",
    description: "Register for a 1:1 mock interview or mentorship session on Anobyt. Tell us your domain and we'll match you with a mentor and confirm your slot.",
    h1: "Book a 1:1 mock interview or mentorship session",
    body: [
      p("Choose a mock interview, mentorship or resume review, pick your domain (SDE, Data / AI, Product, Consulting, Cybersecurity and more), and we'll match you with a working professional and confirm your slot."),
      ul(["Real interview format with a professional from your domain", "Clear feedback on what to improve", "First-timers welcome: sessions start from where you are"]),
    ],
  });

  add({
    path: "/mentors",
    title: "Mentorship and Sessions",
    description: "1:1 mock interviews, mentorship and resume reviews with working professionals on Anobyt, matched to your domain: SDE, Data / AI, Product, Consulting and more.",
    h1: "Mentorship and mock interview sessions",
    body: [p("Anobyt sessions pair you with working professionals for mock interviews, career mentorship and resume reviews, matched to the domain you want to work in."), p(`${a("/book", "Book a session")} to get started.`)],
  });

  add({
    path: "/colleges",
    title: "For Colleges & Placement Cells: Bulk Onboarding",
    description: "Onboard your college's students on Anobyt for proctored tests, 1:1 mock interviews and section-wise score cards. Upload a list; we create the logins.",
    h1: "Anobyt for colleges and placement cells",
    body: [
      p("Placement cells and colleges can onboard a whole batch at once. Upload your student list and Anobyt creates logins, runs proctored MCQ and coding tests, schedules 1:1 mock interviews with trainers, and shares section-wise score cards."),
      ul(["Bulk student onboarding with college ID logins", "Proctored tests with ranks and analytics", "Mock interviews with recordings and score cards", "Exportable reports for the placement cell"]),
    ],
  });

  add({
    path: "/compiler",
    title: "Online Code Compiler: Python, JavaScript, Java, C, C++",
    description: "Free online compiler and code editor from Anobyt. Write and run Python, JavaScript, Java, C and C++ in your browser, with custom input and no sign-up.",
    h1: "Free online compiler",
    body: [p("Write and run Python, JavaScript, Java, C and C++ code in your browser. Add your own input, see the output and errors explained in plain language. No sign-up needed.")],
  });

  add({
    path: "/problems",
    title: "Coding Practice by Year",
    description: "Year-wise coding practice for B.Tech students on Anobyt: free problems in every topic, premium problems with solutions, and an online editor that checks your code.",
    h1: "Coding practice by year",
    body: [p("Problems arranged by year of college and topic, from programming basics to data structures, algorithms and interview-level questions. Solve them in the browser and check your answer against test cases."), ul([1, 2, 3, 4].map((y) => a(`/problems/year/${y}`, `${["1st", "2nd", "3rd", "4th"][y - 1]} year problems`)))],
  });
  [1, 2, 3, 4].forEach((y) => {
    const yr = ["1st", "2nd", "3rd", "4th"][y - 1];
    add({
      path: `/problems/year/${y}`,
      title: `${yr} Year Coding Problems`,
      description: `${yr} year coding practice on Anobyt: free and premium problems by topic, with an online editor that checks your code.`,
      h1: `${yr} year coding problems`,
      priority: "0.6",
      body: [p(`Coding problems for ${yr} year students, grouped by topic, with sample tests and an editor that runs your code.`), p(a("/problems", "All years"))],
      ld: [crumbs([["Coding practice", "/problems"], [`${yr} year`, `/problems/year/${y}`]])],
    });
  });

  add({
    path: "/codevita",
    title: "TCS CodeVita Crash Course: Lessons, Practice, Mock Tests",
    description: "A complete TCS CodeVita preparation course: lessons on every topic, CodeVita-style problems with hidden tests, solutions in C++, Java and Python, timed mock tests and scorecards.",
    h1: "TCS CodeVita Crash Course",
    body: [p("Learn every topic CodeVita tests with structured lessons and coding patterns, then practise and sit timed mock tests."), p("Practise CodeVita-style coding problems in a contest-style environment: problem on the left, editor on the right, C, C++, Java or Python, custom input, sample and hidden test cases, time and memory, and a scorecard after every submission."), p("Anobyt is an independent practice platform and is not affiliated with TCS. Practice scores are not official CodeVita results.")],
  });

  add({
    path: "/practice",
    title: "Tests and Assessments",
    description: "MCQ tests, coding assessments and Olympiad-style papers on Anobyt, with instant scoring, answers and explanations.",
    h1: "Tests and assessments",
    body: [p("Practise with MCQ tests, coding assessments and Olympiad-style papers. Get your score instantly, with the correct answers and explanations.")],
  });

  add({
    path: "/tests",
    title: "Create Tests for Your Students",
    description: "Create proctored MCQ tests for your students on Anobyt, share one link and see every score, rank and analytics. For trainers and colleges.",
    h1: "Create tests for your students",
    priority: "0.5",
    body: [p("Trainers and colleges can build proctored MCQ tests from a question bank, share one link with students, and see scores, ranks and analytics.")],
  });

  add({
    path: "/placement",
    title: "Placement Guide",
    description: "Everything students need for campus placements, from the first resume to the offer letter: aptitude, coding rounds, interviews and company preparation.",
    h1: "Campus placement guide",
    body: [p("A step-by-step guide to campus placements: building your resume, aptitude and coding rounds, technical and HR interviews, and preparing for specific companies."), p(`See also the ${a("/companies", "company hiring guides")} and ${a("/book", "book a mock interview")}.`)],
  });

  add({
    path: "/companies",
    title: "Companies and Their Hiring Process",
    description: `Hiring process guides for ${COMPANIES.length} companies on Anobyt: typical rounds, topics to prepare and tips, from TCS and Infosys to Amazon, Google and Microsoft.`,
    h1: "Company-wise hiring process guides",
    body: [p(`Typical hiring rounds, topics to prepare and tips for ${COMPANIES.length} companies that hire freshers.`), ul(COMPANIES.map((c) => `${a(`/companies/${c.id}`, `${c.name} hiring process`)}: ${esc(c.category)}`))],
  });
  for (const c of COMPANIES)
    add({
      path: `/companies/${c.id}`,
      title: `${c.name} Hiring Process and Interview Rounds`,
      description: clip(`${c.name} hiring process for freshers: ${c.rounds.map((r) => r.title).join(", ")}. ${c.summary}`),
      h1: `${c.name} hiring process`,
      priority: "0.6",
      changefreq: "monthly",
      body: [
        p(c.summary),
        "<h2>Typical rounds</h2>",
        `<ol>${c.rounds.map((r) => `<li><strong>${esc(r.title)}</strong>: ${esc(r.detail)}</li>`).join("")}</ol>`,
        "<h2>Topics to prepare</h2>",
        ul(c.topics.map(esc)),
        "<h2>Tip</h2>",
        p(c.tip),
        `<p><small>${esc(COMPANY_DISCLAIMER)}</small></p>`,
        p(`${a("/book", `Book a mock interview for ${c.name}`)} · ${a("/companies", "All companies")}`),
      ],
      ld: [crumbs([["Companies", "/companies"], [c.name, `/companies/${c.id}`]])],
    });

  add({
    path: "/courses",
    title: "Courses",
    description: "Free and premium learning tracks on Anobyt for every year of college, from programming foundations to company preparation.",
    h1: "Courses",
    body: [ul(courses.map((c) => `${a(`/courses/${c.id}`, c.title)}${c.summary ? `: ${esc(c.summary)}` : ""}`))],
    ld: [
      {
        "@type": "ItemList",
        itemListElement: courses.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/courses/${c.id}`, name: c.title })),
      },
    ],
  });
  for (const c of courses)
    add({
      path: `/courses/${c.id}`,
      title: c.title,
      description: clip(c.summary || `${c.title}: a learning track on Anobyt.`),
      h1: c.title,
      priority: "0.6",
      body: [c.level ? p(`Level: ${c.level} · ${c.tier === "premium" ? "Premium" : "Free"}`) : "", p(c.summary || ""), p(a("/courses", "All courses"))],
      ld: [
        crumbs([["Courses", "/courses"], [c.title, `/courses/${c.id}`]]),
        { "@type": "Course", name: c.title, description: c.summary || c.title, provider: { "@id": `${SITE}/#organization` }, url: `${SITE}/courses/${c.id}`, isAccessibleForFree: c.tier !== "premium" },
      ],
    });

  add({
    path: "/talks",
    title: "Tech Talks and Events",
    description: "Upcoming tech talks, workshops, webinars and mock interview drives from Anobyt mentors, online and on campus.",
    h1: "Tech talks and events",
    body: [events.length ? ul(events.map((e) => `${a(`/talks/${e.id}`, e.title)}${e.summary ? `: ${esc(e.summary)}` : ""}`)) : p("New talks, workshops and mock interview drives are announced here.")],
  });
  for (const e of events)
    add({
      path: `/talks/${e.id}`,
      title: e.title,
      description: clip(e.summary || e.description || `${e.title}: an Anobyt event.`),
      h1: e.title,
      priority: "0.5",
      body: [p(e.summary || e.description || ""), p(a("/talks", "All events"))],
      ld: [crumbs([["Tech talks", "/talks"], [e.title, `/talks/${e.id}`]])],
    });

  add({
    path: "/faq",
    title: "FAQ",
    description: "Answers to common questions about Anobyt: booking mock interviews, mentors, pricing, rescheduling and onboarding your college.",
    h1: "Frequently asked questions",
    body: faqs.map((f) => `<h2>${esc(f.q)}</h2>${p(f.a)}`),
    ld: [faqLd(faqs)],
  });

  add({
    path: "/about",
    title: "About Anobyt and Contact Us",
    description: "Anobyt helps college students prepare for placements with year-wise coding practice, courses, tests and mock interviews. Contact the Anobyt team.",
    h1: "About Anobyt",
    priority: "0.8",
    body: [
      p("Anobyt (anobyt.in) helps college students prepare for placements and internships with year-wise coding practice, learning modules, tests, company hiring guides and 1:1 mock interviews with working professionals. Colleges use Anobyt to run tests and mock interviews for whole batches, and Anobyt Junior brings coding and AI workshops to schools."),
      `<h2 id="contact">Contact us</h2>${p(`Email ${EMAILS.join(" or ")} for questions, feedback or partnerships.`)}`,
    ],
  });

  add({
    path: "/junior",
    title: "Anobyt Junior | Coding & AI Workshops for Schools (Classes 6 to 12)",
    description:
      "Anobyt Junior runs fun, hands-on coding, AI, game design, web design and cyber safety workshops for schools, for classes 6 to 12. On campus or online, with certificates for every student.",
    h1: "Anobyt Junior: coding and AI workshops for schools",
    priority: "0.8",
    body: [
      p("Anobyt Junior runs hands-on workshops for school students in classes 6 to 12: coding, AI, game design, web design and cyber safety. Workshops run on campus or online, and every student gets a certificate."),
      p(`Schools can book a workshop from this page. For questions, email ${EMAILS.join(" or ")}.`),
    ],
  });

  add({
    path: "/premium",
    title: "Free and Premium Plans",
    description: "What is free on Anobyt, what premium practice and premium membership include, prices and how access works.",
    h1: "Free and premium plans",
    priority: "0.6",
    body: [p("Coding practice, the compiler and many courses are free. Premium unlocks premium problems with solutions, premium courses and more.")],
  });

  return list;
}

// ---------------------------------------------------------------- HTML

function setTag(html, re, replacement) {
  if (!re.test(html)) throw new Error(`prerender: template is missing ${re}`);
  return html.replace(re, replacement);
}

/** "<title> | Anobyt", dropping the suffix (then trimming) when it would go past 60 characters. */
export function fitTitle(t) {
  const withName = t.includes(NAME) ? t : `${t} | ${NAME}`;
  if (withName.length <= 60) return withName;
  return t.length <= 60 ? t : clip(t, 60);
}

function render(template, pg) {
  const url = `${SITE}${pg.path}`;
  const title = fitTitle(pg.title);
  // Search results show about 155 characters of the description.
  pg = { ...pg, description: clip(pg.description, 155) };
  const ld = { "@context": "https://schema.org", "@graph": [ORG, WEBSITE, { "@type": "WebPage", "@id": `${url}#webpage`, url, name: title, description: pg.description, isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#organization` }, dateModified: TODAY, inLanguage: "en-IN" }, ...(pg.ld || [])] };

  let html = template;
  html = setTag(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = setTag(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(pg.description)}" />`);
  html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}" />`);
  html = setTag(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(pg.description)}" />`);
  html = setTag(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(url)}" />`);
  html = setTag(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(pg.description)}" />`);
  html = setTag(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`);

  const nav = `<nav aria-label="Anobyt">${NAV.map(([href, text]) => a(href, text)).join(" · ")}</nav>`;
  const content = `<main class="page prerendered"><div class="wrap">${nav}<h1>${esc(pg.h1)}</h1>${pg.body.filter(Boolean).join("")}<p class="updated">Last updated ${UPDATED}</p></div></main>`;
  return setTag(html, /<div id="root"><\/div>/, `<div id="root">${content}</div>`);
}

/** The shell for every route that isn't pre-built: no canonical (React sets the right one). */
function shell(template) {
  let html = template.replace(/<link rel="canonical"[^>]*>\s*/, "");
  html = html.replace(/<meta property="og:url"[^>]*>\s*/, "");
  return html;
}

// ---------------------------------------------------------------- files for crawlers

function sitemap(list) {
  const urls = list
    .map((pg) => `  <url>\n    <loc>${SITE}${pg.path}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${pg.changefreq || "weekly"}</changefreq>\n    <priority>${pg.priority || "0.8"}</priority>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// Signed-in and one-off pages that shouldn't show up in search.
const PRIVATE = ["/admin", "/account", "/dashboard", "/trainer", "/workspace", "/login", "/verify-email", "/reset-password", "/exam/", "/t/", "/results/", "/assessment/", "/take", "/code-room/", "/interview-report/", "/ms-auth.html"];
// AI and search crawlers, listed so it's explicit they're welcome.
const BOTS = ["Googlebot", "Bingbot", "GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot", "Applebot-Extended", "CCBot", "meta-externalagent", "DuckDuckBot", "YandexBot"];

function robots() {
  const rules = (agent) => [`User-agent: ${agent}`, "Allow: /", ...PRIVATE.map((x) => `Disallow: ${x}`)].join("\n");
  return `${BOTS.map(rules).join("\n\n")}\n\n${rules("*")}\n\nSitemap: ${SITE}/sitemap.xml\n`;
}

function llms(list, faqs, full) {
  const main = list.filter((pg) => !/^\/(companies|courses|talks|problems\/year)\/./.test(pg.path));
  const lines = [
    `# ${NAME}`,
    "",
    `> ${NAME} (anobyt.in) is an Indian ed-tech platform that helps college students get placement-ready: 1:1 mock interviews and mentorship with working professionals, year-wise coding practice with an online judge, a free online compiler, MCQ and coding tests, company-wise hiring guides and courses. Colleges and placement cells use it to onboard whole batches for proctored tests, mock interviews with trainers and section-wise score cards.`,
    "",
    `- Website: ${SITE}`,
    `- Contact: ${EMAILS.join(", ")}`,
    `- Also written as: ${ALT_NAMES.join(", ")}`,
    "",
    "## Pages",
    "",
    ...main.map((pg) => `- [${pg.title}](${SITE}${pg.path}): ${pg.description}`),
    "",
    "## Company hiring guides",
    "",
    ...(full ? COMPANIES.map((c) => `- [${c.name} hiring process](${SITE}/companies/${c.id}): ${c.summary}`) : [`- [All ${COMPANIES.length} companies](${SITE}/companies)`]),
    "",
    "## FAQ",
    "",
    ...faqs.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
  ];
  if (full)
    lines.push(
      "## Company details",
      "",
      ...COMPANIES.flatMap((c) => [`### ${c.name} (${c.category})`, "", c.summary, "", ...c.rounds.map((r) => `- ${r.title}: ${r.detail}`), "", `Topics: ${c.topics.join(", ")}`, "", `Tip: ${c.tip}`, ""]),
    );
  return lines.join("\n");
}

// ---------------------------------------------------------------- main

const template = await readFile(join(DIST, "index.html"), "utf8");
const [faqs, courses, events] = await Promise.all([live("faqs", DEFAULT_FAQS.filter((f) => f.published !== false)), live("courses", DEFAULT_COURSES), live("events", [])]);
const list = pages({ faqs, courses, events });

// The shell first (from the untouched template), then the pages, which overwrite index.html.
await writeFile(join(DIST, "app.html"), shell(template));
for (const pg of list) {
  // /companies/tcs -> companies/tcs.html: Netlify serves it at the same address with a 200.
  // (A companies/tcs/index.html folder makes Netlify 301 to a trailing-slash URL instead.)
  const file = pg.path === "/" ? join(DIST, "index.html") : join(DIST, `${pg.path}.html`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, render(template, pg));
}
await writeFile(join(DIST, "sitemap.xml"), sitemap(list));
await writeFile(join(DIST, "robots.txt"), robots());
await writeFile(join(DIST, "llms.txt"), llms(list, faqs, false));
await writeFile(join(DIST, "llms-full.txt"), llms(list, faqs, true));
console.log(`prerender: ${list.length} pages, sitemap, robots.txt, llms.txt (${courses.length} courses, ${events.length} events, ${faqs.length} FAQs)`);
