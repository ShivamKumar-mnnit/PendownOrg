// Starting content for everything the admin panel can edit. The site shows
// these until the admin saves their own version (the server returns them
// for a collection that has never been saved), and the pages render them
// straight away while the live content loads, so nothing is ever blank.
// Shared by the browser and the server.

export const COURSE_TIERS = ["free", "premium"];
export const LESSON_TYPES = { video: "Video", article: "Article", link: "Link", pdf: "PDF / notes" };

const course = (id, tier, lessonCount, title, level, summary, icon, outline) => ({
  id,
  tier,
  lessonCount,
  title,
  level,
  summary,
  description: "",
  icon,
  priceLabel: "",
  outline,
  modules: [],
  published: true,
});

export const DEFAULT_COURSES = [
  course("programming-foundations", "free", 24, "Programming Foundations", "1st year", "Pick a language, learn syntax and control flow, and practice until a blank editor stops being scary.", "💻", ["Variables, types and input/output", "Conditions and loops", "Functions", "Arrays and strings", "Practice sets"]),
  course("dsa-mastery", "premium", 120, "DSA Mastery", "2nd to 3rd year", "Arrays to graphs to DP, with a problem set mapped to real company questions.", "🧮", ["Complexity and arrays", "Linked lists, stacks and queues", "Trees and heaps", "Graphs", "Dynamic programming", "Company question sets"]),
  course("full-stack", "premium", 90, "Full Stack Development", "3rd year", "Build and ship a real product: frontend, backend, database and deployment.", "🌐", ["HTML, CSS and JavaScript", "React", "Node.js APIs", "Databases", "Deploying your project"]),
  course("ai-ml-essentials", "premium", 60, "AI/ML Essentials", "3rd year", "Enough ML to hold your own in interviews and build an intelligent feature.", "🧠", ["Python for data", "Core ML algorithms", "Model evaluation", "A small ML project", "ML interview questions"]),
  course("cs-fundamentals", "free", 40, "CS Fundamentals", "All years", "OS, DBMS, CN and OOP, the four subjects that show up in most interviews.", "📚", ["Operating systems", "DBMS and SQL", "Computer networks", "Object-oriented programming"]),
  course("aptitude", "free", 35, "Aptitude and Reasoning", "Final year", "The round that eliminates the most people, and the easiest to fix with practice.", "🧩", ["Quantitative aptitude", "Logical reasoning", "Verbal ability", "Timed mock sections"]),
  course("system-design", "premium", 30, "System Design", "Final year", "Caching, load balancing, databases and trade-offs.", "🏗️", ["Scaling basics", "Caching and CDNs", "Databases and sharding", "Classic design problems"]),
  course("company-bundle", "premium", 200, "Company Preparation Bundle", "Final year", "Company vault pages, past-question sets and mock tests in one track.", "🏢", ["Service company drives", "Product company rounds", "Past-question sets", "Full-length mock tests"]),
];

export const DEFAULT_FAQS = [
  ["Is Anobyt free?", "It depends on your college's partnership and the type of session you book. Message us on WhatsApp and we will tell you exactly what applies before you commit."],
  ["How do I book a session?", "Fill the booking form with your name, phone, domain and slot. We confirm over WhatsApp."],
  ["What if I need to reschedule?", "Message us on WhatsApp and we will move your slot. No forms."],
  ["Do I need prior interview experience?", "No. Sessions work for first-timers and experienced candidates alike."],
  ["How are mentors matched to me?", "By the domain you select, so your mentor's background fits your track."],
  ["Is this only for specific colleges?", "No. Any college student can book. Colleges can also onboard whole batches."],
].map(([q, a], i) => ({ id: `faq-${i + 1}`, q, a, published: true }));

export const EVENT_CATEGORIES = {
  "tech-talk": "Tech talk",
  workshop: "Workshop",
  webinar: "Webinar",
  bootcamp: "Bootcamp",
  "mock-drive": "Mock interview drive",
  hackathon: "Hackathon",
  podcast: "Podcast / fireside chat",
  career: "Career talk",
};
export const EVENT_MODES = { online: "Online", offline: "On campus", hybrid: "Hybrid" };

// Events start empty: the admin adds real ones. "Add sample drafts" in the
// admin panel creates these as unpublished drafts to edit.
export const DEFAULT_EVENTS = [];
export const SAMPLE_EVENTS = [
  {
    title: "Cracking the SDE interview: from DSA to offer",
    category: "tech-talk",
    mode: "online",
    summary: "How product companies structure coding rounds, and how to prepare for each one.",
    description: "A working engineer walks through a real interview loop, the patterns that come up most, and how to talk through your approach.\n\nStay for the open Q&A at the end.",
    speakers: [{ name: "Speaker name", role: "Software Engineer" }],
    agenda: [
      { time: "0:00", title: "How the loop is structured" },
      { time: "0:20", title: "Live problem walkthrough" },
      { time: "0:45", title: "Q&A" },
    ],
    tags: ["DSA", "Interviews"],
  },
  {
    title: "Build your first full stack project",
    category: "workshop",
    mode: "hybrid",
    summary: "A hands-on session: build and deploy a small web app end to end.",
    description: "Bring a laptop. We start from an empty folder and finish with a deployed app.",
    speakers: [{ name: "Speaker name", role: "Full Stack Developer" }],
    agenda: [],
    tags: ["React", "Projects"],
  },
  {
    title: "Campus mock interview drive",
    category: "mock-drive",
    mode: "offline",
    summary: "1:1 mock interviews for a full batch, with written feedback for every student.",
    description: "Students are matched to mentors by domain and get a feedback report after their round.",
    speakers: [],
    agenda: [],
    tags: ["Mock interviews"],
  },
];

export const DEFAULT_SETTINGS = {
  topbar: "Mock interviews, placement prep and tech talks for colleges",
  contactEmail: "anobyt@anobyt.in",
  announcement: { active: false, text: "", link: "", linkLabel: "" },
};

export const DEFAULTS = { courses: DEFAULT_COURSES, events: DEFAULT_EVENTS, faqs: DEFAULT_FAQS };
