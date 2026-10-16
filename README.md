# Anobyt

A React site for 1:1 mock interviews & mentorship for college students.
Sign-in, college batches, tests, interviews and scorecards run on the Anobyt
data service (`https://dataservice.anobyt.in`, see below). Site content,
purchases and coding tests run on Netlify functions.

## Data service (logins, batches, tests, interviews)

All calls go through `src/lib/dataService.js`: every request sends
`X-Secret-Key`, plus `Authorization: Bearer <token>` once signed in. Errors come
back as `{ status, message, details }` and the message is shown as is.

- **Sign-in** (`/login`): email + password, college code + reg no (students a
  college onboarded), Google (only when `VITE_GOOGLE_CLIENT_ID` is set), sign-up,
  forgot password. Email links land on `/verify-email?token=…` and
  `/reset-password?token=…`. Accounts with a temporary password must set their
  own before any page opens. Profile, password and "sign out everywhere" are on
  `/account`.
- **Students** (`/dashboard`): their tests, interview slots with join links and
  feedback, scorecard, announcements and past attempts. Tests run at
  `/exam/<testId>` or from a share link `/t/<slug>`: answers autosave, the timer
  follows the server clock, and proctored tests report tab switches, leaving full
  screen, copy / paste and right-click. Results at `/results/<attemptId>`.
- **Colleges** (`/colleges`): the onboarding form uploads the student sheet to
  the data service.
- **Admins** (`/admin`, ADMIN or SUPERADMIN accounts): Batches (students with
  bulk upload and one-time temporary passwords, tests with rules / results /
  leaderboard / analytics, interviews with Zoom and email / WhatsApp
  confirmations, announcements, scorecard), and the Question bank. Super admins
  also get Overview, College requests (convert one into a batch), Accounts and
  Colleges, plus the Netlify site-content tabs, which still ask for Netlify's
  `ADMIN_PASSWORD`.
- **Purchases bridge**: the data-service token is also sent to the Netlify
  functions as `x-user-token`; `src/lib/server/auth.js` checks it with the data
  service and links it to the purchases record with the same email (older
  records only once that email is confirmed).

Settings:

- Server `.env.prod`: `CORS_ALLOWED_ORIGINS` must list the site's origin
  (today only `https://anobyt.in` is allowed, so `www.anobyt.in` and Netlify
  preview URLs are blocked), `FRONTEND_URL=https://anobyt.in` for the email
  links, and `API_SECRET_KEYS` must include the key the site sends.
- Site (optional): `VITE_DATA_API_URL`, `VITE_DATA_API_KEY` (defaults are built
  in) and `VITE_GOOGLE_CLIENT_ID`. Netlify functions: `DATA_SERVICE_URL`,
  `DATA_SERVICE_KEY` (same defaults).
- `npm run dev` proxies `/ds/*` to the data service without the Origin header
  (`vite.config.js`), so local development works despite CORS.

## Stack

Vite + React 19 + React Router 7 + Tailwind CSS 4 + SheetJS (`xlsx`, loaded
from `cdn.sheetjs.com` since the npm registry build has unpatched CVEs) +
`lucide-react` icons.

## Running locally

