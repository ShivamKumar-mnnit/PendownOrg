// General, publicly-known hiring-process outlines for common campus/off-campus
// recruiters. Not sourced from insider info and not a guarantee — actual
// processes vary by role, location, and year, and change without notice.
// Anobyt has no partnership or affiliation with any company listed here.
export const COMPANIES = [
  {
    id: "tcs",
    name: "TCS",
    fullName: "Tata Consultancy Services",
    category: "IT Services",
    initials: "TCS",
    from: "#0f4c81",
    to: "#1a7fc4",
    rounds: [
      { title: "TCS NQT", desc: "Online aptitude, verbal & coding test (National Qualifier Test)." },
      { title: "Technical Interview", desc: "CS fundamentals, coding basics, and your projects." },
      { title: "HR Interview", desc: "Communication, role fit, and offer discussion." },
    ],
  },
  {
    id: "infosys",
    name: "Infosys",
    fullName: "Infosys Ltd.",
    category: "IT Services",
    initials: "IN",
    from: "#0b5fa5",
    to: "#2f9ee0",
    rounds: [
      { title: "Online Test", desc: "Aptitude, logical reasoning, and a coding round." },
      { title: "Technical Interview", desc: "DSA fundamentals, CS basics, and project deep-dive." },
      { title: "HR Interview", desc: "Background, relocation preferences, and offer talk." },
    ],
  },
  {
    id: "google",
    name: "Google",
    fullName: "Google LLC",
    category: "Product",
    initials: "G",
    from: "#4285F4",
    to: "#34A853",
    rounds: [
      { title: "Resume & OA Screen", desc: "Application review, sometimes an online assessment." },
      { title: "Technical Phone Screens", desc: "1–2 rounds on DSA and problem-solving." },
      { title: "Onsite Rounds", desc: "Coding, system design (senior roles), and \"Googleyness\"." },
      { title: "Hiring Committee", desc: "Central review and team matching before an offer." },
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    fullName: "Microsoft Corporation",
    category: "Product",
    initials: "MS",
    from: "#F25022",
    to: "#7FBA00",
    rounds: [
      { title: "Online Assessment", desc: "Coding round, usually 2 problems under time pressure." },
      { title: "Technical Interviews", desc: "2–3 rounds on DSA, system design, and CS fundamentals." },
      { title: "\"As Appropriate\" Round", desc: "Often with a senior engineer or hiring manager." },
      { title: "HR & Offer", desc: "Compensation discussion and offer rollout." },
    ],
  },
  {
    id: "deloitte",
    name: "Deloitte",
    fullName: "Deloitte Touche Tohmatsu",
    category: "Consulting",
    initials: "DT",
    from: "#046A38",
    to: "#43B02A",
    rounds: [
      { title: "Online Assessment", desc: "Aptitude, verbal ability, and technical MCQs." },
      { title: "Group Discussion", desc: "For some roles — structured GD on a case or topic." },
      { title: "Case/Technical Interview", desc: "Role-specific problem solving and case analysis." },
      { title: "Partner/HR Round", desc: "Final interview and offer discussion." },
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    fullName: "Salesforce, Inc.",
    category: "Product",
    initials: "SF",
    from: "#00A1E0",
    to: "#1798c1",
    rounds: [
      { title: "Application Screen", desc: "Resume review against the specific role." },
      { title: "Technical Phone Interview", desc: "Coding and role-specific fundamentals." },
      { title: "Virtual Onsite Panel", desc: "Technical deep-dive plus behavioral rounds." },
      { title: "Team Match & Offer", desc: "Final team fit conversation and offer." },
    ],
  },
];
