// Generated. Original CodeVita-style problem written for Anobyt (not official TCS material).
// Server-only: the hidden test cases live here.

export default {
  ...JSON.parse(`{
 "id": "exact-change",
 "title": "Ways to Pay Exactly",
 "difficulty": "Medium",
 "topics": [
  "Dynamic Programming"
 ],
 "patterns": [
  "Unbounded knapsack",
  "Counting combinations"
 ],
 "companies": [
  "TCS CodeVita",
  "TCS NQT",
  "Accenture"
 ],
 "season": "",
 "source": "original",
 "summary": "Count the ways to pay an amount with unlimited coins of given values, ignoring order.",
 "timeLimit": 1.0,
 "memoryLimit": 256,
 "samples": [
  {
   "input": "3 5\\n1 2 5\\n",
   "output": "4\\n",
   "explanation": "5 = 5, 2+2+1, 2+1+1+1, 1+1+1+1+1."
  },
  {
   "input": "2 3\\n2 4\\n",
   "output": "0\\n",
   "explanation": ""
  }
 ],
 "hints": [
  "Fix the coins you are allowed to use, then grow that set one coin at a time.",
  "Loop over coins outside, sums inside."
 ],
 "editorial": {
  "idea": "Process the coins one value at a time. ways[s] = number of ways to make s with the coins processed so far. Adding coin value c: ways[s] += ways[s - c], iterating s upwards so a coin can be used many times.",
  "brute": "Recursively choose how many coins of each value to use. Exponential in the number of coin values.",
  "better": "2D DP dp[i][s] over the first i coins and sum s. O(K * A) time and memory: 10^7 numbers is heavy on memory.",
  "optimal": "1D DP with coins in the outer loop: for each coin c, for s from c to A, ways[s] = (ways[s] + ways[s - c]) mod p. Coins in the outer loop count combinations (order ignored); putting sums outside would count ordered sequences instead.",
  "dryRun": "Coins 1 2 5, A = 5. Start ways = [1,0,0,0,0,0].\\nAfter 1: [1,1,1,1,1,1].\\nAfter 2: [1,1,2,2,3,3].\\nAfter 5: [1,1,2,2,3,4]. Answer 4.",
  "mistakes": "- Swapping the loops, which counts orderings (5 = 1+2+2 and 2+1+2 as different).\\n- Iterating s downwards, which allows each coin only once.\\n- Forgetting ways[0] = 1.",
  "edgeCases": "- No combination possible: 0.\\n- A coin larger than A (it simply never contributes).\\n- A single coin of value 1: exactly 1 way."
 },
 "complexity": {
  "time": "O(K * A)",
  "space": "O(A)"
 },
 "solutions": {
  "python": "import sys\\n\\ndef main():\\n    data = sys.stdin.read().split()\\n    k, a = int(data[0]), int(data[1])\\n    coins = list(map(int, data[2:2 + k]))\\n    MOD = 10**9 + 7\\n    ways = [0] * (a + 1)\\n    ways[0] = 1\\n    for c in coins:\\n        for s in range(c, a + 1):\\n            ways[s] = (ways[s] + ways[s - c]) % MOD\\n    print(ways[a])\\n\\nmain()\\n",
  "cpp": "#include <bits/stdc++.h>\\nusing namespace std;\\n\\nint main() {\\n    int k, a;\\n    cin >> k >> a;\\n    const int MOD = 1000000007;\\n    vector<int> ways(a + 1, 0);\\n    ways[0] = 1;\\n    for (int i = 0; i < k; i++) {\\n        int c;\\n        cin >> c;\\n        for (int s = c; s <= a; s++) {\\n            ways[s] += ways[s - c];\\n            if (ways[s] >= MOD) ways[s] -= MOD;\\n        }\\n    }\\n    cout << ways[a] << '\\\\n';\\n    return 0;\\n}\\n",
  "java": "import java.io.*;\\nimport java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) throws IOException {\\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\\n        StringTokenizer st = new StringTokenizer(br.readLine());\\n        int k = Integer.parseInt(st.nextToken()), a = Integer.parseInt(st.nextToken());\\n        final int MOD = 1000000007;\\n        int[] ways = new int[a + 1];\\n        ways[0] = 1;\\n        st = new StringTokenizer(br.readLine());\\n        for (int i = 0; i < k; i++) {\\n            int c = Integer.parseInt(st.nextToken());\\n            for (int s = c; s <= a; s++) {\\n                ways[s] += ways[s - c];\\n                if (ways[s] >= MOD) ways[s] -= MOD;\\n            }\\n        }\\n        System.out.println(ways[a]);\\n    }\\n}\\n"
 },
 "statement": "A ticket machine at Lakeview station accepts coins of K different values, and a traveller has an unlimited supply of each value. In how many different ways can the traveller pay **exactly** A rupees?\\n\\nTwo ways are the same if they use the same number of coins of each value; the order in which coins go in does not matter. Print the count modulo 1000000007.",
 "inputFormat": "The first line contains K and A.\\nThe second line contains the K distinct coin values.",
 "outputFormat": "Print the number of ways modulo 1000000007.",
 "constraints": "1 <= K <= 100\\n1 <= A <= 10^5\\n1 <= coin value <= 10^5"
}`),
  cases: [
    { input: `1 1
1
`,
      output: `1
` },
    { input: `1 7
2
`,
      output: `0
` },
    { input: `2 100000
100000 1
`,
      output: `2
` },
    { input: `4 10
2 5 3 6
`,
      output: `5
` },
    { input: `10 1000
93 121 124 73 107 59 115 2 105 219
`,
      output: `27484
` },
    { input: `30 20000
2121 1949 1823 83 2430 2475 2745 1163 4933 2541 182 1806 4939 2077 167 1262 4965 225 3808 3743 4905 2427 1838 2538 2964 2116 3443 705 2850 4050
`,
      output: `233102982
` },
    { input: `40 40000
6933 8467 2823 9219 4801 9483 722 4634 1370 102 8575 6113 3847 8027 2532 5061 4985 5185 7552 7432 1077 2692 7902 215 7294 8054 230 7784 2015 7443 1281 8180 373 2359 3806 6656 6050 542 8835 705
`,
      output: `363013155
` },
  ],
};
