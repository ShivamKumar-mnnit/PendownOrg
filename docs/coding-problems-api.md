# Coding problems API

Trainers paste coding problems into **Admin panel → Coding problems** and solve them in the code
room at `/code-room/{id}`: the problem on the left, the compiler on the right and test cases
below. The frontend stores them through the endpoints below, one list per trainer.

Until these endpoints exist (the frontend gets a 404), problems are saved in the trainer's
browser. Once they exist, a **Move to my account** button uploads those browser-saved problems
with `POST /api/coding-problems`.

The frontend calls them from `src/lib/codingProblems.js`.

## Data

```json
{
  "id": "6f1c…",
  "title": "Maximum subarray sum",
  "statement": "Given an array of n integers… (plain text, up to 20,000 characters)",
  "difficulty": "MEDIUM",
  "tags": ["arrays"],
  "testCases": [
    { "input": "5\n1 -2 3 4 -1\n", "expectedOutput": "7" },
    { "input": "3\n-1 -2 -3\n", "expectedOutput": "" }
  ],
  "createdById": "…",
  "createdByName": "Shivam",
  "createdAt": "2026-10-19T10:00:00Z",
  "updatedAt": "2026-10-19T10:05:00Z"
}
```

- `title`: required, at most 120 characters.
- `statement`: required, at most 20,000 characters.
- `difficulty` and `tags` are optional. `difficulty` uses the question bank's `EASY` / `MEDIUM` / `HARD`.
- `testCases`: at most 50. `input` and `expectedOutput` are each at most 10,000 characters.
- An empty `expectedOutput` means "just run it and show the output". The frontend does the
  comparison itself, so the server only stores the cases.

## Endpoints

| Method and path | Who | Body | Returns |
| --- | --- | --- | --- |
| `GET /api/coding-problems?q=&createdBy=&page=&size=` | ADMIN: only their own. SUPERADMIN: everyone's, or one trainer's with `createdBy`. | – | `{items, page, size, total, totalPages}` (the same page shape as `/api/questions`), newest `updatedAt` first. `q` searches the title and statement. |
| `GET /api/coding-problems/{id}` | The owner, or SUPERADMIN. Anyone else gets 404. | – | The problem |
| `POST /api/coding-problems` | ADMIN, SUPERADMIN | `{title, statement, difficulty?, tags?, testCases}` | The created problem. `createdById` is set to the caller. |
| `PUT /api/coding-problems/{id}` | The owner, or SUPERADMIN | Same as POST (replaces the problem) | The updated problem |
| `DELETE /api/coding-problems/{id}` | The owner, or SUPERADMIN | – | 204 |
| `GET /api/coding-problems/export?createdBy=` *(optional)* | Same rules as the list | – | `.xlsx` file |

The Excel export already works in the browser from the list (trainer: their own, super admin:
all or one trainer's), so the server export is optional.

`createdByName` should be filled from the owner's account in list and get responses. The super
admin's trainer filter and the Excel "Trainer" column use it.
