// Practice problems for years 2, 3 and 4. Each one has a readable
// reference solution (`sol`, JavaScript), a short explanation (`ex`) and
// hints (`h`). Expected answers for the tests (`in`) are computed by
// running the reference solution, so the two can never disagree.
// Only the server reads this file (see src/lib/server/practice.js).

export const MORE_BOOKS = [
  ["y2arr", 2, "Arrays and two pointers"],
  ["y2str", 2, "Strings and hashing"],
  ["y2stack", 2, "Stacks and queues"],
  ["y2search", 2, "Sorting and searching"],
  ["y2math", 2, "Recursion and maths"],
  ["y3dp", 3, "Dynamic programming"],
  ["y3graph", 3, "Graphs"],
  ["y3greedy", 3, "Greedy"],
  ["y3window", 3, "Sliding window and binary search"],
  ["y4int", 4, "Interview classics"],
  ["y4dp", 4, "Advanced dynamic programming"],
  ["y4graph", 4, "Advanced graphs"],
];

const P = (b, id, t, d, fn, pa, desc, sol, ins, ex, h) => ({ b, id, t, d, fn, pa, desc, sol, in: ins, ex, h });

export const MORE_PROBLEMS = [
  // ---------- Year 2: Arrays and two pointers ----------
  P("y2arr", "second-largest", "Second largest number", "Easy", "secondLargest", "arr",
    "Return the second largest distinct value in the array, or -1 if there isn't one.",
    `function secondLargest(arr) {
  let first = -Infinity, second = -Infinity;
  for (const x of arr) {
    if (x > first) { second = first; first = x; }
    else if (x < first && x > second) second = x;
  }
  return second === -Infinity ? -1 : second;
}`,
    [[[12, 35, 1, 10, 34, 1]], [[10, 10, 10]], [[5, 7]], [[1]]],
    "Keep the largest and second largest values seen so far in one pass. A new maximum pushes the old maximum down to second place; equal values are skipped so the answer stays distinct.",
    ["Sorting works, but you can do it in a single pass.", "Track two variables: first and second."]),
  P("y2arr", "move-zeros", "Move zeros to the end", "Easy", "moveZeros", "arr",
    "Return a new array with every 0 moved to the end. The other numbers keep their order.",
    `function moveZeros(arr) {
  const out = arr.filter((x) => x !== 0);
  while (out.length < arr.length) out.push(0);
  return out;
}`,
    [[[0, 1, 0, 3, 12]], [[0, 0, 1]], [[1, 2, 3]], [[]]],
    "Copy the non-zero numbers in order, then fill the rest of the array with zeros.",
    ["Count the zeros while copying the other numbers."]),
  P("y2arr", "rotate-right", "Rotate an array", "Easy", "rotateRight", "arr, k",
    "Return the array rotated to the right by k places. k can be larger than the length.",
    `function rotateRight(arr, k) {
  if (!arr.length) return [];
  k = k % arr.length;
  return arr.slice(arr.length - k).concat(arr.slice(0, arr.length - k));
}`,
    [[[1, 2, 3, 4, 5], 2], [[1, 2], 3], [[7], 10], [[], 4]],
    "Rotating by the length gives the same array, so use k % n. The last k items move to the front and the rest follow.",
    ["What happens when k equals the array length?"]),
  P("y2arr", "pair-sum-sorted", "Pair sum in a sorted array", "Easy", "hasPairSum", "arr, target",
    "The array is sorted. Return true if two different positions hold values that add up to target.",
    `function hasPairSum(arr, target) {
  let i = 0, j = arr.length - 1;
  while (i < j) {
    const s = arr[i] + arr[j];
    if (s === target) return true;
    if (s < target) i++;
    else j--;
  }
  return false;
}`,
    [[[1, 2, 4, 7, 11], 15], [[1, 2, 4, 7, 11], 10], [[3, 3], 6], [[5], 10]],
    "Start one pointer at each end. If the sum is too small move the left pointer right; if it is too big move the right pointer left. Each step discards one value, so it runs in O(n).",
    ["The array is sorted. Use one pointer at each end."]),
  P("y2arr", "count-unique-sorted", "Unique values in a sorted array", "Easy", "countUnique", "arr",
    "The array is sorted. Return how many distinct values it contains.",
    `function countUnique(arr) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) if (i === 0 || arr[i] !== arr[i - 1]) count++;
  return count;
}`,
    [[[1, 1, 2, 3, 3, 3]], [[]], [[4, 4, 4]], [[-2, 0, 5]]],
    "In a sorted array equal values sit next to each other, so a value is new exactly when it differs from the one before it.",
    ["Compare each value with the previous one."]),
  P("y2arr", "prefix-sums", "Running total", "Easy", "prefixSums", "arr",
    "Return an array where position i holds the sum of arr[0] to arr[i].",
    `function prefixSums(arr) {
  const out = [];
  let total = 0;
  for (const x of arr) { total += x; out.push(total); }
  return out;
}`,
    [[[1, 2, 3, 4]], [[5]], [[]], [[3, -3, 3]]],
    "Keep a running total and append it after adding each number.",
    ["You only need one variable for the running total."]),
  P("y2arr", "majority-element", "Majority element", "Medium", "majority", "arr",
    "One value appears more than half the time. Return it. Try to use O(1) extra space.",
    `function majority(arr) {
  let candidate = null, count = 0;
  for (const x of arr) {
    if (count === 0) candidate = x;
    count += x === candidate ? 1 : -1;
  }
  return candidate;
}`,
    [[[3, 2, 3]], [[2, 2, 1, 1, 1, 2, 2]], [[9]], [[1, 1, 1, 2, 3]]],
    "Boyer-Moore voting: pair off different values and cancel them. The majority value has more copies than everything else together, so it is the one left standing.",
    ["A hash map works, but think about cancelling pairs of different values."]),
  P("y2arr", "best-time-stock", "Best time to buy and sell", "Medium", "maxProfit", "prices",
    "prices[i] is a stock's price on day i. Buy once and sell once later. Return the largest profit, or 0 if no profit is possible.",
    `function maxProfit(prices) {
  let lowest = Infinity, best = 0;
  for (const p of prices) {
    lowest = Math.min(lowest, p);
    best = Math.max(best, p - lowest);
  }
  return best;
}`,
    [[[7, 1, 5, 3, 6, 4]], [[7, 6, 4, 3, 1]], [[2, 4, 1]], [[5]]],
    "For each day, the best sale ends today and buys at the lowest price seen so far. Track that lowest price and the best difference.",
    ["For each day, what is the cheapest day to have bought before it?"]),

  // ---------- Year 2: Strings and hashing ----------
  P("y2str", "first-unique-char", "First unique character", "Easy", "firstUnique", "s",
    "Return the index of the first character that appears only once in s, or -1.",
    `function firstUnique(s) {
  const count = {};
  for (const c of s) count[c] = (count[c] || 0) + 1;
  for (let i = 0; i < s.length; i++) if (count[s[i]] === 1) return i;
  return -1;
}`,
    [["leetcode"], ["loveleetcode"], ["aabb"], [""]],
    "Count every character first, then scan again and return the first one whose count is 1.",
    ["Two passes: count, then search."]),
  P("y2str", "valid-anagram", "Valid anagram", "Easy", "isAnagram", "a, b",
    "Return true if b uses exactly the same letters as a, the same number of times.",
    `function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const count = {};
  for (const c of a) count[c] = (count[c] || 0) + 1;
  for (const c of b) {
    if (!count[c]) return false;
    count[c]--;
  }
  return true;
}`,
    [["anagram", "nagaram"], ["rat", "car"], ["", ""], ["ab", "a"]],
    "Count the letters of a, then use them up while reading b. Any letter that runs out means the words differ.",
    ["Sorting both strings also works. Can you do it in O(n)?"]),
  P("y2str", "compress-string", "Compress a string", "Easy", "compress", "s",
    'Replace each run of the same character with the character and the run length, e.g. "aaabcc" becomes "a3b1c2".',
    `function compress(s) {
  let out = "";
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    out += s[i] + (j - i);
    i = j;
  }
  return out;
}`,
    [["aaabcc"], ["abc"], [""], ["zzzzzzzzzzzz"]],
    "Walk the string and, from each new character, move forward while the character repeats. Write the character and how far you moved.",
    ["Use an inner loop to find where each run ends."]),
  P("y2str", "longest-common-prefix", "Longest common prefix", "Easy", "commonPrefix", "words",
    "Return the longest prefix shared by every word in the list (empty string if none).",
    `function commonPrefix(words) {
  if (!words.length) return "";
  let prefix = words[0];
  for (const w of words) {
    while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}`,
    [[["flower", "flow", "flight"]], [["dog", "racecar", "car"]], [["alone"]], [[]]],
    "Start with the first word as the prefix and trim it from the end until every word starts with it.",
    ["The answer can never be longer than the shortest word."]),
  P("y2str", "most-frequent-char", "Most frequent character", "Easy", "mostFrequent", "s",
    "Return the character that appears most often in s. If several tie, return the one that comes first alphabetically. s is not empty.",
    `function mostFrequent(s) {
  const count = {};
  for (const c of s) count[c] = (count[c] || 0) + 1;
  let best = null;
  for (const c of Object.keys(count).sort()) if (best === null || count[c] > count[best]) best = c;
  return best;
}`,
    [["programming"], ["aabb"], ["z"], ["mississippi"]],
    "Count every character, then check them in alphabetical order and keep the one with the largest count. Checking in order settles ties automatically.",
    ["Sort the keys before you compare counts."]),
  P("y2str", "string-rotation", "Is it a rotation?", "Medium", "isRotation", "a, b",
    'Return true if b can be made by moving some characters from the front of a to its end (e.g. "waterbottle" and "erbottlewat").',
    `function isRotation(a, b) {
  return a.length === b.length && (a + a).includes(b);
}`,
    [["waterbottle", "erbottlewat"], ["abc", "acb"], ["", ""], ["aa", "a"]],
    "Every rotation of a appears inside a + a. So b is a rotation when the lengths match and a + a contains b.",
    ["Write a twice in a row and look at it."]),

  // ---------- Year 2: Stacks and queues ----------
  P("y2stack", "next-greater", "Next greater element", "Medium", "nextGreater", "arr",
    "For each position, return the first value to its right that is larger, or -1 if there is none.",
    `function nextGreater(arr) {
  const out = arr.map(() => -1);
  const stack = []; // indexes still waiting for a larger value
  arr.forEach((x, i) => {
    while (stack.length && arr[stack[stack.length - 1]] < x) out[stack.pop()] = x;
    stack.push(i);
  });
  return out;
}`,
    [[[4, 5, 2, 25]], [[13, 7, 6, 12]], [[5, 4, 3]], [[]]],
    "Keep a stack of positions that haven't found their answer yet. Each new value answers every smaller value on top of the stack, then waits itself. Every index is pushed and popped once, so it is O(n).",
    ["A stack can hold the positions that are still waiting."]),
  P("y2stack", "eval-rpn", "Evaluate postfix expression", "Medium", "evalRPN", "tokens",
    'Evaluate an expression in reverse Polish notation, e.g. ["2","1","+","3","*"] is (2 + 1) * 3. Division truncates toward zero.',
    `function evalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if ("+-*/".includes(t) && t.length === 1) {
      const b = stack.pop(), a = stack.pop();
      stack.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : Math.trunc(a / b));
    } else stack.push(Number(t));
  }
  return stack[0];
}`,
    [[["2", "1", "+", "3", "*"]], [["4", "13", "5", "/", "+"]], [["7"]], [["3", "-4", "-"]]],
    "Push numbers on a stack. An operator pops the top two numbers, applies itself (the second pop is the left side) and pushes the result.",
    ["The order of the two popped values matters for - and /."]),
  P("y2stack", "remove-adjacent-duplicates", "Remove adjacent duplicates", "Easy", "removeDuplicates", "s",
    'Repeatedly remove two equal letters standing next to each other until none are left. "abbaca" becomes "ca".',
    `function removeDuplicates(s) {
  const stack = [];
  for (const c of s) {
    if (stack[stack.length - 1] === c) stack.pop();
    else stack.push(c);
  }
  return stack.join("");
}`,
    [["abbaca"], ["azxxzy"], [""], ["aa"]],
    "Use a stack of letters. A letter equal to the top cancels it; otherwise it is pushed. What remains is the answer.",
    ["Think of each letter cancelling the one before it."]),
  P("y2stack", "daily-temperatures", "Days until warmer", "Medium", "warmerDays", "temps",
    "For each day, return how many days you wait for a warmer temperature (0 if it never gets warmer).",
    `function warmerDays(temps) {
  const out = temps.map(() => 0);
  const stack = [];
  temps.forEach((t, i) => {
    while (stack.length && temps[stack[stack.length - 1]] < t) {
      const j = stack.pop();
      out[j] = i - j;
    }
    stack.push(i);
  });
  return out;
}`,
    [[[73, 74, 75, 71, 69, 72, 76, 73]], [[30, 40, 50, 60]], [[30, 20, 10]], [[]]],
    "Same idea as next greater element: a stack of days still waiting. When a warmer day arrives, every cooler day on the stack gets its wait time.",
    ["Store indexes on the stack, not temperatures."]),

  // ---------- Year 2: Sorting and searching ----------
  P("y2search", "count-occurrences", "Count in a sorted array", "Medium", "countOf", "arr, x",
    "The array is sorted. Return how many times x appears, in O(log n).",
    `function countOf(arr, x) {
  const bound = (strict) => {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] < x || (strict && arr[mid] === x)) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  return bound(true) - bound(false);
}`,
    [[[1, 2, 2, 2, 3, 5], 2], [[1, 2, 3], 4], [[], 1], [[7, 7, 7], 7]],
    "Binary search twice: once for the first position holding x and once for the first position after the last x. The difference is the count.",
    ["Find where x starts and where it ends."]),
  P("y2search", "lower-bound", "Insert position", "Easy", "insertPosition", "arr, x",
    "The array is sorted. Return the index where x is, or where it would be inserted to keep the order.",
    `function insertPosition(arr, x) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}`,
    [[[1, 3, 5, 6], 5], [[1, 3, 5, 6], 2], [[1, 3, 5, 6], 7], [[], 3]],
    "Binary search for the first value that is not smaller than x. Everything left of it is smaller, so that is the insert position.",
    ["Keep the search range as [lo, hi) and shrink it by half each step."]),
  P("y2search", "sort-colors", "Sort 0s, 1s and 2s", "Medium", "sortColors", "arr",
    "The array holds only 0, 1 and 2. Return it sorted in one pass without using a sort function.",
    `function sortColors(arr) {
  const a = arr.slice();
  let low = 0, mid = 0, high = a.length - 1;
  while (mid <= high) {
    if (a[mid] === 0) { [a[low], a[mid]] = [a[mid], a[low]]; low++; mid++; }
    else if (a[mid] === 1) mid++;
    else { [a[mid], a[high]] = [a[high], a[mid]]; high--; }
  }
  return a;
}`,
    [[[2, 0, 2, 1, 1, 0]], [[2, 0, 1]], [[]], [[1, 1]]],
    "Dutch national flag: keep three zones. 0s are swapped to the front, 2s to the back, and 1s stay in the middle.",
    ["Use three pointers: low, mid and high."]),
  P("y2search", "kth-smallest", "Kth smallest", "Easy", "kthSmallest", "arr, k",
    "Return the k-th smallest value (k starts at 1).",
    `function kthSmallest(arr, k) {
  return arr.slice().sort((a, b) => a - b)[k - 1];
}`,
    [[[7, 10, 4, 3, 20, 15], 3], [[1], 1], [[5, 5, 1], 2], [[9, 8, 7], 3]],
    "Sort a copy in increasing order and take position k - 1. (A heap or quickselect is faster for huge inputs.)",
    ["Remember JavaScript's default sort compares text, not numbers."]),
  P("y2search", "sqrt-floor", "Integer square root", "Easy", "sqrtFloor", "n",
    "Return the largest whole number r with r * r <= n, without using Math.sqrt.",
    `function sqrtFloor(n) {
  let lo = 0, hi = n;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (mid * mid <= n) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}`,
    [[16], [17], [0], [1], [99]],
    "Binary search on the answer: if mid * mid fits, the answer is mid or larger; otherwise it is smaller.",
    ["The answer lies between 0 and n."]),

  // ---------- Year 2: Recursion and maths ----------
  P("y2math", "gcd", "Greatest common divisor", "Easy", "gcd", "a, b",
    "Return the greatest common divisor of two non-negative integers (gcd(0, 0) is 0).",
    `function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}`,
    [[12, 18], [17, 5], [0, 9], [0, 0], [100, 75]],
    "Euclid's rule: gcd(a, b) equals gcd(b, a % b), and gcd(a, 0) is a.",
    ["Try the remainder instead of subtraction."]),
  P("y2math", "count-primes", "Count primes", "Medium", "countPrimes", "n",
    "Return how many prime numbers are smaller than n.",
    `function countPrimes(n) {
  if (n < 3) return 0;
  const composite = new Array(n).fill(false);
  let count = 0;
  for (let i = 2; i < n; i++) {
    if (composite[i]) continue;
    count++;
    for (let j = i * i; j < n; j += i) composite[j] = true;
  }
  return count;
}`,
    [[10], [0], [2], [3], [100]],
    "Sieve of Eratosthenes: every number not crossed out when you reach it is prime, and you cross out its multiples starting at i * i.",
    ["Testing each number separately is slow. Cross out multiples instead."]),
  P("y2math", "subset-sums", "All subset sums", "Medium", "subsetSums", "arr",
    "Return the sums of all subsets of arr (including the empty subset), sorted in increasing order.",
    `function subsetSums(arr) {
  const out = [];
  const go = (i, sum) => {
    if (i === arr.length) { out.push(sum); return; }
    go(i + 1, sum + arr[i]); // take arr[i]
    go(i + 1, sum);          // skip arr[i]
  };
  go(0, 0);
  return out.sort((a, b) => a - b);
}`,
    [[[1, 2]], [[3]], [[]], [[1, 2, 3]]],
    "For each element choose to take it or skip it. Recursing on both choices visits all 2^n subsets.",
    ["Each element has two choices."]),
  P("y2math", "string-permutations", "Unique permutations", "Medium", "permutations", "s",
    "Return every distinct arrangement of the letters of s, sorted alphabetically.",
    `function permutations(s) {
  const out = new Set();
  const go = (prefix, rest) => {
    if (!rest) { out.add(prefix); return; }
    for (let i = 0; i < rest.length; i++) go(prefix + rest[i], rest.slice(0, i) + rest.slice(i + 1));
  };
  go("", s);
  return [...out].sort();
}`,
    [["abc"], ["aab"], ["z"], [""]],
    "Pick each remaining letter in turn as the next letter and recurse on the rest. A set removes repeats caused by equal letters.",
    ["Build the answer one letter at a time."]),

  // ---------- Year 3: Dynamic programming ----------
  P("y3dp", "climb-stairs", "Climbing stairs", "Easy", "climbStairs", "n",
    "You can climb 1 or 2 steps at a time. Return how many different ways there are to reach step n.",
    `function climbStairs(n) {
  let a = 1, b = 1; // ways to reach step i - 1 and step i
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}`,
    [[2], [3], [5], [1], [20]],
    "To stand on step i you came from step i - 1 or i - 2, so ways(i) = ways(i - 1) + ways(i - 2). Keep only the last two values.",
    ["Write the answer for step i using smaller steps."]),
  P("y3dp", "house-robber", "House robber", "Medium", "rob", "houses",
    "Each house holds some money. You can't take from two neighbouring houses. Return the most money you can take.",
    `function rob(houses) {
  let skip = 0, take = 0;
  for (const h of houses) [skip, take] = [Math.max(skip, take), skip + h];
  return Math.max(skip, take);
}`,
    [[[1, 2, 3, 1]], [[2, 7, 9, 3, 1]], [[]], [[5]], [[2, 1, 1, 2]]],
    "For each house keep two totals: the best if you skip it and the best if you take it. Taking it is only allowed after skipping the previous one.",
    ["Two states per house: robbed or not."]),
  P("y3dp", "unique-paths", "Grid paths", "Medium", "uniquePaths", "m, n",
    "A robot starts at the top-left of an m x n grid and moves only right or down. Return how many paths lead to the bottom-right.",
    `function uniquePaths(m, n) {
  const row = new Array(n).fill(1);
  for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) row[j] += row[j - 1];
  return row[n - 1];
}`,
    [[3, 7], [3, 2], [1, 1], [5, 5]],
    "Paths to a cell = paths to the cell above + paths to the cell on the left. One row of the table is enough.",
    ["The first row and column have exactly one path each."]),
  P("y3dp", "lcs", "Longest common subsequence", "Medium", "lcs", "a, b",
    "Return the length of the longest sequence of characters that appears in both strings in the same order (not necessarily together).",
    `function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}`,
    [["abcde", "ace"], ["abc", "def"], ["", "abc"], ["AGGTAB", "GXTXAYB"]],
    "dp[i][j] is the answer for the first i letters of a and first j letters of b. Matching last letters extend the diagonal; otherwise drop a letter from one string.",
    ["Compare the last characters of the two prefixes."]),
  P("y3dp", "knapsack", "0/1 knapsack", "Medium", "knapsack", "weights, values, capacity",
    "Each item can be taken at most once. Return the largest total value whose total weight fits in the capacity.",
    `function knapsack(weights, values, capacity) {
  const best = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++)
    for (let c = capacity; c >= weights[i]; c--)
      best[c] = Math.max(best[c], best[c - weights[i]] + values[i]);
  return best[capacity];
}`,
    [[[1, 3, 4, 5], [1, 4, 5, 7], 7], [[10], [5], 5], [[], [], 10], [[2, 2, 2], [3, 3, 3], 4]],
    "best[c] is the best value with capacity c. Go through items and update capacities from high to low so each item is used once.",
    ["Why must the inner loop run from high capacity to low?"]),
  P("y3dp", "partition-equal", "Equal sum partition", "Medium", "canPartition", "nums",
    "Return true if the numbers can be split into two groups with the same sum.",
    `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2) return false;
  const half = total / 2;
  const can = new Array(half + 1).fill(false);
  can[0] = true;
  for (const x of nums) for (let s = half; s >= x; s--) if (can[s - x]) can[s] = true;
  return can[half];
}`,
    [[[1, 5, 11, 5]], [[1, 2, 3, 5]], [[]], [[2, 2]]],
    "Both halves must sum to total / 2, so the question becomes: can some subset reach that sum? Track every reachable sum.",
    ["If the total is odd the answer is immediate."]),
  P("y3dp", "min-path-sum", "Cheapest path in a grid", "Medium", "minPathSum", "grid",
    "Moving only right or down from the top-left to the bottom-right, return the smallest possible sum of the cells you pass.",
    `function minPathSum(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = grid.map((r) => r.slice());
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) {
      if (i === 0 && j === 0) continue;
      const up = i > 0 ? dp[i - 1][j] : Infinity;
      const left = j > 0 ? dp[i][j - 1] : Infinity;
      dp[i][j] += Math.min(up, left);
    }
  return dp[m - 1][n - 1];
}`,
    [[[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], [[[1, 2, 3], [4, 5, 6]]], [[[7]]]],
    "The cheapest way into a cell comes from the cheaper of the cell above and the cell to the left.",
    ["Fill the table row by row."]),

  // ---------- Year 3: Graphs ----------
  P("y3graph", "count-components", "Connected groups", "Medium", "countComponents", "n, edges",
    "An undirected graph has nodes 0 to n-1. Return how many connected groups it has.",
    `function countComponents(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  let groups = n;
  for (const [a, b] of edges) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) { parent[ra] = rb; groups--; }
  }
  return groups;
}`,
    [[5, [[0, 1], [1, 2], [3, 4]]], [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], [3, []], [1, []]],
    "Union-find: start with n groups and merge the two groups of every edge. Each successful merge removes one group.",
    ["BFS from every unvisited node also works."]),
  P("y3graph", "is-bipartite", "Two-colour a graph", "Medium", "isBipartite", "n, edges",
    "Return true if the nodes (0 to n-1) can be coloured with two colours so every edge joins different colours.",
    `function isBipartite(n, edges) {
  const g = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { g[a].push(b); g[b].push(a); }
  const color = new Array(n).fill(-1);
  for (let s = 0; s < n; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const queue = [s];
    while (queue.length) {
      const u = queue.shift();
      for (const v of g[u]) {
        if (color[v] === -1) { color[v] = 1 - color[u]; queue.push(v); }
        else if (color[v] === color[u]) return false;
      }
    }
  }
  return true;
}`,
    [[4, [[0, 1], [1, 2], [2, 3], [3, 0]]], [3, [[0, 1], [1, 2], [2, 0]]], [2, []], [5, [[0, 1], [2, 3]]]],
    "BFS from each uncoloured node, giving neighbours the opposite colour. Meeting a neighbour with the same colour means an odd cycle.",
    ["The graph may have several separate parts."]),
  P("y3graph", "can-finish", "Course schedule", "Medium", "canFinish", "n, prereqs",
    "There are n courses (0 to n-1). Each pair [a, b] means b must be done before a. Return true if every course can be finished.",
    `function canFinish(n, prereqs) {
  const g = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [a, b] of prereqs) { g[b].push(a); indeg[a]++; }
  const queue = [];
  indeg.forEach((d, i) => d === 0 && queue.push(i));
  let done = 0;
  while (queue.length) {
    const u = queue.shift();
    done++;
    for (const v of g[u]) if (--indeg[v] === 0) queue.push(v);
  }
  return done === n;
}`,
    [[2, [[1, 0]]], [2, [[1, 0], [0, 1]]], [3, []], [4, [[1, 0], [2, 1], [3, 2], [1, 3]]]],
    "Kahn's topological sort: repeatedly take a course with no remaining prerequisites. If some courses are never freed, there is a cycle.",
    ["Count how many prerequisites each course still waits for."]),
  P("y3graph", "flood-fill", "Flood fill", "Easy", "floodFill", "grid, r, c, color",
    "Change the cell (r, c) and every cell connected to it (up, down, left, right) with the same starting colour to the new colour. Return the grid.",
    `function floodFill(grid, r, c, color) {
  const g = grid.map((row) => row.slice());
  const start = g[r][c];
  if (start === color) return g;
  const fill = (i, j) => {
    if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] !== start) return;
    g[i][j] = color;
    fill(i + 1, j); fill(i - 1, j); fill(i, j + 1); fill(i, j - 1);
  };
  fill(r, c);
  return g;
}`,
    [[[[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2], [[[0, 0], [0, 0]], 0, 0, 0], [[[5]], 0, 0, 3]],
    "DFS from the start cell, recolouring each matching cell and visiting its four neighbours. Stop at the edge or at a different colour.",
    ["What happens if the new colour equals the old one?"]),
  P("y3graph", "rotting-oranges", "Rotting oranges", "Medium", "orangesRotting", "grid",
    "0 is empty, 1 a fresh orange, 2 a rotten orange. Each minute, rotten oranges rot their fresh neighbours (up, down, left, right). Return the minutes until no fresh orange is left, or -1 if that never happens.",
    `function orangesRotting(grid) {
  const g = grid.map((r) => r.slice());
  let queue = [], fresh = 0, minutes = 0;
  g.forEach((row, i) => row.forEach((v, j) => (v === 2 ? queue.push([i, j]) : v === 1 && fresh++)));
  while (queue.length && fresh) {
    const next = [];
    for (const [i, j] of queue)
      for (const [x, y] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]])
        if (g[x]?.[y] === 1) { g[x][y] = 2; fresh--; next.push([x, y]); }
    queue = next;
    minutes++;
  }
  return fresh ? -1 : minutes;
}`,
    [[[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], [[[0, 2]]], [[[1]]]],
    "Multi-source BFS: all rotten oranges start in the queue together, and each BFS level is one minute.",
    ["Start the BFS from every rotten orange at once."]),

  // ---------- Year 3: Greedy ----------
  P("y3greedy", "max-meetings", "Most meetings in one room", "Medium", "maxMeetings", "meetings",
    "Each meeting is [start, end]. A meeting can start when the previous one ends. Return the most meetings one room can hold.",
    `function maxMeetings(meetings) {
  const sorted = meetings.slice().sort((a, b) => a[1] - b[1]);
  let count = 0, freeAt = -Infinity;
  for (const [s, e] of sorted) if (s >= freeAt) { count++; freeAt = e; }
  return count;
}`,
    [[[[1, 2], [3, 4], [0, 6], [5, 7], [8, 9], [5, 9]]], [[[1, 10], [2, 3], [4, 5]]], [[]], [[[1, 2], [2, 3]]]],
    "Always pick the meeting that ends first: it leaves the most time for the rest. Sort by end time and take every meeting that fits.",
    ["Sort by end time, not start time."]),
  P("y3greedy", "jump-game", "Jump game", "Medium", "canJump", "nums",
    "Standing on index 0, nums[i] is the furthest you can jump from i. Return true if you can reach the last index.",
    `function canJump(nums) {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}`,
    [[[2, 3, 1, 1, 4]], [[3, 2, 1, 0, 4]], [[0]], [[1, 0, 1]]],
    "Track the furthest index you can reach so far. If you ever stand beyond it, you are stuck.",
    ["You don't need to try every jump."]),
  P("y3greedy", "assign-cookies", "Assign cookies", "Easy", "contentChildren", "greed, cookies",
    "Child i is happy with a cookie of size at least greed[i]. Each child gets at most one cookie. Return the most happy children.",
    `function contentChildren(greed, cookies) {
  const g = greed.slice().sort((a, b) => a - b), c = cookies.slice().sort((a, b) => a - b);
  let child = 0;
  for (const size of c) if (child < g.length && size >= g[child]) child++;
  return child;
}`,
    [[[1, 2, 3], [1, 1]], [[1, 2], [1, 2, 3]], [[], [1]], [[5], [1, 2]]],
    "Sort both lists and give each cookie, smallest first, to the least greedy child still waiting.",
    ["Never waste a big cookie on a child a small one would satisfy."]),
  P("y3greedy", "min-platforms", "Minimum platforms", "Medium", "minPlatforms", "arrive, depart",
    "Train i arrives at arrive[i] and departs at depart[i] (a train leaving at the same minute another arrives still needs its own platform). Return the fewest platforms needed.",
    `function minPlatforms(arrive, depart) {
  const a = arrive.slice().sort((x, y) => x - y), d = depart.slice().sort((x, y) => x - y);
  let i = 0, j = 0, now = 0, best = 0;
  while (i < a.length) {
    if (a[i] <= d[j]) { now++; i++; best = Math.max(best, now); }
    else { now--; j++; }
  }
  return best;
}`,
    [[[900, 940, 950, 1100, 1500, 1800], [910, 1200, 1120, 1130, 1900, 2000]], [[900, 1000], [930, 1030]], [[], []], [[100, 100], [200, 200]]],
    "Sort arrivals and departures separately and sweep through time. Each arrival takes a platform, each departure frees one; the busiest moment is the answer.",
    ["Sort the two lists separately."]),

  // ---------- Year 3: Sliding window and binary search ----------
  P("y3window", "longest-unique-substring", "Longest substring without repeats", "Medium", "longestUnique", "s",
    "Return the length of the longest part of s with no repeated characters.",
    `function longestUnique(s) {
  const last = {};
  let start = 0, best = 0;
  for (let i = 0; i < s.length; i++) {
    if (last[s[i]] >= start) start = last[s[i]] + 1;
    last[s[i]] = i;
    best = Math.max(best, i - start + 1);
  }
  return best;
}`,
    [["abcabcbb"], ["bbbbb"], ["pwwkew"], [""]],
    "Slide a window over s. When a character repeats inside the window, move the window's start just past its previous position.",
    ["Remember where each character was last seen."]),
  P("y3window", "max-window-sum", "Best window of size k", "Easy", "maxWindowSum", "arr, k",
    "Return the largest sum of k numbers that sit next to each other. k is between 1 and the array length.",
    `function maxWindowSum(arr, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i];
  let best = sum;
  for (let i = k; i < arr.length; i++) {
    sum += arr[i] - arr[i - k];
    best = Math.max(best, sum);
  }
  return best;
}`,
    [[[2, 1, 5, 1, 3, 2], 3], [[5], 1], [[-1, -2, -3], 2], [[1, 2, 3, 4], 4]],
    "Compute the first window, then slide: add the new number and subtract the one that left. Each step is O(1).",
    ["Don't re-add the whole window each time."]),
  P("y3window", "min-subarray-len", "Shortest subarray with sum", "Medium", "minSubarrayLen", "target, nums",
    "All numbers are positive. Return the length of the shortest run of neighbouring numbers whose sum is at least target, or 0.",
    `function minSubarrayLen(target, nums) {
  let start = 0, sum = 0, best = Infinity;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
    while (sum >= target) {
      best = Math.min(best, i - start + 1);
      sum -= nums[start++];
    }
  }
  return best === Infinity ? 0 : best;
}`,
    [[7, [2, 3, 1, 2, 4, 3]], [4, [1, 4, 4]], [11, [1, 1, 1, 1]], [5, []]],
    "Grow the window to the right until the sum is big enough, then shrink it from the left as long as it still is.",
    ["Positive numbers mean shrinking the window always lowers the sum."]),
  P("y3window", "search-rotated", "Search a rotated array", "Medium", "searchRotated", "nums, target",
    "A sorted array of distinct values was rotated (e.g. [4,5,6,7,0,1,2]). Return the index of target or -1, in O(log n).",
    `function searchRotated(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
    [[[4, 5, 6, 7, 0, 1, 2], 0], [[4, 5, 6, 7, 0, 1, 2], 3], [[1], 1], [[], 5]],
    "One half around mid is always sorted. Check whether the target lies in that sorted half and drop the other half.",
    ["Compare nums[lo] with nums[mid] to see which half is sorted."]),
  P("y3window", "peak-index", "Find a peak", "Medium", "peakIndex", "arr",
    "The array rises and then falls (a mountain). Return the index of the highest value in O(log n).",
    `function peakIndex(arr) {
  let lo = 0, hi = arr.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < arr[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}`,
    [[[0, 2, 1, 0]], [[0, 10, 5, 2]], [[1, 3, 5, 4]], [[3, 4, 5, 1]]],
    "If the next value is higher you are on the rising side, so the peak is to the right; otherwise it is here or to the left.",
    ["Compare arr[mid] with arr[mid + 1]."]),

  // ---------- Year 4: Interview classics ----------
  P("y4int", "trap-rain", "Trapping rain water", "Hard", "trap", "heights",
    "heights are bar heights of width 1. Return how much rain water is trapped between the bars.",
    `function trap(heights) {
  let i = 0, j = heights.length - 1, leftMax = 0, rightMax = 0, water = 0;
  while (i < j) {
    if (heights[i] < heights[j]) {
      leftMax = Math.max(leftMax, heights[i]);
      water += leftMax - heights[i++];
    } else {
      rightMax = Math.max(rightMax, heights[j]);
      water += rightMax - heights[j--];
    }
  }
  return water;
}`,
    [[[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], [[4, 2, 0, 3, 2, 5]], [[]], [[3, 3, 3]]],
    "Water above a bar is limited by the smaller of the tallest bars on each side. Two pointers move inward from the lower side, which is the side whose limit is already known.",
    ["Water at i = min(max left, max right) - height[i]."]),
  P("y4int", "product-except-self", "Product of all others", "Medium", "productExceptSelf", "nums",
    "Return an array where position i holds the product of every number except nums[i], without using division.",
    `function productExceptSelf(nums) {
  const out = new Array(nums.length).fill(1);
  let left = 1;
  for (let i = 0; i < nums.length; i++) { out[i] = left; left *= nums[i]; }
  let right = 1;
  for (let i = nums.length - 1; i >= 0; i--) { out[i] *= right; right *= nums[i]; }
  return out;
}`,
    [[[1, 2, 3, 4]], [[2, 3]], [[5, 0, 2]], [[-1, 1, -1]]],
    "Each answer is (product of everything on the left) x (product of everything on the right). Two passes collect both.",
    ["Build prefix products, then suffix products."]),
  P("y4int", "longest-consecutive", "Longest consecutive run", "Medium", "longestConsecutive", "nums",
    "Return the length of the longest run of consecutive integers that can be formed from the values (in any order), in O(n).",
    `function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (set.has(x - 1)) continue; // only start counting at the beginning of a run
    let len = 1;
    while (set.has(x + len)) len++;
    best = Math.max(best, len);
  }
  return best;
}`,
    [[[100, 4, 200, 1, 3, 2]], [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], [[]], [[1, 1, 1]]],
    "Put the values in a set. Only start counting from numbers with no predecessor, so each run is walked once.",
    ["Which numbers can be the start of a run?"]),
  P("y4int", "three-sum-count", "Triplets that sum to zero", "Medium", "threeSumCount", "nums",
    "Return how many different triplets of values (as sets of values, not positions) add up to 0.",
    `function threeSumCount(nums) {
  const a = nums.slice().sort((x, y) => x - y);
  let count = 0;
  for (let i = 0; i < a.length - 2; i++) {
    if (i > 0 && a[i] === a[i - 1]) continue;
    let lo = i + 1, hi = a.length - 1;
    while (lo < hi) {
      const s = a[i] + a[lo] + a[hi];
      if (s < 0) lo++;
      else if (s > 0) hi--;
      else {
        count++;
        while (lo < hi && a[lo] === a[lo + 1]) lo++;
        while (lo < hi && a[hi] === a[hi - 1]) hi--;
        lo++; hi--;
      }
    }
  }
  return count;
}`,
    [[[-1, 0, 1, 2, -1, -4]], [[0, 0, 0, 0]], [[1, 2, 3]], [[-2, 0, 1, 1, 2]]],
    "Sort, fix the first value, and find pairs for the rest with two pointers. Skipping equal neighbours stops the same triplet being counted twice.",
    ["Reduce it to the two-sum-in-a-sorted-array problem."]),
  P("y4int", "top-k-frequent", "Top k frequent numbers", "Medium", "topKFrequent", "nums, k",
    "Return the k most frequent values, most frequent first. Break ties by the smaller value first.",
    `function topKFrequent(nums, k) {
  const count = new Map();
  for (const x of nums) count.set(x, (count.get(x) || 0) + 1);
  return [...count.keys()].sort((a, b) => count.get(b) - count.get(a) || a - b).slice(0, k);
}`,
    [[[1, 1, 1, 2, 2, 3], 2], [[1], 1], [[4, 4, 5, 5, 6], 2], [[3, 1, 2], 3]],
    "Count each value, then sort the distinct values by count (and by value for ties) and take the first k.",
    ["A Map keeps the counts."]),
  P("y4int", "min-window-substring", "Smallest window containing all letters", "Hard", "minWindow", "s, t",
    "Return the shortest part of s that contains every character of t (with repeats). If there are several, return the leftmost. Return an empty string if none exists.",
    `function minWindow(s, t) {
  const need = {};
  for (const c of t) need[c] = (need[c] || 0) + 1;
  let missing = t.length, start = 0, bestStart = 0, bestLen = Infinity;
  for (let end = 0; end < s.length; end++) {
    if (need[s[end]] > 0) missing--;
    need[s[end]] = (need[s[end]] || 0) - 1;
    while (missing === 0) {
      if (end - start + 1 < bestLen) { bestLen = end - start + 1; bestStart = start; }
      need[s[start]]++;
      if (need[s[start]] > 0) missing++;
      start++;
    }
  }
  return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}`,
    [["ADOBECODEBANC", "ABC"], ["a", "a"], ["a", "aa"], ["aa", "aa"]],
    "Expand the window until it covers t, then shrink it from the left while it still covers t, recording the smallest window seen.",
    ["Count how many characters are still missing."]),

  // ---------- Year 4: Advanced dynamic programming ----------
  P("y4dp", "word-break", "Word break", "Medium", "wordBreak", "s, words",
    "Return true if s can be split into a sequence of words from the list (words can be reused).",
    `function wordBreak(s, words) {
  const dict = new Set(words);
  const ok = new Array(s.length + 1).fill(false);
  ok[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = 0; j < i; j++)
      if (ok[j] && dict.has(s.slice(j, i))) { ok[i] = true; break; }
  return ok[s.length];
}`,
    [["leetcode", ["leet", "code"]], ["applepenapple", ["apple", "pen"]], ["catsandog", ["cats", "dog", "sand", "and", "cat"]], ["", ["a"]]],
    "ok[i] says whether the first i characters can be split. It is true if some earlier split point j is ok and s[j..i) is a word.",
    ["Think about every possible last word."]),
  P("y4dp", "longest-palindrome-substring", "Longest palindromic substring", "Medium", "longestPalindrome", "s",
    "Return the longest part of s that reads the same both ways. If several have the same length, return the leftmost.",
    `function longestPalindrome(s) {
  let best = "";
  const grow = (l, r) => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    return s.slice(l + 1, r);
  };
  for (let i = 0; i < s.length; i++) {
    for (const p of [grow(i, i), grow(i, i + 1)]) if (p.length > best.length) best = p;
  }
  return best;
}`,
    [["babad"], ["cbbd"], ["a"], ["forgeeksskeegfor"]],
    "Every palindrome has a centre (a letter or a gap between two letters). Expand outward from each centre while both ends match.",
    ["There are 2n - 1 possible centres."]),
  P("y4dp", "decode-ways", "Decode ways", "Medium", "numDecodings", "s",
    'Letters A to Z are encoded as "1" to "26". Return how many ways the digit string s can be decoded.',
    `function numDecodings(s) {
  if (!s.length) return 0;
  let prev = 1, cur = s[0] === "0" ? 0 : 1;
  for (let i = 1; i < s.length; i++) {
    let next = s[i] === "0" ? 0 : cur;
    const two = Number(s.slice(i - 1, i + 1));
    if (s[i - 1] !== "0" && two <= 26) next += prev;
    [prev, cur] = [cur, next];
  }
  return cur;
}`,
    [["12"], ["226"], ["06"], ["11106"], ["10"]],
    "The last letter used either one digit (1-9) or two digits (10-26). Add the ways for both cases, like climbing stairs.",
    ["A '0' can never be decoded on its own."]),
  P("y4dp", "max-product-subarray", "Maximum product subarray", "Medium", "maxProduct", "nums",
    "Return the largest product of a run of neighbouring numbers (non-empty).",
    `function maxProduct(nums) {
  let hi = nums[0], lo = nums[0], best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    [hi, lo] = [Math.max(x, hi * x, lo * x), Math.min(x, hi * x, lo * x)];
    best = Math.max(best, hi);
  }
  return best;
}`,
    [[[2, 3, -2, 4]], [[-2, 0, -1]], [[-2, 3, -4]], [[5]]],
    "A negative number flips the largest product into the smallest and back, so track both the largest and smallest product ending here.",
    ["Keep the minimum as well as the maximum."]),
  P("y4dp", "longest-palindromic-subsequence", "Longest palindromic subsequence", "Hard", "longestPalSubseq", "s",
    "Return the length of the longest subsequence of s (letters kept in order, not necessarily together) that is a palindrome.",
    `function longestPalSubseq(s) {
  const n = s.length;
  if (!n) return 0;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    dp[i][i] = 1;
    for (let j = i + 1; j < n; j++)
      dp[i][j] = s[i] === s[j] ? dp[i + 1][j - 1] + 2 : Math.max(dp[i + 1][j], dp[i][j - 1]);
  }
  return dp[0][n - 1];
}`,
    [["bbbab"], ["cbbd"], ["a"], ["agbdba"]],
    "dp[i][j] is the answer for s[i..j]. Matching ends add 2 to the inside; otherwise drop one end.",
    ["It is the LCS of s and its reverse."]),
  P("y4dp", "coin-combinations", "Coin combinations", "Medium", "coinWays", "coins, amount",
    "Return the number of different combinations of coins (each coin unlimited, order doesn't matter) that make up the amount.",
    `function coinWays(coins, amount) {
  const ways = new Array(amount + 1).fill(0);
  ways[0] = 1;
  for (const c of coins) for (let s = c; s <= amount; s++) ways[s] += ways[s - c];
  return ways[amount];
}`,
    [[[1, 2, 5], 5], [[2], 3], [[10], 10], [[1, 2, 3], 0]],
    "Process one coin type at a time and add its ways to every larger amount. Going coin by coin counts combinations, not orderings.",
    ["Why does the outer loop go over coins, not amounts?"]),

  // ---------- Year 4: Advanced graphs ----------
  P("y4graph", "dijkstra", "Shortest distances", "Hard", "shortestDistances", "n, edges, src",
    "A directed graph has nodes 0 to n-1 and edges [u, v, w] with weight w >= 0. Return the shortest distance from src to every node (-1 if unreachable).",
    `function shortestDistances(n, edges, src) {
  const g = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) g[u].push([v, w]);
  const dist = new Array(n).fill(Infinity);
  const done = new Array(n).fill(false);
  dist[src] = 0;
  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u === -1 || dist[i] < dist[u])) u = i;
    if (dist[u] === Infinity) break;
    done[u] = true;
    for (const [v, w] of g[u]) dist[v] = Math.min(dist[v], dist[u] + w);
  }
  return dist.map((d) => (d === Infinity ? -1 : d));
}`,
    [[4, [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1]], 0], [3, [[0, 1, 5]], 0], [2, [], 1], [3, [[0, 1, 1], [1, 2, 1], [0, 2, 5]], 0]],
    "Dijkstra: repeatedly finalise the closest unfinished node and relax its outgoing edges. Non-negative weights make the closest node's distance final.",
    ["A priority queue makes this faster for big graphs."]),
  P("y4graph", "mst-weight", "Minimum spanning tree", "Hard", "mstWeight", "n, edges",
    "An undirected connected graph has nodes 0 to n-1 and edges [u, v, w]. Return the total weight of its minimum spanning tree.",
    `function mstWeight(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  let total = 0;
  for (const [u, v, w] of edges.slice().sort((a, b) => a[2] - b[2])) {
    const a = find(u), b = find(v);
    if (a !== b) { parent[a] = b; total += w; }
  }
  return total;
}`,
    [[4, [[0, 1, 10], [0, 2, 6], [0, 3, 5], [1, 3, 15], [2, 3, 4]]], [2, [[0, 1, 3]]], [1, []], [3, [[0, 1, 1], [1, 2, 1], [0, 2, 1]]]],
    "Kruskal: take edges from lightest to heaviest and keep each one that joins two different groups (checked with union-find).",
    ["Sort the edges by weight."]),
  P("y4graph", "has-cycle-directed", "Cycle in a directed graph", "Medium", "hasCycle", "n, edges",
    "Return true if the directed graph (nodes 0 to n-1, edges [u, v]) contains a cycle.",
    `function hasCycle(n, edges) {
  const g = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) g[u].push(v);
  const state = new Array(n).fill(0); // 0 new, 1 on the current path, 2 finished
  const dfs = (u) => {
    state[u] = 1;
    for (const v of g[u]) {
      if (state[v] === 1) return true;
      if (state[v] === 0 && dfs(v)) return true;
    }
    state[u] = 2;
    return false;
  };
  for (let i = 0; i < n; i++) if (state[i] === 0 && dfs(i)) return true;
  return false;
}`,
    [[3, [[0, 1], [1, 2], [2, 0]]], [3, [[0, 1], [1, 2]]], [1, [[0, 0]]], [4, [[0, 1], [0, 2], [1, 3], [2, 3]]]],
    "DFS with three states. Reaching a node that is still on the current path means you went around a cycle.",
    ["A visited node is not enough; it must be on the current path."]),
  P("y4graph", "word-ladder", "Word ladder", "Hard", "ladderLength", "begin, end, words",
    "Change one letter at a time, and every intermediate word must be in the list. Return the number of words in the shortest sequence from begin to end (including both), or 0.",
    `function ladderLength(begin, end, words) {
  const dict = new Set(words);
  if (!dict.has(end)) return 0;
  let queue = [begin], steps = 1;
  const seen = new Set([begin]);
  while (queue.length) {
    const next = [];
    for (const w of queue) {
      if (w === end) return steps;
      for (let i = 0; i < w.length; i++)
        for (let c = 97; c <= 122; c++) {
          const cand = w.slice(0, i) + String.fromCharCode(c) + w.slice(i + 1);
          if (dict.has(cand) && !seen.has(cand)) { seen.add(cand); next.push(cand); }
        }
    }
    queue = next;
    steps++;
  }
  return 0;
}`,
    [["hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]], ["hit", "cog", ["hot", "dot", "dog", "lot", "log"]], ["a", "c", ["a", "b", "c"]]],
    "Words are nodes and one-letter changes are edges. BFS from begin finds the shortest sequence, level by level.",
    ["Shortest path in an unweighted graph means BFS."]),
  P("y4graph", "network-reach", "Time for a signal to reach everyone", "Hard", "networkDelay", "times, n, k",
    "times[i] = [u, v, w] means a signal takes w minutes from node u to v (nodes are 1 to n). Starting at k, return the minutes until every node has the signal, or -1.",
    `function networkDelay(times, n, k) {
  const dist = new Array(n + 1).fill(Infinity);
  dist[k] = 0;
  for (let i = 1; i < n; i++)
    for (const [u, v, w] of times) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  const worst = Math.max(...dist.slice(1));
  return worst === Infinity ? -1 : worst;
}`,
    [[[[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2], [[[1, 2, 1]], 2, 1], [[[1, 2, 1]], 2, 2], [[], 1, 1]],
    "Find the shortest time to every node (Bellman-Ford here: relax every edge n - 1 times). The answer is the largest of those times.",
    ["The last node to hear the signal decides the answer."]),
];
