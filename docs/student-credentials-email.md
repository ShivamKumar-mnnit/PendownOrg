# Emailing students their login details

**Where:** Admin panel → Batches → a batch → Students → **Email login details**. Only the super
admin sees this button.

## What it does

For each student in the batch, one at a time:

1. Resets the password with the data service's existing
   `POST /api/templates/{batchId}/students/{studentId}/reset-password`, which returns
   `{temporaryPassword}`. Resetting is the only way to get a password that can be shown again:
   the server stores passwords hashed.
2. Emails the student with the subject and body from the form, with `{password}` replaced by that
   new password. `{name}`, `{rollNo}` and `{college}` work too.
3. Waits the chosen gap (1 second by default), then moves on to the next student.

"Who gets it" defaults to students who haven't signed in yet (`mustChangePassword: true`), so
nobody who already chose their own password is reset. Students without an email are skipped.

The run happens in the browser tab. Closing the tab or the dialog stops it. **Download log** gives
a CSV with every reset password. If an email fails after its reset, the CSV is how to give that
student their password another way.

## How the email is sent

**Normally, by the data service:** `POST /api/email/student-credentials`
`{students: [{name, email, regNo, password}]}` returns `{total, sent, failed, skipped, deliveries}`.
It uses the server's own login-details template and mailbox. The page sends one student per
request, right after that student's reset. When the dialog opens, it checks the endpoint exists
by sending an empty list, which emails nobody.

**Fallback, by this website:** only if the server answers 404 to that check. In that case the
page shows the editable subject and body and sends through `netlify/functions/mail.js` at
`POST /api/mail/send`:

- **Who can call it:** only someone signed in as SUPERADMIN. The function checks the
  data-service token (`x-user-token`) against `/api/auth/me`.
- **How it sends:** as plain text, through the same Hostinger mailbox the data service uses.

**Setup (once):** in Netlify, go to Site configuration → Environment variables and add the same
values as `MAIL_*` in the data service's `.env.prod`. Then redeploy.

| Variable | Value |
| --- | --- |
| `MAIL_HOST` | `smtp.hostinger.com` |
| `MAIL_PORT` | `465` |
| `MAIL_SMTP_SSL` | `true` |
| `MAIL_USERNAME` | `contact@anobyt.in` |
| `MAIL_PASSWORD` | the mailbox password (the `MAIL_PASSWORD` in `.env.prod`) |
| `MAIL_FROM` | `contact@anobyt.in` |
| `MAIL_FROM_NAME` | `Anobyt` |

Before resetting anyone, the page sends the function an empty request:

- **400** means email is ready (the empty request is rejected, so nothing is sent).
- **503** means the variables above are missing.
- **404** means the function isn't deployed. It only runs on the Netlify site, not in
  `npm run dev`.

On anything except 400, nothing is reset.

Hostinger mailboxes have sending limits per hour and per day. If emails start failing partway
through, the log shows it. Wait, then run it again. The page remembers, per batch and in this
browser, who it already emailed, and skips them by default. Sending to them again would reset
their password once more and make the first email's password stop working.
