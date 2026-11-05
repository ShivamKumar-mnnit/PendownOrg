// The built-in mock tests. Admin → CodeVita → Mock tests can edit, add or hide them
// (the edited list is saved in Netlify Blobs). Problem ids refer to the question bank.

export const CV_MOCKS = [
  {
    id: "demo-round",
    title: "Free demo round",
    summary: "Three problems from easy to hard in 90 minutes. Try the full mock-test experience for free.",
    minutes: 90,
    access: "free",
    problems: ["broken-keyboard", "platform-count", "fibre-network"],
  },
  {
    id: "warm-up",
    title: "Mock 1: warm-up round",
    summary: "Easy and Medium problems on arrays, strings and simulation. Good for your first timed attempt.",
    minutes: 90,
    access: "premium",
    problems: ["tank-overflow", "telegram-shorthand", "sweet-distribution"],
  },
  {
    id: "core-round",
    title: "Mock 2: core techniques",
    summary: "Four problems on greedy, two pointers, hashing and BFS.",
    minutes: 120,
    access: "premium",
    problems: ["meeting-hall", "close-pairs", "collision-course", "island-survey"],
  },
  {
    id: "graphs-dp",
    title: "Mock 3: graphs and DP",
    summary: "Shortest paths, dependencies and dynamic programming under time pressure.",
    minutes: 150,
    access: "premium",
    problems: ["wedding-queue", "exact-change", "course-planner", "cold-chain-delivery"],
  },
  {
    id: "full-sim-1",
    title: "Mock 4: full contest simulation",
    summary: "Six problems, three hours. The closest thing to the real round: pick your order and manage the clock.",
    minutes: 180,
    access: "premium",
    problems: ["power-last-digits", "village-election", "knight-courier", "print-shop", "skyline-climb", "critical-junctions"],
  },
  {
    id: "full-sim-2",
    title: "Mock 5: final rehearsal",
    summary: "Six problems including the hardest in the bank. Take it a few days before the contest.",
    minutes: 180,
    access: "premium",
    problems: ["anagram-teams", "prime-ranges", "peak-traffic", "autocorrect", "royal-guards", "lucky-tickets"],
  },
];
