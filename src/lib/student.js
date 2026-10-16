// Practice progress from the old browser-only demo login (localStorage).
// Real sign-in now lives on the data service (src/lib/account.js); this only
// keeps problems solved before that counted.

const STORAGE_KEY = "ab_user";

export const REWARDS = [
  [10, "🌱", "Starter badge"],
  [50, "🥉", "Bronze certificate"],
  [100, "🥈", "Silver badge and shout-out"],
  [250, "🎓", "Free 1:1 mock interview"],
  [500, "👕", "Anobyt T-shirt"],
  [1000, "🏆", "Hoodie and mentor lunch"],
];

export function getStudent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveStudent(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // localStorage unavailable (private mode etc.) — progress just won't persist.
  }
}

export function logOutStudent() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing stored to clear.
  }
}

/** Adds a test score to the logged-in student. Returns the score added, or null when logged out. */
export function addSolved(count) {
  const user = getStudent();
  if (!user) return null;
  saveStudent({ ...user, solved: user.solved + count });
  return count;
}

/** Marks a problem solved once. Returns "new", "already" or null when logged out. */
export function markProblemSolved(id) {
  const user = getStudent();
  if (!user) return null;
  const done = user.done || {};
  if (done[id]) return "already";
  saveStudent({ ...user, done: { ...done, [id]: 1 }, solved: user.solved + 1 });
  return "new";
}
