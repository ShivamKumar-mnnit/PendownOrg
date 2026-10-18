# Coding problems API

Trainers paste coding problems into **Admin panel → Coding problems** and solve them in the code
room at `/code-room/{id}`: the problem on the left, the compiler on the right and test cases
below. The frontend stores them through the endpoints below, one list per trainer.

These endpoints are live on the data service (2026-10-19). Against a server without them
(a 404), problems are saved in the trainer's browser instead. Problems saved that way before the
endpoints existed show a **Move to my account** button, which uploads them with
`POST /api/coding-problems`.

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
| `GET /api/coding-problems/export?createdBy=` | Same rules as the list | – | `.xlsx` file ("Server export" button) |

There are two Excel exports. **Export to Excel** builds the file in the browser from what's on
screen, so it follows the search and trainer filters. **Server export** downloads the server's
file: everything the user can see, or one trainer's when the super admin has a trainer selected.

## Students

Students add problems from the dashboard ("Add coding problem") and solve them in the same code
room. For their problems to be kept on the server, the endpoints must also accept STUDENT
tokens. Today `CodingProblemController` has `@PreAuthorize(Roles.ADMIN_OR_SUPERADMIN)`, so
students get 403 and the frontend saves their problems in the browser instead.

The service already limits non-super admins to their own `createdById`, so the only change
needed is to let any signed-in user in, e.g. `@PreAuthorize("isAuthenticated()")`. Students then
see and export only their own problems, and the super admin sees everyone's, students included.

`createdByName` should be filled from the owner's account in list and get responses. The super
admin's trainer filter and the Excel "Trainer" column use it.
