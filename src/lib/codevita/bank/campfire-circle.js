// Generated. Original CodeVita-style problem written for Anobyt (not official TCS material).
// Server-only: the hidden test cases live here.

export default {
  ...JSON.parse(`{
 "id": "campfire-circle",
 "title": "Campfire Circle",
 "difficulty": "Medium",
 "topics": [
  "Recursion",
  "Mathematics"
 ],
 "patterns": [
  "Josephus problem",
  "Recurrence relation"
 ],
 "companies": [
  "TCS CodeVita",
  "TCS NQT"
 ],
 "season": "",
 "source": "original",
 "summary": "Children leave a circle every K-th count; find who stays till the end.",
 "timeLimit": 1,
 "memoryLimit": 256,
 "samples": [
  {
   "input": "5 2\\n",
   "output": "3\\n",
   "explanation": "Campers leave in the order 2, 4, 1, 5; camper 3 remains."
  },
  {
   "input": "7 3\\n",
   "output": "4\\n",
   "explanation": "Leaving order: 3, 6, 2, 7, 5, 1. Camper 4 remains."
  }
 ],
 "hints": [
  "Relate the answer for N campers to the answer for N - 1 campers.",
  "After one camper leaves, renumber the circle starting from the next camper."
 ],
 "editorial": {
  "idea": "Number positions from 0. If J(n) is the survivor's 0-based position among n campers, then after the first camper leaves the circle restarts K places further on, so J(n) = (J(n-1) + K) mod n` +
`, with J(1) = 0.",
  "brute": "Simulate the circle with a list, removing every K-th camper. O(N * K) with a naive count, or O(N^2) with index arithmetic and list deletion. Too slow for N = 10^6.",
  "better": "Simulate with a balanced tree or a Fenwick tree to find the K-th remaining camper in O(log N): O(N log N) total. Works but is complex.",
  "optimal": "Use the recurrence iteratively: j = 0; for n from 2 to N: j = (j + K) mod n. The answer is j + 1. O(N) time, O(1) memory, no recursion depth problems.",
  "dryRun": "N = 5, K = 2.\\nn=1: j=0. n=2: (0+2)%2=0. n=3: (0+2)%3=2. n=4: (2+2)%4=0. n=5: (0+2)%5=2.\\nAnswer 2 + 1 = 3.",
  "mistakes": "- Writing the recurrence recursively: depth 10^6 overflows the stack.\\n- (j + K) overflowing 32 bits when K is close to 10^9 (use 64-bit or reduce K mod n first).\\n- Off-by-one between ` +
`0-based and 1-based numbering.",
  "edgeCases": "- N = 1: answer 1.\\n- K = 1: campers leave in order, answer N.\\n- K much larger than N."
 },
 "complexity": {
  "time": "O(N)",
  "space": "O(1)"
 },
 "solutions": {
  "python": "import sys\\n\\ndef main():\\n    n, k = map(int, sys.stdin.read().split())\\n    j = 0\\n    for m in range(2, n + 1):\\n        j = (j + k) % m\\n    print(j + 1)\\n\\nmain()\\n",
  "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\n\\nint main() {\\n    long long n, k;\\n    cin >> n >> k;\\n    long long j = 0;\\n    for (long long m = 2; m <= n; m++) j = (j + k) % m;\\n    co` +
`ut << j + 1 << '\\\\n';\\n    return 0;\\n}\\n",
  "java": "import java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        Scanner sc = new Scanner(System.in);\\n        long n = sc.nextLong(), k = sc.nextLong();\\n ` +
`       long j = 0;\\n        for (long m = 2; m <= n; m++) j = (j + k) % m;\\n        System.out.println(j + 1);\\n    }\\n}\\n"
 },
 "statement": "N campers sit around a fire, numbered 1 to N clockwise. Starting from camper 1, they count clockwise 1, 2, …, K. The camper who says K leaves the circle, and counting restarts at 1 from` +
` the next camper still in the circle. This repeats until one camper is left; that camper lights the fire next night.\\n\\nPrint the number of the last camper.",
 "inputFormat": "One line with N and K.",
 "outputFormat": "Print the number of the last remaining camper.",
 "constraints": "1 <= N <= 10^6\\n1 <= K <= 10^9"
}`),
  cases: [
    { input: `1 1
`,
      output: `1
` },
    { input: `1 1000000000
`,
      output: `1
` },
    { input: `10 1
`,
      output: `10
` },
    { input: `6 6
`,
      output: `4
` },
    { input: `1000 7
`,
      output: `404
` },
    { input: `100000 999999937
`,
      output: `15810
` },
    { input: `1000000 2
`,
      output: `951425
` },
    { input: `1000000 1000000000
`,
      output: `642255
` },
    { input: `999999 13
`,
      output: `689589
` },
  ],
};
