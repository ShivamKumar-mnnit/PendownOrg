// Generated. Original CodeVita-style problem written for Anobyt (not official TCS material).
// Server-only: the hidden test cases live here.

export default {
  ...JSON.parse(`{
 "id": "lucky-tickets",
 "title": "Lucky Ticket Numbers",
 "difficulty": "Hard",
 "topics": [
  "Number Theory",
  "Backtracking",
  "Mathematics"
 ],
 "patterns": [
  "Inclusion-exclusion principle",
  "Pruned subset enumeration"
 ],
 "companies": [
  "TCS CodeVita",
  "TCS NQT"
 ],
 "season": "",
 "source": "original",
 "summary": "Count ticket numbers up to N that are divisible by at least one lucky prime.",
 "timeLimit": 1,
 "memoryLimit": 256,
 "samples": [
  {
   "input": "20 2\\n2 3\\n",
   "output": "13\\n",
   "explanation": "10 multiples of 2 plus 6 multiples of 3, minus 3 multiples of 6 that were counted twice."
  },
  {
   "input": "100 3\\n2 5 7\\n",
   "output": "66\\n",
   "explanation": "50 + 20 + 14 - 10 - 7 - 2 + 1 = 66."
  }
 ],
 "hints": [
  "How many numbers up to N are divisible by both 2 and 3?",
  "Count each set of primes once, with a sign depending on its size."
 ],
 "editorial": {
  "idea": "Inclusion-exclusion: add the count of multiples of each prime, subtract multiples of each product of two primes, add back products of three, and so on. Because the numbers are distinct prim` +
`es, the multiples of a set are the multiples of its product, and there are N / product of them.",
  "brute": "Check every number from 1 to N against every prime. N can be 10^18, so this is hopeless.",
  "better": "Loop over all 2^K subsets and compute each product. Correct, but the products overflow 64 bits if you are careless.",
  "optimal": "Depth-first search over subsets in order of the primes, carrying the running product. If product * p > N, that subset and all its supersets contribute 0, so skip them. Test the overflow ` +
`safely with p > N / product instead of multiplying first. At most 2^15 = 32768 subsets.",
  "dryRun": "N = 20, primes 2 and 3.\\n{2}: +20/2 = +10. {3}: +20/3 = +6. {2, 3}: -20/6 = -3.\\nTotal 13.",
  "mistakes": "- Multiplying before checking for overflow. 10^9 * 10^9 * 10^9 does not fit in 64 bits.\\n- Getting the sign wrong: odd-sized sets add, even-sized sets subtract.\\n- Using 32-bit integers` +
` for N.",
  "edgeCases": "- A prime bigger than N contributes nothing.\\n- K = 1: the answer is N / p.\\n- N = 1: answer 0."
 },
 "complexity": {
  "time": "O(2^K) in the worst case, far less with pruning",
  "space": "O(K)"
 },
 "solutions": {
  "python": "import sys\\ndef main():\\n    d = sys.stdin.read().split()\\n    n, k = int(d[0]), int(d[1]); ps = sorted(int(x) for x in d[2:2 + k])\\n    total = 0\\n    def go(i, prod, size):\\n        non` +
`local total\\n        for j in range(i, k):\\n            q = prod * ps[j]\\n            if q > n: break  # sorted primes: later ones only get bigger\\n            total += (n // q) if size % 2 == 0 else ` +
`-(n // q)\\n            go(j + 1, q, size + 1)\\n    go(0, 1, 0)\\n    print(total)\\nmain()\\n",
  "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\ntypedef unsigned long long ull;\\null n; int k; vector<ull> ps; long long total = 0;\\nvoid go(int i, ull prod, int size) {\\n    for (int j = i;` +
` j < k; j++) {\\n        if (ps[j] > n / prod) break;\\n        ull q = prod * ps[j];\\n        long long c = (long long)(n / q);\\n        total += (size % 2 == 0) ? c : -c;\\n        go(j + 1, q, size + ` +
`1);\\n    }\\n}\\nint main() {\\n    cin >> n >> k;\\n    ps.resize(k);\\n    for (auto &p : ps) cin >> p;\\n    sort(ps.begin(), ps.end());\\n    go(0, 1, 0);\\n    printf(\\"%lld\\\\n\\", total);\\n    return 0;\\` +
`n}\\n",
  "java": "import java.io.*;\\nimport java.util.*;\\n\\npublic class Main {\\n    static long n, total = 0;\\n    static int k;\\n    static long[] ps;\\n    static void go(int i, long prod, int size) {\\n   ` +
`     for (int j = i; j < k; j++) {\\n            if (ps[j] > n / prod) break;\\n            long q = prod * ps[j];\\n            long c = n / q;\\n            total += (size % 2 == 0) ? c : -c;\\n         ` +
`   go(j + 1, q, size + 1);\\n        }\\n    }\\n    public static void main(String[] args) throws IOException {\\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\\n      ` +
`  StringTokenizer st = new StringTokenizer(br.readLine());\\n        n = Long.parseLong(st.nextToken()); k = Integer.parseInt(st.nextToken());\\n        ps = new long[k];\\n        st = new StringTokeniz` +
`er(br.readLine());\\n        for (int i = 0; i < k; i++) ps[i] = Long.parseLong(st.nextToken());\\n        Arrays.sort(ps);\\n        go(0, 1, 0);\\n        System.out.println(total);\\n    }\\n}\\n"
 },
 "statement": "A fair prints raffle tickets numbered 1 to N. The organisers pick K distinct **lucky primes**. A ticket wins a small prize if its number is divisible by at least one lucky prime.\\n\\nCou` +
`nt the winning tickets.",
 "inputFormat": "The first line contains N and K.\\nThe second line contains the K lucky primes.",
 "outputFormat": "Print the number of integers in [1, N] divisible by at least one of the primes.",
 "constraints": "1 <= N <= 10^18\\n1 <= K <= 15\\n2 <= each prime <= 10^9 (all are prime and distinct)"
}`),
  cases: [
    { input: `1 1
2
`,
      output: `0
` },
    { input: `10 1
11
`,
      output: `0
` },
    { input: `1000 1
2
`,
      output: `500
` },
    { input: `1000000000000000000 1
2
`,
      output: `500000000000000000
` },
    { input: `1000000000000000000 15
2 3 5 7 11 13 17 19 23 29 31 37 41 43 47
`,
      output: `861295907364149673
` },
    { input: `124875288337 6
97 43 47 109 23 71
`,
      output: `14480491390
` },
    { input: `1000000000000000000 15
107 131 173 61 43 5 37 67 179 31 109 193 19 17 197
`,
      output: `394120644433353948
` },
    { input: `1000000000000000000 5
999999937 999999929 2 3 5
`,
      output: `733333333866666703
` },
    { input: `999999999999999999 15
13 17 19 23 29 31 37 41 43 47 53 59 61 67 71
`,
      output: `384973663190888315
` },
    { input: `123456789 15
3 7 11 13 17 19 23 29 31 37 41 43 47 53 59
`,
      output: `82166937
` },
  ],
};
