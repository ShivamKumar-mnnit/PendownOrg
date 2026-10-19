# Emailing students their login details

**Where:** Admin panel → Batches → a batch → Students → **Email login details**. Only the super
admin sees this button.

## What it does

For each student in the batch, one at a time:

1. Resets the password with `POST /api/templates/{batchId}/students/{studentId}/reset-password`.
   This endpoint already exists and returns `{temporaryPassword}`. Resetting is the only way to
   get a password the server can show again: existing passwords are stored hashed.
2. Emails the student with the subject and body from the form, with `{password}` replaced by that
   new password. `{name}`, `{rollNo}` and `{college}` work too.
3. Waits the chosen gap (1 second by default), then moves on to the next student.

"Who gets it" defaults to students who haven't signed in yet (`mustChangePassword: true`), so
nobody who already chose their own password is reset. Students without an email are skipped.

The run happens in the browser tab. Closing the tab or the dialog stops it. The log can be
downloaded as a CSV, and it includes every password that was reset. If an email fails after its
reset, the CSV is how to give that student their password another way.

Before resetting anyone, the page checks that the email endpoint below exists. If it doesn't,
nothing is reset.

## Endpoint the data service needs

There is no endpoint yet for an email with a custom subject and body. `/api/email/meeting-invite`
requires a meeting link and start time and renders the interview-invite layout.
`/api/email/test` sends a fixed message.

```
POST /api/email/send            (SUPERADMIN only)
{ "to": "student@example.com", "subject": "…", "text": "…plain text, with line breaks…" }

200 → { "status": "SENT" }
400 → validation error (blank or invalid `to`, blank `subject` / `text`)
```

- `to`: `@NotBlank @Email`, at most 200 characters.
- `subject`: `@NotBlank`, at most 200.
- `text`: `@NotBlank`, at most 10,000. Send it as plain text, keeping the line breaks.
- It should reuse the existing mail sender in `EmailService`, the same one `/api/email/test` uses.
- The frontend sends one request per student, about one per second, so rate limiting needs to
  allow at least 60 requests a minute for the super admin.
- The page checks the endpoint exists by sending an empty body first. It expects a **400** back
  (validation), not an email. So keep the validation annotations: with them, an empty request
  never sends anything.
