/* eslint-disable */
// Practice problems (/problems). A few hand-written problems, then
// generated variants grouped into "books" by topic and year. Each problem
// carries a reference solution (`ref`) and test inputs (`in`); the
// student's JavaScript is checked against the reference in the browser.

export const PROBLEMS = [
{id:'even-odd',t:'Even or odd',d:'Easy',tp:'Operators',fn:'evenOdd',pa:'n',desc:'Return "Even" if n is even, otherwise return "Odd". n can be zero or negative.',ref:function(n){return n%2===0?'Even':'Odd'},in:[[4],[7],[0],[-3]]},
{id:'max-array',t:'Largest number',d:'Easy',tp:'Arrays',fn:'maxOfArray',pa:'arr',desc:'Return the largest number in a non-empty array.',ref:function(a){return Math.max.apply(null,a)},in:[[[3,9,2]],[[-5,-1,-8]],[[7]]]},
{id:'reverse-string',t:'Reverse a string',d:'Easy',tp:'Strings',fn:'reverseString',pa:'s',desc:'Return the string written backwards.',ref:function(s){return s.split('').reverse().join('')},in:[['hello'],['a'],[''],['anobyt']]},
{id:'palindrome',t:'Palindrome check',d:'Easy',tp:'Strings',fn:'isPalindrome',pa:'s',desc:'Return true if the string (lowercase letters only) reads the same forwards and backwards. An empty string is a palindrome.',ref:function(s){return s===s.split('').reverse().join('')},in:[['level'],['abca'],[''],['noon']]},
{id:'count-vowels',t:'Count vowels',d:'Easy',tp:'Strings',fn:'countVowels',pa:'s',desc:'Count the vowels (a, e, i, o, u) in the string. Ignore upper or lower case.',ref:function(s){return (s.match(/[aeiou]/gi)||[]).length},in:[['education'],['rhythm'],['AEIOU'],['Anobyt']]},
{id:'factorial',t:'Factorial',d:'Easy',tp:'Loops',fn:'factorial',pa:'n',desc:'Return n! for 0 <= n <= 12. By definition 0! is 1.',ref:function(n){var r=1;for(var i=2;i<=n;i++)r*=i;return r},in:[[5],[0],[1],[10]]},
{id:'fizzbuzz',t:'Fizz and Buzz',d:'Easy',tp:'Loops',fn:'fizzBuzz',pa:'n',desc:'Return an array of strings for 1 to n. Use "Fizz" for multiples of 3, "Buzz" for multiples of 5 and "FizzBuzz" for multiples of both. Every other number becomes a string of itself.',ref:function(n){var r=[];for(var i=1;i<=n;i++)r.push(i%15==0?'FizzBuzz':i%3==0?'Fizz':i%5==0?'Buzz':String(i));return r},in:[[5],[15],[1]]},
{id:'digit-sum',t:'Sum of digits',d:'Easy',tp:'Math',fn:'digitSum',pa:'n',desc:'Return the sum of the digits of a non-negative integer.',ref:function(n){return String(n).split('').reduce(function(a,c){return a+ +c},0)},in:[[1234],[0],[9],[1000000]]},
{id:'two-sum',t:'Pair with target sum',d:'Medium',tp:'Hashing',fn:'pairSum',pa:'nums, target',desc:'Return the indices [i, j] with i < j whose values add up to the target. Exactly one such pair exists.',ref:function(a,t){for(var i=0;i<a.length;i++)for(var j=i+1;j<a.length;j++)if(a[i]+a[j]==t)return [i,j]},in:[[[2,7,11,15],9],[[3,2,4],6],[[3,3],6],[[1,5,8,3],11]]},
{id:'brackets',t:'Balanced brackets',d:'Medium',tp:'Stack',fn:'isBalanced',pa:'s',desc:'The string contains only ( ) [ ] { }. Return true if every bracket is closed by the right type in the right order.',ref:function(s){var st=[],m={')':'(',']':'[','}':'{'};for(var c of s){if('([{'.indexOf(c)>-1)st.push(c);else if(st.pop()!==m[c])return false}return st.length==0},in:[['()[]{}'],['(]'],['([)]'],['{[]}'],['']]},
{id:'max-subarray',t:'Maximum subarray sum',d:'Medium',tp:'Arrays',fn:'maxSubarray',pa:'arr',desc:'Return the largest sum of any contiguous, non-empty part of the array.',ref:function(a){var b=a[0],c=a[0];for(var i=1;i<a.length;i++){c=Math.max(a[i],c+a[i]);b=Math.max(b,c)}return b},in:[[[-2,1,-3,4,-1,2,1,-5,4]],[[1]],[[-3,-1,-2]],[[5,4,-1,7,8]]]},
{id:'binary-search',t:'Binary search',d:'Medium',tp:'Binary search',fn:'binarySearch',pa:'arr, target',desc:'The array is sorted and has distinct values. Return the index of the target, or -1 if it is missing. Aim for O(log n).',ref:function(a,t){return a.indexOf(t)},in:[[[1,3,5,7,9],7],[[1,3,5,7,9],4],[[],1],[[2],2]]},
{id:'anagram-groups',t:'Anagram groups',d:'Medium',tp:'Hashing',fn:'anagramGroups',pa:'words',desc:'Return how many groups the words form when words that are anagrams of each other are put together.',ref:function(w){var m={};w.forEach(function(x){m[x.split('').sort().join('')]=1});return Object.keys(m).length},in:[[['eat','tea','tan','ate','nat','bat']],[['a']],[[]],[['ab','ba','abc']]]},
{id:'merge-intervals',t:'Merge intervals',d:'Medium',tp:'Intervals',fn:'mergeIntervals',pa:'intervals',desc:'Merge all overlapping intervals (touching ends count as overlapping) and return them sorted by start.',ref:function(iv){iv=iv.map(function(x){return x.slice()}).sort(function(a,b){return a[0]-b[0]});var r=[];iv.forEach(function(x){var l=r[r.length-1];if(l&&x[0]<=l[1])l[1]=Math.max(l[1],x[1]);else r.push(x)});return r},in:[[[[1,3],[2,6],[8,10],[15,18]]],[[[1,4],[4,5]]],[[[5,6],[1,2]]]]},
{id:'lis',t:'Longest increasing subsequence',d:'Advanced',tp:'Dynamic programming',fn:'lisLength',pa:'arr',desc:'Return the length of the longest strictly increasing subsequence. Elements need not be next to each other.',ref:function(a){var d=a.map(function(){return 1}),b=0;for(var i=0;i<a.length;i++){for(var j=0;j<i;j++)if(a[j]<a[i])d[i]=Math.max(d[i],d[j]+1);b=Math.max(b,d[i])}return b},in:[[[10,9,2,5,3,7,101,18]],[[0,1,0,3,2,3]],[[7,7,7]],[[]]]},
{id:'coin-change',t:'Fewest coins',d:'Advanced',tp:'Dynamic programming',fn:'fewestCoins',pa:'coins, amount',desc:'Return the fewest coins needed to make the amount (each coin can be used many times), or -1 if it is impossible.',ref:function(c,a){var d=[0];for(var i=1;i<=a;i++){d[i]=1e9;c.forEach(function(x){if(x<=i)d[i]=Math.min(d[i],d[i-x]+1)})}return d[a]>=1e9?-1:d[a]},in:[[[1,2,5],11],[[2],3],[[1],0],[[5,2,1],7],[[3,7],11]]},
{id:'islands',t:'Count islands',d:'Advanced',tp:'Graphs',fn:'countIslands',pa:'grid',desc:'The grid has 1 for land and 0 for water. Return the number of islands. Land cells joined up, down, left or right belong to one island.',ref:function(g){g=g.map(function(r){return r.slice()});var n=0;function f(i,j){if(i<0||j<0||i>=g.length||j>=g[0].length||g[i][j]!=1)return;g[i][j]=0;f(i+1,j);f(i-1,j);f(i,j+1);f(i,j-1)}for(var i=0;i<g.length;i++)for(var j=0;j<g[0].length;j++)if(g[i][j]==1){n++;f(i,j)}return n},in:[[[[1,1,0],[0,1,0],[1,0,1]]],[[[0,0],[0,0]]],[[[1,1],[1,1]]],[[[1,0,1],[0,1,0],[1,0,1]]]]},
{id:'shortest-path',t:'Shortest path in a graph',d:'Advanced',tp:'Graphs',fn:'shortestPath',pa:'n, edges, start, end',desc:'An undirected graph has nodes 0 to n-1 and the given edges. Return the fewest edges on a path from start to end, or -1 if there is none.',ref:function(n,e,s,t){var g=[];for(var i=0;i<n;i++)g.push([]);e.forEach(function(x){g[x[0]].push(x[1]);g[x[1]].push(x[0])});var d={};d[s]=0;var q=[s];while(q.length){var u=q.shift();if(u==t)return d[u];g[u].forEach(function(v){if(d[v]===undefined){d[v]=d[u]+1;q.push(v)}})}return -1},in:[[4,[[0,1],[1,2],[2,3]],0,3],[5,[[0,1],[1,2]],0,4],[3,[[0,1],[1,2],[0,2]],0,2],[1,[],0,0]]},
{id:'edit-distance',t:'Edit distance',d:'Advanced',tp:'Dynamic programming',fn:'editDistance',pa:'a, b',desc:'Return the minimum number of single-character insertions, deletions or replacements needed to turn string a into string b.',ref:function(a,b){var d=[];for(var i=0;i<=a.length;i++){d[i]=[i];for(var j=1;j<=b.length;j++)d[i][j]=i?0:j}for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]==b[j-1]?0:1));return d[a.length][b.length]},in:[['kitten','sitting'],['',''],['abc','abc'],['sunday','saturday']]}];
function rg(a,b){var r=[];for(var i=a;i<=b;i++)r.push(i);return r}
export const BOOKS = [['ops',1,'Operators'],['ascii',1,'ASCII and characters'],['ifelse',1,'If and else'],['loops',1,'Loops'],['pattern',1,'Patterns'],['rec',1,'Recursion'],['func',1,'Functions'],['arr',1,'Arrays'],['str',1,'Strings'],['ll',1,'Linked lists'],['med',2,'Medium problems'],['adv',3,'Advanced problems'],['hard',4,'Hardest problems']];
export const BOOK_NAMES = {};
BOOKS.forEach(function(b){BOOK_NAMES[b[0]]=b[2]});
const MAP = {'even-odd':'ops','max-array':'arr','reverse-string':'str','palindrome':'str','count-vowels':'ascii','factorial':'loops','fizzbuzz':'loops','digit-sum':'loops','two-sum':'med','brackets':'med','max-subarray':'med','binary-search':'med','anagram-groups':'med','merge-intervals':'med','lis':'adv','coin-change':'adv','islands':'adv','shortest-path':'hard','edit-distance':'hard'};
PROBLEMS.forEach(function(x){x.b=MAP[x.id]});
const CNT = {};
function GQ(b,l,t,d,pa,ex,ts,ks,o){(ks||[null]).forEach(function(v){var k=v,m=null;if(Array.isArray(v)){k=v[0];m=v[1]}
function sub(x){return x.split('{k}').join(k).split('{m}').join(m)}
var e=sub(ex),ref=new Function(pa,e.charAt(0)=='{'?e:'return '+e);CNT[b]=(CNT[b]||0)+1;
var q={id:b+'-'+CNT[b],b:b,t:sub(t),d:l,tp:BOOK_NAMES[b],fn:'solve',pa:pa,desc:sub(d),ref:ref,in:ts};if(o)for(var x in o)q[x]=o[x];PROBLEMS.push(q)})}
const C8=['*','#','@','$','+','x','o','-'],E='Easy',M='Medium',N1=[[1],[3],[5]];
GQ('ops',E,'Remainder when divided by {k}','Return the remainder when n is divided by {k}.','n','n%{k}',[[0],[7],[25],[100]],rg(2,11));
GQ('ops',E,'Divisible by {k}?','Return true if n is divisible by {k}, otherwise false.','n','n%{k}===0',[[0],[7],[21],[100],[99]],[3,4,5,6,7,8,9,11,12,13]);
GQ('ops',E,'Add {k}, then double','Return (n + {k}) * 2.','n','(n+{k})*2',[[0],[5],[-3],[10]],rg(1,10));
GQ('ops',M,'Multiple of {k} or {m}','Return true if n is a multiple of {k} or a multiple of {m}.','n','n%{k}===0||n%{m}===0',[[0],[7],[10],[14],[11]],[[2,3],[3,5],[2,7],[4,6],[5,7],[3,4],[2,5],[6,9],[4,10],[7,8]]);
GQ('ops',M,'Is bit {k} set?','Return 1 if bit number {k} of n (counting from 0 on the right) is 1, otherwise 0.','n','(n>>{k})&1',[[0],[5],[8],[255],[1024]],rg(0,7));
GQ('ops',E,'Swap two numbers','Return the two numbers swapped as [b, a].','a, b','[b,a]',[[1,2],[5,-3],[0,0]]);
GQ('ops',M,'Seconds to hours, minutes, seconds','Return [hours, minutes, seconds] for the given number of seconds.','sec','[Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60]',[[0],[59],[3600],[3725],[86399]]);
GQ('ops',E,'Tens digit','Return the tens digit of a non-negative integer (0 if it has one digit).','n','Math.floor(n/10)%10',[[5],[45],[123],[1000]]);
GQ('ops',E,'Rectangle area and perimeter','Return [area, perimeter] of a rectangle with length l and width w.','l, w','[l*w,2*(l+w)]',[[2,3],[10,10],[1,7]]);
GQ('ascii',E,'ASCII code at index {k}','Return the ASCII code of the character at index {k} of s, or -1 if the string is too short.','s','s.length>{k}?s.charCodeAt({k}):-1',[['A'],['hello'],['Zebra'],['']],rg(0,7));
GQ('ascii',E,'Shift letters forward by {k}','Shift every lowercase letter in s forward by {k} places, wrapping from z to a. Leave other characters unchanged.','s','s.replace(/[a-z]/g,function(c){return String.fromCharCode((c.charCodeAt(0)-97+{k})%26+97)})',[['abc'],['xyz'],['hello world'],['']],rg(1,12));
GQ('ascii',M,'Characters with ASCII code above {k}','Count the characters in s whose ASCII code is greater than {k}.','s','s.split("").filter(function(c){return c.charCodeAt(0)>{k}}).length',[['Hello World'],['abc123'],[''],['ZZZ']],[64,70,80,90,96,100,105,110,115,120]);
GQ('ascii',E,'Count the letter {k}','Count how many times the letter "{k}" appears in s, ignoring case.','s','s.toLowerCase().split("{k}").length-1',[['Education'],['Anobyt Students'],['rhythm'],['']],['a','e','i','o','s','t','n','r']);
GQ('ascii',M,'ASCII code between {k} and {m}','Return true if the ASCII code of character c lies between {k} and {m}, ends included.','c','c.charCodeAt(0)>={k}&&c.charCodeAt(0)<={m}',[['a'],['A'],['5'],['#'],[' ']],[[48,57],[65,90],[97,122],[65,70],[97,102],[48,53],[33,47],[58,64]]);
GQ('ascii',E,'Sum of ASCII codes','Return the sum of the ASCII codes of all characters in s.','s','s.split("").reduce(function(a,c){return a+c.charCodeAt(0)},0)',[['A'],['abc'],['']]);
GQ('ascii',M,'Swap letter case','Change every uppercase letter to lowercase and every lowercase letter to uppercase. Leave other characters unchanged.','s','s.replace(/[a-zA-Z]/g,function(c){return c===c.toUpperCase()?c.toLowerCase():c.toUpperCase()})',[['Hello World'],['abc123'],['']]);
GQ('ascii',E,'Character type','Return "digit", "upper", "lower" or "other" for the single character c.','c','/[0-9]/.test(c)?"digit":/[A-Z]/.test(c)?"upper":/[a-z]/.test(c)?"lower":"other"',[['5'],['a'],['Z'],['#'],[' ']]);
GQ('ifelse',E,'Greater than {k}?','Return "Yes" if n is greater than {k}, otherwise "No".','n','n>{k}?"Yes":"No"',[[-5],[0],[5],[10],[50]],[0,5,10,15,20,25,30,40]);
GQ('ifelse',E,'Pass mark {k}','Return "Pass" if marks are at least {k}, otherwise "Fail".','marks','marks>={k}?"Pass":"Fail"',[[0],[34],[35],[40],[75],[100]],[33,35,36,40,45,50,55,60]);
GQ('ifelse',E,'Divisible by {k}: message','Return "Divisible" if n is divisible by {k}, otherwise "Not divisible".','n','n%{k}===0?"Divisible":"Not divisible"',[[0],[7],[12],[25],[30]],rg(2,9));
GQ('ifelse',M,'Between {k} and {m}','Return true if n lies between {k} and {m}, ends included.','n','n>={k}&&n<={m}',[[-1],[0],[10],[50],[100]],[[0,10],[10,20],[5,15],[20,50],[1,100],[25,75],[10,100],[30,40]]);
GQ('ifelse',M,'Discount above {k}','If bill is more than {k}, return the bill minus 10 percent, otherwise return the bill unchanged. The bill is a multiple of 10.','bill','bill>{k}?bill-bill/10:bill',[[100],[500],[1000],[2000],[50]],[100,200,300,400,500,600,800,1000]);
GQ('ifelse',M,'Leap year','Return true if the year is a leap year: divisible by 4 and not by 100, or divisible by 400.','year','(year%4===0&&year%100!==0)||year%400===0',[[2000],[1900],[2024],[2023],[2100],[1600]]);
GQ('ifelse',M,'Valid triangle','Return true if sides a, b and c can form a triangle (each pair of sides adds to more than the third side).','a, b, c','a+b>c&&a+c>b&&b+c>a',[[3,4,5],[1,2,3],[5,5,5],[2,2,5],[7,10,5]]);
GQ('ifelse',E,'Is it a vowel?','Return true if the character c is a vowel (a, e, i, o, u in any case).','c','"aeiouAEIOU".indexOf(c)>-1',[['a'],['E'],['b'],['U'],['z']]);
GQ('ifelse',E,'Larger of two','Return the larger of a and b.','a, b','a>b?a:b',[[1,2],[9,3],[5,5],[-4,-9]]);
GQ('loops',E,'Sum of multiples of {k}','Return the sum of all multiples of {k} from 1 to n.','n','{var s=0;for(var i={k};i<=n;i+={k})s+=i;return s}',[[0],[10],[50],[100]],rg(2,11));
GQ('loops',E,'First n multiples of {k}','Return an array holding the first n multiples of {k}.','n','{var r=[];for(var i=1;i<=n;i++)r.push(i*{k});return r}',[[0],[1],[5],[10]],rg(2,9));
GQ('loops',M,'Sum of powers of {k}','Return {k}^0 + {k}^1 + ... + {k}^n.','n','{var s=0;for(var i=0;i<=n;i++)s+=Math.pow({k},i);return s}',[[0],[1],[4],[6]],rg(2,9));
GQ('loops',M,'Count of digit {k} from 1 to n','Count how many times the digit {k} appears when all numbers from 1 to n are written down.','n','{var c=0;for(var i=1;i<=n;i++)c+=String(i).split("{k}").length-1;return c}',[[9],[20],[100]],rg(1,9));
GQ('loops',M,'Divisible by {k} but not {m}','Count the numbers from 1 to n that are divisible by {k} but not by {m}.','n','{var c=0;for(var i=1;i<=n;i++)if(i%{k}===0&&i%{m}!==0)c++;return c}',[[10],[50],[100]],[[2,4],[3,9],[5,10],[2,6],[3,6],[4,8],[5,15],[7,14]]);
GQ('loops',E,'Sum of squares','Return 1*1 + 2*2 + ... + n*n.','n','{var s=0;for(var i=1;i<=n;i++)s+=i*i;return s}',[[0],[3],[10]]);
GQ('loops',E,'Reverse a number','Return the digits of a non-negative integer n in reverse order, as a number.','n','{var r=0;while(n>0){r=r*10+n%10;n=Math.floor(n/10)}return r}',[[123],[100],[7],[9080]]);
GQ('loops',M,'Armstrong number','Return true if n equals the sum of its digits, each raised to the power of the number of digits.','n','{var s=String(n),t=0;for(var c of s)t+=Math.pow(+c,s.length);return t===n}',[[153],[370],[100],[9],[9474]]);
GQ('loops',M,'Greatest common divisor','Return the GCD of a and b (both positive).','a, b','{while(b){var t=b;b=a%b;a=t}return a}',[[12,18],[7,5],[100,75],[9,9]]);
GQ('loops',M,'Digital root','Keep adding the digits of n until one digit is left. Return that digit.','n','{while(n>9){var s=0;while(n>0){s+=n%10;n=Math.floor(n/10)}n=s}return n}',[[0],[9],[38],[99999]]);
GQ('loops',E,'Fibonacci number','Return the nth Fibonacci number where F(0) = 0 and F(1) = 1.','n','{var a=0,b=1;for(var i=0;i<n;i++){var t=a+b;a=b;b=t}return a}',[[0],[1],[7],[20]]);
GQ('loops',M,'Perfect number','Return true if n equals the sum of its divisors that are smaller than n.','n','{var s=0;for(var i=1;i<n;i++)if(n%i===0)s+=i;return n>1&&s===n}',[[6],[28],[12],[1],[496]]);
GQ('loops',E,'Number of digits','Return how many digits the non-negative integer n has (0 has one digit).','n','String(n).length',[[0],[9],[100],[12345]]);
GQ('pattern',E,'Right triangle of {k}','Return n lines. Line i (starting from 1) holds i copies of the character "{k}".','n','{var r=[];for(var i=1;i<=n;i++)r.push("{k}".repeat(i));return r}',N1,C8);
GQ('pattern',E,'Inverted triangle of {k}','Return n lines. The first line holds n copies of "{k}" and each next line holds one fewer.','n','{var r=[];for(var i=n;i>=1;i--)r.push("{k}".repeat(i));return r}',N1,C8);
GQ('pattern',E,'Rectangle of {k}','Return rows lines, each made of cols copies of "{k}".','rows, cols','{var r=[];for(var i=0;i<rows;i++)r.push("{k}".repeat(cols));return r}',[[1,1],[2,5],[3,3],[4,2]],C8);
GQ('pattern',M,'Pyramid of {k}','Return n lines. Line i has n-i spaces followed by 2*i-1 copies of "{k}".','n','{var r=[];for(var i=1;i<=n;i++)r.push(" ".repeat(n-i)+"{k}".repeat(2*i-1));return r}',[[1],[3],[4]],C8);
GQ('pattern',M,'Diamond of {k}','Return 2*n-1 lines: a pyramid of n lines (line i has n-i spaces then 2*i-1 copies of "{k}") followed by the same pyramid upside down without its widest line.','n','{var r=[];for(var i=1;i<=n;i++)r.push(" ".repeat(n-i)+"{k}".repeat(2*i-1));for(i=n-1;i>=1;i--)r.push(" ".repeat(n-i)+"{k}".repeat(2*i-1));return r}',[[1],[2],[4]],C8);
GQ('pattern',M,'Hollow square of {k}','Return n lines of n characters. The border uses "{k}" and the inside uses spaces.','n','{var r=[];for(var i=0;i<n;i++)r.push(i===0||i===n-1?"{k}".repeat(n):"{k}"+" ".repeat(Math.max(n-2,0))+"{k}");return r}',[[1],[2],[4],[5]],C8);
GQ('pattern',M,'Right-aligned triangle of {k}','Return n lines. Line i has n-i spaces followed by i copies of "{k}".','n','{var r=[];for(var i=1;i<=n;i++)r.push(" ".repeat(n-i)+"{k}".repeat(i));return r}',N1,C8);
GQ('pattern',E,'Number triangle','Return n lines. Line i holds the numbers 1 to i separated by single spaces.','n','{var r=[];for(var i=1;i<=n;i++){var a=[];for(var j=1;j<=i;j++)a.push(j);r.push(a.join(" "))}return r}',N1);
GQ('pattern',M,'Floyd triangle','Return n lines of consecutive numbers starting at 1. Line i holds i numbers separated by single spaces.','n','{var r=[],c=1;for(var i=1;i<=n;i++){var a=[];for(var j=0;j<i;j++)a.push(c++);r.push(a.join(" "))}return r}',N1);
GQ('pattern',E,'Alphabet triangle','Return n lines. Line i holds the first i capital letters starting from A, with no spaces.','n','{var r=[];for(var i=1;i<=n;i++){var t="";for(var j=0;j<i;j++)t+=String.fromCharCode(65+j);r.push(t)}return r}',N1);
GQ('pattern',M,'Checkerboard','Return n lines of n characters, alternating "1" and "0". The top-left character is "1".','n','{var r=[];for(var i=0;i<n;i++){var t="";for(var j=0;j<n;j++)t+=(i+j)%2===0?"1":"0";r.push(t)}return r}',[[1],[2],[4],[5]]);
GQ('rec',E,'Sum of first n multiples of {k}','Return {k} + 2*{k} + ... + n*{k}. Solve it with recursion.','n','{k}*n*(n+1)/2',[[0],[1],[5],[10]],rg(2,11));
GQ('rec',E,'Power of {k}','Return {k} raised to the power n (n >= 0), using recursion.','n','Math.pow({k},n)',[[0],[1],[5],[8]],rg(2,9));
GQ('rec',M,'Sequence a(n) = a(n-1) * {k} + 1','Return a(n) where a(0) = 1 and a(n) = a(n-1) * {k} + 1. Use recursion.','n','{var a=1;for(var i=0;i<n;i++)a=a*{k}+1;return a}',[[0],[1],[3],[6]],rg(2,9));
GQ('rec',M,'Fibonacci-style start {k}, {m}','Return f(n) where f(0) = {k}, f(1) = {m} and f(n) = f(n-1) + f(n-2).','n','{var a={k},b={m};for(var i=0;i<n;i++){var t=a+b;a=b;b=t}return a}',[[0],[1],[2],[5],[10]],[[0,1],[1,1],[2,1],[1,3],[3,4],[0,2],[5,5],[2,7]]);
GQ('rec',M,'Josephus with step {k}','n people stand in a circle numbered 1 to n. Counting from person 1, every {k}th person is removed until one remains. Return the number of the survivor.','n','{var r=0;for(var i=2;i<=n;i++)r=(r+{k})%i;return r+1}',[[1],[5],[7],[10]],rg(2,7));
GQ('rec',M,'Subsets with sum {k}','Count the subsets of the array whose elements add up to {k}.','arr','{var c=0,n=arr.length;for(var m=0;m<(1<<n);m++){var s=0;for(var i=0;i<n;i++)if(m>>i&1)s+=arr[i];if(s==={k})c++}return c}',[[[1,2,3,4]],[[2,2,3]],[[]],[[5,5,5]]],rg(3,8));
GQ('rec',M,'Climb stairs with steps up to {k}','You climb n stairs, taking 1 to {k} steps at a time. Return the number of different ways to reach the top.','n','{var w=[1];for(var i=1;i<=n;i++){w[i]=0;for(var j=1;j<=Math.min({k},i);j++)w[i]+=w[i-j]}return w[n]}',[[0],[1],[4],[7]],rg(2,7));
GQ('rec',E,'Factorial using recursion','Return n! (n >= 0) with a function that calls itself.','n','{var r=1;for(var i=2;i<=n;i++)r*=i;return r}',[[0],[1],[5],[10]]);
GQ('rec',E,'Digit sum using recursion','Return the sum of the digits of n using recursion.','n','String(n).split("").reduce(function(a,c){return a+ +c},0)',[[0],[9],[1234],[99999]]);
GQ('rec',E,'Tower of Hanoi moves','Return the fewest moves needed to move n disks.','n','Math.pow(2,n)-1',[[0],[1],[3],[10]]);
GQ('rec',M,'Binomial coefficient','Return C(n, r), the number of ways to choose r items from n.','n, r','{var d=[];for(var i=0;i<=n;i++){d[i]=[1];for(var j=1;j<=i;j++)d[i][j]=(d[i-1][j-1]||0)+(d[i-1][j]||0)}return d[n][r]}',[[5,2],[6,0],[6,6],[10,3]]);
GQ('rec',E,'Reverse a string using recursion','Return s reversed, using recursion.','s','s.split("").reverse().join("")',[['abc'],[''],['anobyt']]);
GQ('func',E,'Is prime','Return true if n is a prime number.','n','{if(n<2)return false;for(var i=2;i*i<=n;i++)if(n%i===0)return false;return true}',[[0],[1],[2],[17],[21],[97]]);
GQ('func',M,'Count primes up to n','Return how many prime numbers are less than or equal to n.','n','{var c=0;for(var i=2;i<=n;i++){var p=true;for(var j=2;j*j<=i;j++)if(i%j===0){p=false;break}if(p)c++}return c}',[[1],[10],[30],[100]]);
GQ('func',M,'Numbers up to n with exactly {k} divisors','Count the numbers from 1 to n that have exactly {k} divisors.','n','{var c=0;for(var i=1;i<=n;i++){var d=0;for(var j=1;j<=i;j++)if(i%j===0)d++;if(d==={k})c++}return c}',[[10],[30],[100]],[2,3,4,5,6,8]);
GQ('func',M,'Numbers up to n with digit sum {k}','Count the numbers from 1 to n whose digits add up to {k}.','n','{var c=0;for(var i=1;i<=n;i++)if(String(i).split("").reduce(function(a,d){return a+ +d},0)==={k})c++;return c}',[[10],[50],[100],[300]],rg(1,12));
GQ('func',M,'Primes up to n that leave remainder 1 mod {k}','Count the primes p <= n for which p % {k} equals 1.','n','{var c=0;for(var i=2;i<=n;i++){var p=true;for(var j=2;j*j<=i;j++)if(i%j===0){p=false;break}if(p&&i%{k}===1)c++}return c}',[[10],[30],[100]],rg(3,10));
GQ('func',E,'Largest multiple of {k} below n','Return the largest multiple of {k} that is less than n (n is greater than {k}).','n','Math.floor((n-1)/{k})*{k}',[[12],[50],[101]],rg(2,11));
GQ('func',M,'Apply the Collatz rule {k} times','Start with n. Do this {k} times: if the number is even, halve it, otherwise multiply it by 3 and add 1. Return the final number (n >= 1).','n','{for(var i=0;i<{k};i++)n=n%2===0?n/2:3*n+1;return n}',[[1],[6],[7],[27]],rg(1,8));
GQ('func',M,'LCM','Return the least common multiple of a and b (both positive).','a, b','{var x=a,y=b;while(y){var t=y;y=x%y;x=t}return a/x*b}',[[4,6],[7,5],[12,18],[9,9]]);
GQ('func',M,'Sum of divisors','Return the sum of all divisors of n, including 1 and n (n >= 1).','n','{var s=0;for(var i=1;i<=n;i++)if(n%i===0)s+=i;return s}',[[1],[6],[12],[28],[97]]);
GQ('func',M,'Largest prime factor','Return the largest prime factor of n (n >= 2).','n','{var m=1;for(var i=2;i<=n;i++)while(n%i===0){m=i;n/=i}return m}',[[2],[10],[13],[84],[13195]]);
GQ('func',M,'Power with modulus','Return (a to the power b) modulo m.','a, b, m','{var r=1;a%=m;for(var i=0;i<b;i++)r=r*a%m;return r}',[[2,10,1000],[3,5,7],[5,0,13],[7,20,13]]);
GQ('func',M,'Twin primes','Return true if both n and n + 2 are prime.','n','{function q(x){if(x<2)return false;for(var i=2;i*i<=x;i++)if(x%i===0)return false;return true}return q(n)&&q(n+2)}',[[3],[5],[11],[13],[17],[29]]);
GQ('arr',E,'Count elements greater than {k}','Return how many elements of the array are greater than {k}.','arr','arr.filter(function(x){return x>{k}}).length',[[[1,5,10,20]],[[]],[[-3,0,3]],[[100,200]]],[0,1,2,3,5,10,20,50]);
GQ('arr',E,'Sum of elements divisible by {k}','Return the sum of the elements that are divisible by {k}.','arr','arr.filter(function(x){return x%{k}===0}).reduce(function(a,b){return a+b},0)',[[[1,2,3,4,5,6,7,8,9,10]],[[]],[[12,15,18]],[[11,13]]],rg(2,9));
GQ('arr',E,'Multiply every element by {k}','Return a new array with every element multiplied by {k}.','arr','arr.map(function(x){return x*{k}})',[[[1,2,3]],[[]],[[-1,2,5]]],rg(2,9));
GQ('arr',M,'Rotate left by {k}','Return a new array rotated left by {k} positions, wrapping around.','arr','{var n=arr.length;if(!n)return [];var t={k}%n;return arr.slice(t).concat(arr.slice(0,t))}',[[[1,2,3,4,5]],[[]],[[1,2]],[[7]]],rg(1,8));
GQ('arr',M,'Pairs with sum {k}','Count the pairs of positions i < j where arr[i] + arr[j] equals {k}.','arr','{var c=0;for(var i=0;i<arr.length;i++)for(var j=i+1;j<arr.length;j++)if(arr[i]+arr[j]==={k})c++;return c}',[[[1,2,3,4,5,6]],[[5,5,5]],[[]],[[7,8,9]]],rg(5,12));
GQ('arr',M,'Best window of length {k}','Return the largest sum of {k} consecutive elements, or -1 if the array has fewer than {k} elements.','arr','{if(arr.length<{k})return -1;var b=-1e9;for(var i=0;i+{k}<=arr.length;i++){var t=0;for(var j=i;j<i+{k};j++)t+=arr[j];if(t>b)b=t}return b}',[[[1,5,2,8,3]],[[4]],[[1,2,3,4,5,6,7]]],rg(2,7));
GQ('arr',E,'Reverse an array','Return a new array with the elements in reverse order.','arr','arr.slice().reverse()',[[[1,2,3]],[[]],[[5]]]);
GQ('arr',E,'Is the array sorted?','Return true if the array is in non-decreasing order.','arr','arr.every(function(x,i){return i===0||arr[i-1]<=x})',[[[1,2,2,3]],[[3,2]],[[]],[[5]]]);
GQ('arr',M,'Move zeros to the end','Move all zeros to the end, keeping the order of the other elements. Return the new array.','arr','arr.filter(function(x){return x!==0}).concat(arr.filter(function(x){return x===0}))',[[[0,1,0,3,12]],[[0,0]],[[1,2]],[[]]]);
GQ('arr',M,'Missing number','The array holds the numbers 0 to n in any order, with one missing. Return the missing number.','arr','{var n=arr.length,t=n*(n+1)/2;for(var i=0;i<n;i++)t-=arr[i];return t}',[[[3,0,1]],[[0,1]],[[1]],[[9,6,4,2,3,5,7,0,1]]]);
GQ('arr',M,'Second largest value','Return the second largest distinct value, or -1 if there is none.','arr','{var u=Array.from(new Set(arr)).sort(function(a,b){return b-a});return u.length>1?u[1]:-1}',[[[4,9,9,2]],[[5,5]],[[1,2]],[[]]]);
GQ('arr',M,'Remove duplicates','Return the array with repeated values removed, keeping the first occurrence of each.','arr','arr.filter(function(x,i){return arr.indexOf(x)===i})',[[[1,2,2,3,1]],[[]],[[4,4,4]]]);
GQ('str',E,'Repeat each character {k} times','Return s with every character repeated {k} times.','s','s.split("").map(function(c){return c.repeat({k})}).join("")',[['abc'],[''],['a1']],rg(2,9));
GQ('str',E,'First {k} characters','Return the first {k} characters of s (all of s if it is shorter).','s','s.slice(0,{k})',[['education'],['ab'],['']],rg(1,8));
GQ('str',M,'Words longer than {k}','Count the words (separated by single spaces) that have more than {k} letters.','s','s.split(" ").filter(function(w){return w.length>{k}}).length',[['hello world'],['a bb ccc dddd'],[''],['the quick brown fox']],rg(1,8));
GQ('str',M,'Rotate string left by {k}','Rotate the string left by {k} characters, wrapping around.','s','s.length?s.slice({k}%s.length)+s.slice(0,{k}%s.length):s',[['abcdef'],['a'],['']],rg(1,8));
GQ('str',M,'Hyphen after every {k} characters','Insert a hyphen after every {k} characters, but not at the end of the string.','s','{var r="";for(var i=0;i<s.length;i++){r+=s[i];if((i+1)%{k}===0&&i<s.length-1)r+="-"}return r}',[['abcdefgh'],['abc'],['']],rg(2,6));
GQ('str',M,'Palindromes of length {k}','Count the substrings of length {k} that are palindromes (substrings at different positions count separately).','s','{var c=0;for(var i=0;i+{k}<=s.length;i++){var t=s.slice(i,i+{k});if(t===t.split("").reverse().join(""))c++}return c}',[['abba'],['aaaa'],['abcba'],['abc']],rg(2,6));
GQ('str',E,'Count words','Return the number of words in s. Words are separated by one or more spaces.','s','s.trim()===""?0:s.trim().split(/ +/).length',[['hello world'],['  a  b  c '],[''],['one']]);
GQ('str',M,'Capitalize each word','Return s with the first letter of every word in capitals. Words are separated by single spaces.','s','s.split(" ").map(function(w){return w.charAt(0).toUpperCase()+w.slice(1)}).join(" ")',[['hello world'],['anobyt is great'],[''],['a']]);
GQ('str',M,'Reverse the order of words','Return the words of s in reverse order, separated by single spaces.','s','s.split(" ").reverse().join(" ")',[['hello world'],['a b c'],['one']]);
GQ('str',M,'Are two strings anagrams?','Return true if b is made of exactly the same letters as a, in any order.','a, b','a.split("").sort().join("")===b.split("").sort().join("")',[['listen','silent'],['abc','abd'],['',''],['aab','aba']]);
GQ('str',M,'First non-repeating character','Return the index of the first character that appears only once in s, or -1.','s','{for(var i=0;i<s.length;i++)if(s.indexOf(s[i])===s.lastIndexOf(s[i]))return i;return -1}',[['leetcode'],['aabb'],[''],['abca']]);
GQ('str',M,'String compression','Compress runs of equal characters: "aaabb" becomes "a3b2". Always write the count, even when it is 1.','s','{var r="";for(var i=0;i<s.length;){var j=i;while(j<s.length&&s[j]===s[i])j++;r+=s[i]+(j-i);i=j}return r}',[['aaabb'],['abc'],[''],['zzzzzzzzzzzz']]);
GQ('str',M,'Is it a pangram?','Return true if s contains every letter from a to z at least once, ignoring case.','s','"abcdefghijklmnopqrstuvwxyz".split("").every(function(c){return s.toLowerCase().indexOf(c)>-1})',[['The quick brown fox jumps over the lazy dog'],['hello'],['']]);
const LL1={ll:[0]},LL2={ll:[0],out:'list'};
GQ('ll',E,'Nodes greater than {k}','Return how many nodes hold a value greater than {k}.','head','head.filter(function(x){return x>{k}}).length',[[[1,5,10,20]],[[]],[[-3,0,3]]],[0,1,2,3,5,10,15,20],LL1);
GQ('ll',E,'Sum of values divisible by {k}','Return the sum of the node values that are divisible by {k}.','head','head.filter(function(x){return x%{k}===0}).reduce(function(a,b){return a+b},0)',[[[1,2,3,4,5,6]],[[]],[[7,14]]],rg(2,9),LL1);
GQ('ll',M,'Remove all nodes with value {k}','Remove every node whose value is {k}.','head','head.filter(function(x){return x!=={k}})',[[[1,2,3,2,4]],[[]],[[2,2]],[[5]]],rg(0,7),LL2);
GQ('ll',M,'Multiply each value by {k}','Multiply the value of every node by {k}.','head','head.map(function(x){return x*{k}})',[[[1,2,3]],[[]],[[4]]],rg(2,9),LL2);
GQ('ll',E,'Value at position {k}','Return the value of the {k}th node (the head is position 1), or -1 if the list is shorter.','head','head.length>={k}?head[{k}-1]:-1',[[[10,20,30]],[[]],[[7]]],rg(1,8),LL1);
GQ('ll',E,'Insert {k} at the head','Add a new node with value {k} at the front of the list.','head','[{k}].concat(head)',[[[1,2]],[[]],[[9]]],rg(1,8),LL2);
GQ('ll',M,'Delete the node at index {k}','Delete the node at index {k} (the head is index 0). If there is no such node, leave the list unchanged.','head','head.filter(function(x,i){return i!=={k}})',[[[1,2,3,4]],[[]],[[9]]],rg(0,7),LL2);
GQ('ll',M,'Value {k}th from the end','Return the value of the {k}th node from the end (the last node is 1), or -1 if the list is shorter.','head','head.length>={k}?head[head.length-{k}]:-1',[[[1,2,3,4,5]],[[1,2]],[[]]],rg(1,5),LL1);
GQ('ll',E,'Length of a list','Return the number of nodes in the list.','head','head.length',[[[1,2,3]],[[]],[[5]]],null,LL1);
GQ('ll',M,'Reverse a list','Reverse the list.','head','head.slice().reverse()',[[[1,2,3]],[[]],[[5]]],null,LL2);
GQ('ll',M,'Middle node value','Return the value of the middle node (the second middle node if there are two). Return -1 for an empty list.','head','head.length?head[Math.floor(head.length/2)]:-1',[[[1,2,3]],[[1,2,3,4]],[[]],[[8]]],null,LL1);
GQ('ll',M,'Is the list a palindrome?','Return true if the values read the same from head to tail and from tail to head.','head','head.join(",")===head.slice().reverse().join(",")',[[[1,2,2,1]],[[1,2,3]],[[]],[[7]]],null,LL1);
GQ('ll',M,'Merge two sorted lists','Both lists are sorted in non-decreasing order. Merge them into one sorted list.','a, b','a.concat(b).sort(function(x,y){return x-y})',[[[1,3,5],[2,4,6]],[[],[1]],[[1,1],[1]],[[],[]]],null,{ll:[0,1],out:'list'});
GQ('ll',M,'Remove duplicates from a sorted list','The list is sorted. Remove repeated values so that each value appears once.','head','head.filter(function(x,i){return i===0||head[i-1]!==x})',[[[1,1,2,3,3]],[[]],[[2,2,2]]],null,LL2);

