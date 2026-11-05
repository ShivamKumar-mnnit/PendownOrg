import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Code2,
  Compass,
  Crown,
  FilePlus2,
  HelpCircle,
  Home,
  Info,
  LayoutDashboard,
  LayoutGrid,
  Mic,
  School,
  Terminal,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { COMPANIES } from "../lib/companies";

// The header's menus. Every link points at a page that exists in App.jsx.
// A section's items are cards: { to, icon, title, desc, tags? }. Company
// cards use `company` (from lib/companies) instead of an icon.
export const MENUS = [
  {
    label: "Prepare",
    match: ["/placement", "/courses", "/mentors", "/book", "/companies", "/codevita"],
    columns: [
      [
        {
          title: "Placement preparation",
          items: [
            { to: "/placement", icon: Compass, title: "Placement guide", desc: "Stages, resume and HR prep" },
            { to: "/courses", icon: BookOpen, title: "Courses", desc: "Free and premium tracks", tags: ["Free", "Premium"] },
            { to: "/codevita", icon: Trophy, title: "TCS CodeVita Crash Course", desc: "Lessons, practice, PYQs and mock tests", tags: ["New"] },
            { to: "/mentors", icon: Users, title: "Mentors", desc: "Industry mentors by domain" },
            { to: "/book", icon: Mic, title: "Mock interviews", desc: "1:1 with working professionals" },
          ],
        },
      ],
      [
        {
          title: "Company wise prep",
          more: { to: "/companies", label: "All companies" },
          items: COMPANIES.map((c) => ({ to: `/companies/${c.id}`, company: c, title: c.name, desc: c.category })),
        },
      ],
    ],
  },
  {
    label: "Practice",
    match: ["/problems", "/problem", "/practice", "/take", "/tests", "/compiler", "/assessment"],
    columns: [
      [
        {
          title: "Coding practice",
          more: { to: "/problems", label: "How it works" },
          items: [
            { to: "/problems/year/1", icon: Code2, title: "1st year", desc: "Loops, patterns, arrays, strings", tags: ["Basics"] },
            { to: "/problems/year/2", icon: Code2, title: "2nd year", desc: "Hashing, stacks, sorting, searching", tags: ["DSA"] },
            { to: "/problems/year/3", icon: Code2, title: "3rd year", desc: "DP, graphs, greedy, binary search", tags: ["Algorithms"] },
            { to: "/problems/year/4", icon: Code2, title: "4th year", desc: "Interview classics, advanced DP", tags: ["Placement"] },
          ],
        },
      ],
      [
        {
          title: "Contest prep",
          items: [{ to: "/codevita?tab=practice", icon: Trophy, title: "CodeVita practice", desc: "CodeVita-style problems with a real judge", tags: ["New"] }],
        },
        {
          title: "Tests",
          items: [
            { to: "/practice", icon: ClipboardCheck, title: "Practice tests", desc: "MCQ, coding and Olympiad papers" },
            { to: "/tests", icon: FilePlus2, title: "Create tests", desc: "Proctored tests for your batch" },
          ],
        },
        {
          title: "Tools",
          items: [{ to: "/compiler", icon: Terminal, title: "Online compiler", desc: "Python, Java, C, C++ and JS" }],
        },
      ],
    ],
  },
  {
    label: "Colleges",
    match: ["/colleges", "/workspace", "/talks", "/junior", "/about", "/faq"],
    columns: [
      [
        {
          title: "For colleges",
          items: [
            { to: "/colleges", icon: Building2, title: "Onboard your college", desc: "Bring a whole batch on board" },
            { to: "/workspace", icon: LayoutGrid, title: "College panel", desc: "Batches, tests and scorecards" },
            { to: "/talks", icon: CalendarDays, title: "Tech talks and events", desc: "Workshops and mock drives" },
          ],
        },
        {
          title: "For schools",
          items: [{ to: "/junior", icon: School, title: "Anobyt Junior", desc: "Workshops for classes 6 to 12" }],
        },
      ],
      [
        {
          title: "Anobyt",
          items: [
            { to: "/about", icon: Info, title: "About and contact", desc: "Who we are, how to reach us" },
            { to: "/faq", icon: HelpCircle, title: "FAQ", desc: "Common questions" },
          ],
        },
        {
          promo: {
            to: "/colleges",
            title: "Bring Anobyt to your campus",
            desc: "Coding practice, proctored tests and mock interviews for a whole batch, with one panel for your placement cell.",
            cta: "Talk to us",
          },
        },
      ],
    ],
  },
];

// Plain links in the bar, around the menus.
export const BEFORE = [{ to: "/", title: "Home", icon: Home }];
export const AFTER = [
  { to: "/premium", title: "Premium", icon: Crown },
  { to: "/dashboard", title: "Dashboard", icon: LayoutDashboard },
];

// Everything the search box can find: every menu card plus a few pages that
// only live in the bar.
export const SEARCH_INDEX = [
  ...BEFORE.map((l) => ({ ...l, desc: "Start page", section: "Pages" })),
  ...MENUS.flatMap((m) =>
    m.columns.flat().flatMap((s) => (s.items || []).map((it) => ({ ...it, section: `${m.label} · ${s.title}` }))),
  ),
  { to: "/companies", icon: Building2, title: "All companies", desc: "Hiring rounds by company", section: "Prepare" },
  { to: "/problems", icon: Code2, title: "Coding practice", desc: "All four years, free and premium", section: "Practice" },
  ...AFTER.map((l) => ({ ...l, desc: l.to === "/premium" ? "Plans and membership" : "Your tests, interviews and progress", section: "Pages" })),
  { to: "/account", icon: UserRound, title: "Account", desc: "Sign in, profile and purchases", section: "Pages" },
];