```
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Theming

Light/dark mode, toggled from the navbar (sun/moon icon), persisted to
`localStorage`, defaulting to the visitor's OS preference on first visit.
Every color in the app reads from CSS custom-property tokens defined in
`src/index.css` (`--color-surface`, `--color-card`, `--color-border`,
`--color-fg`, `--color-fg-muted`, `--color-accent`, etc.) via Tailwind v4's
`bg-(--color-x)` syntax — when adding new UI, use these tokens rather than
hardcoded `zinc-*`/`white` classes, or it'll only look right in one theme.
One deliberate exception: the homepage hero sits on the fixed-dark vortex
scene in both themes, so it uses the `.force-dark` token override.

## Pages

- `/` — Homepage: hero with an interactive placement-pipeline card, year-by-year
  roadmap, why Anobyt, offerings, how it works and links to every section.
- `/mentors`, `/courses`, `/placement`, `/talks`, `/faq` — content pages.
- `/companies` and `/companies/:id` — searchable list of company hiring
  processes (data in `src/lib/companyPrep.js`), each with a "Book a mock
  session" button that opens `/book` with the company prefilled.
- `/problems`, `/problems/:book`, `/problem/:id` — practice problems grouped
  into books by year, judged in the browser in JavaScript (`src/lib/problems.js`).
- `/practice`, `/take`, `/tests` — ready-made practice tests, taking a test,
  and a test builder whose share link carries the whole test (no server).
- `/dashboard` — signed-in student dashboard (data service): tests,
  interviews, scorecard, announcements, attempts and practice progress.
- `/book` — Student registration form (name, phone, session type, domain,
  optional resume link). Clicking **Confirm & Register** shows an
  immediate on-site success state *and* auto-opens WhatsApp addressed to
  the admin with the same details prefilled, so the same message the
  student sees also lands on the admin's own WhatsApp once they tap Send
  in the chat that opens (WhatsApp itself always requires that tap — no
  website can skip it).
- `/colleges` — Bulk-onboarding page for placement cells: college and contact
  details plus the student Excel/CSV, sent to the data service as an onboarding
  request (super admins see it under College requests).
- `/login`, `/account`, `/exam/:testId`, `/t/:slug`, `/results/:attemptId`,
  `/verify-email`, `/reset-password` — see "Data service" above.
- `/admin` — see "Data service" above and "Admin access" below.

## Admin access

Sign in at `/admin` with a data-service ADMIN or SUPERADMIN account. Batches,
the question bank and the super-admin tabs use that sign-in alone.

The site-content tabs (super admins only) are stored on Netlify and also ask
for Netlify's `ADMIN_PASSWORD` the first time one is opened:

1. In Netlify, open **Site configuration → Environment variables** and add
   `ADMIN_PASSWORD` with a strong password.
2. Redeploy, then enter that password when a site-content tab asks for it.

- **Coding tests**: MCQ, coding and Olympiad-style papers judged on Netlify
  (`netlify/functions/tests.js`), taken at `/assessment/<id>`.
The other server-backed admin tabs (same password):

- **Inbox**: bookings and contact requests submitted on the site (also sent
  to WhatsApp as before), with CSV export.
- **Courses**: create and edit free and premium courses, modules and lessons
  (YouTube / Vimeo / Google Drive video links, notes, PDFs or links, plus
  free-preview lessons). Shown at `/courses` and `/courses/<id>`.
- **Events**: tech talks, workshops, webinars and drives with date, mode,
  venue, speakers, agenda, capacity, registration (on-site form, external
  link or none), joining link (shown only after registering) and recording
  link. Shown at `/talks` and `/talks/<id>`; registrations export as CSV.
- **Premium access**: access codes that unlock premium lessons, per student
  or batch, for all or some courses, with expiry and a device limit.
  Lesson content is only sent to a browser with a valid code, and turning a
  code off locks it again.
- **Site and FAQ**: the top strip text, contact email, an announcement
  banner, and the FAQ.

### Accounts, payments and premium features

Students and colleges create accounts at `/account` (passwords are stored
as PBKDF2 hashes; logic in `src/lib/server/accountsApi.js`, served by
`netlify/functions/accounts.js`). Admin tabs for this:

- **Payments**: add a Razorpay account (Key ID, Key secret, optional webhook
  secret; webhook URL `https://<your-site>/api/pay/webhook`, event
  `order.paid`) and/or a UPI ID for manual payments. Keys can also come from
  Netlify environment variables `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
  `RAZORPAY_WEBHOOK_SECRET`, which take priority. The payments log lets you
  approve UPI payments after checking the transaction ID.
- **Prices and features**: turn each premium feature on or off, make it
  free or paid, and set its price and how long it lasts: Create tests,
  Student records, College panel (includes the other two) and All premium
  courses.
- **Courses**: a premium course has a full-course price and a number of
  free modules; each module can be forced free or paid and can have its
  own price. Paid lesson content is only sent to students who bought it
  (or hold an access code).
- **Users and colleges**: every account, college accounts you create, and
  manual grants or removal of access.
- **Problems**: edit, replace or hide built-in practice problems and add
  new ones: function problems (JavaScript in the browser, Python on the
  runner) or input/output problems in any language with hidden test cases.
- **Compiler**: check each language on the code runner and add an optional
  backup Judge0 runner.

Student pages: `/premium` (plans), `/workspace` (college panel: student
records, own tests and results), `/problems/year/1` (every Year 1 problem on
one page) and `/courses/<id>/learn/<lesson>` (lesson reader).

Content lives in Netlify Blobs (`netlify/functions/content.js`, logic in
`src/lib/server/contentApi.js`). Until something is saved, the site shows the
starting content in `src/lib/content/defaults.js`, and pages fall back to it
if the server can't be reached.

Students take published coding tests at
`/assessment/<id>` (also listed on `/practice`); answers and hidden test
cases never reach the browser, and grading (including running code
against the hidden cases) happens on the server.

Locally, `npm run dev` serves the same API from memory (data resets when
the server restarts); the admin password is `ADMIN_PASSWORD` from your
shell, or `admin` if unset.

## Known limitations

- `/book` bookings still go to WhatsApp (`wa.me` links a person sends by hand)
  and the Netlify Inbox; the data service has no booking endpoint.
- Interview confirmations and announcements by WhatsApp need the WhatsApp
  Cloud API configured on the data service; Zoom links need Zoom configured
  there (otherwise "Create Zoom meeting" returns 503).
- Certificates are unverified PNGs generated in the browser — there's no
  registry or ID to check one against. Fine for a completion certificate,
  not a substitute for a verified credential.

## Deploying

It's a static site — `npm run build` produces `dist/`, deployable as-is to
Netlify (it uses Netlify Functions for the compiler proxy and the tests
API). Set `ADMIN_PASSWORD` in Netlify to use the admin Tests tab.

**Auto-deploy from GitHub via Netlify** (so every `git push` goes live
automatically, no manual redeploy):

1. Push this repo to GitHub (`git remote add origin <url>` then
   `git push -u origin master`) if you haven't already.
2. In Netlify: **Add new site → Import an existing project → GitHub**, pick
   this repo. `netlify.toml` (already in the repo root) tells Netlify the
   build command (`npm run build`), publish directory (`dist`), and Node
   version — so the defaults it suggests should just work, no manual
   config needed. It also sets up the SPA fallback redirect React Router
   needs (without it, refreshing `/book`, `/colleges`, or `/admin` on the
   live site would 404).
3. Once connected, Netlify watches that GitHub branch (`master` by
   default) — every push triggers a new build and deploy automatically,
   with no further action needed on your end. Netlify's dashboard shows
   each deploy and lets you roll back to a previous one if something breaks.

## To customize

- WhatsApp number: `src/lib/whatsapp.js` (`ADMIN_WHATSAPP`)
- Data service URL / key: `src/lib/dataService.js` (or `VITE_DATA_API_URL` / `VITE_DATA_API_KEY`)
- Domains list (used in the booking form + homepage grid):
  `src/lib/domains.js`
- Certificate design/copy: `src/lib/certificate.js`
- Page copy: `src/pages/*.jsx`; shared page styles: the "Page UI" block in
  `src/index.css` (built on the theme tokens above)