export const YEAR_TITLES = { 1: "Year 1: Foundations", 2: "Year 2: Medium problems", 3: "Year 3: Advanced problems", 4: "Year 4: Hardest problems" };

export function difficultyClass(d) {
  return d === "Easy" ? "free" : d === "Medium" ? "med" : "adv";
}

export function getProblem(id) {
  return PROBLEMS.find((p) => p.id === id);
}

export function problemsInBook(bookId) {
  return PROBLEMS.filter((p) => p.b === bookId);
}

function toList(a) {
  return a.reduceRight((next, val) => ({ val, next }), null);
}

function toArr(h) {
  const r = [];
  let c = 0;
  while (h && typeof h === "object" && c++ < 100000) {
    r.push(h.val);
    h = h.next;
  }
  return r;
}

const clone = (x) => JSON.parse(JSON.stringify(x));

/** Example line shown on the problem page, from the first test input. */
export function exampleFor(p) {
  const a0 = p.in[0];
  return p.fn + "(" + a0.map((x) => JSON.stringify(x)).join(", ") + ") returns " + JSON.stringify(p.ref(...clone(a0)));
}

export function starterCode(p) {
  return "function " + p.fn + "(" + p.pa + ") {\n  " + (p.ll ? "// head is a node with val and next (null at the end).\n  // " : "// ") + "write your solution here\n\n}\n";
}

/** Runs the student's code against every test input. */
export function judge(p, code) {
  let f;
  try {
    f = new Function(code + "\nreturn " + p.fn + ";")();
  } catch (e) {
    return { err: "Error: " + e.message };
  }
  if (typeof f !== "function") return { err: "Define a function named " + p.fn + "." };
  let ok = true;
  const res = p.in.map((a) => {
    const exp = p.ref(...clone(a));
    let got;
    let pass = false;
    let err = "";
    try {
      const ar = clone(a);
      (p.ll || []).forEach((ix) => (ar[ix] = toList(ar[ix])));
      got = f(...ar);
      if (p.out) got = toArr(got);
      pass = JSON.stringify(got) === JSON.stringify(exp);
    } catch (e) {
      err = e.message;
    }
    if (!pass) ok = false;
    return { a, exp, got, pass, err };
  });
  return { res, ok };
}
