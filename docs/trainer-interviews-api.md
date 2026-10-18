# Trainer interviews, score cards and meeting links

The data service endpoints the frontend uses, and how to switch on Microsoft Teams meetings.

If the frontend talks to an older data service that doesn't have these endpoints, the pages
fall back to the batch endpoints. Trainers then see the interviews where their email is the
mentor email, and score cards, recording links and "In progress" are switched off.

## Statuses

`UPCOMING`, `IN_PROGRESS`, `DONE`, `CANCELLED`, `NO_SHOW`. The frontend also reads the old
`SCHEDULED` / `COMPLETED` names and sends the old names to a server that still uses them.

## Changes to existing endpoints

| Endpoint | Change |
| --- | --- |
| `POST /api/templates/{id}/interviews` | Accepts `interviewerId`, `studentInterviewNo`, `meetingPlatform`, `recordingLink`. The frontend now sends `createZoomMeeting: false`. |
| `PATCH /api/interviews/{id}` | Accepts the same new fields. |
| `GET /api/templates/{id}/interviews` | Each row includes `interviewNo`, `studentInterviewNo`, `interviewerId`, `meetingPlatform`, `recordingLink`, `startedAt`, `endedAt`, `scorecard` (`ScorecardSummary`). |
| `GET /api/interviews/me` (student) | Same fields, with `ScorecardSummary.of(report, forStudent = true)` so the percentage stays hidden until published. Don't send `recordingLink` to students. |

## New endpoints

These are live on the data service. Each one is called from `interviewApi` / `studentApi` in
`src/lib/dataService.js`. The assigned trainer, the batch owner and a super admin can change
status, links and the score card; any other admin gets 403.

| # | Method and path | Used for |
| --- | --- | --- |
| 1 | `GET /api/trainers` | Interviewer dropdown when scheduling |
| 2 | `GET /api/trainer/interviews?status=&templateId=&from=&to=` | Trainer dashboard: `{counts, interviews}` |
| 3 | `GET /api/interviews/{id}` | One interview |
| 4 | `PATCH /api/interviews/{id}/status` `{status}` | Status dropdown on the dashboard |
| 5 | `PUT /api/interviews/{id}/links` `{meetingLink, recordingLink, meetingPlatform}` | Links form (only the fields sent change, `""` clears one) |
| 6 | `GET /api/interviews/{id}/scorecard` | Score card editor and the trainer's preview (drafts too) |
| 7 | `PUT /api/interviews/{id}/scorecard` | Save the score card. The server works out `overallPercent` and marks the interview DONE. |
| 8 | `POST /api/interviews/{id}/scorecard/publish` `{notifyStudent}` | Publish (emails the student) |
| 9 | `POST /api/interviews/{id}/scorecard/unpublish` | Unpublish |
| 10 | `GET /api/student/interview-scorecards` | Student dashboard: which interviews have a published score card |
| 11 | `GET /api/student/interview-scorecards/{id}` | Student's report page (404 until published) |
| 12 | `GET /api/interviews/recordings?templateId=&interviewerId=&from=&to=&onlyWithRecording=` | Meeting links register |
| 13 | `GET /api/interviews/recordings/export` | "Full register" Excel download |
| 14 | `GET /api/templates/{id}/interview-scorecards/export` | "Export score cards" on a batch's Interviews tab |
| 15 | `POST /api/interviews/{id}/send-meeting-email` | Meeting email and calendar invite to the student and trainer. Tried first; on a 404 the frontend uses #16. |
| 16 | `POST /api/email/meeting-invite` | The same email, built from the interview's details (names, emails, link, start time, duration) |
| 17 | `POST /api/email/test` `{to}` | "Send test email" on the super admin Overview |

The trainer endpoint only returns the signed-in trainer's own interviews. When a super admin
ticks "Every trainer", the page reads each batch's interview list instead.

`ScorecardRequest.sections` keys: `basicCoding`, `mediumCoding`, `advancedCoding`,
`codeExecution1`, `codeExecution2`, `coreCodingConcepts`, `conversation`, `behavioural`,
`resumeScore`, `aptitude`, `logicalThinking`, `questionAsking`, `aiKnowledgeAndUsage`. Each one
is 0–10, or null when it wasn't assessed. `interest` is `POSITIVE` or `NEGATIVE`. The frontend
fills `areasToImprove` from the low-scoring sections when the trainer leaves it empty.

## Where it shows in the UI

- **Admin panel → Interviews** (the first tab for trainers): the trainer dashboard. Columns are
  interview no, the student's 1st or 2nd interview, student, interviewer, interview link,
  recording, score card, status (Upcoming / In progress / Done) and publish.
- **Admin panel → Meeting links** (super admin): S.No, student interview no, student name,
  trainer name and recorded meeting link, plus the join link, with filters and **Export to
  Excel**.
- **Batch → Interviews**: scheduling with a trainer picker, 1st or 2nd interview, and a Teams
  link that can be added later. Rows without a link are collected under **Fill missing links**.
  Each row also has links and score card buttons.
- **Student dashboard**: shows "View score card" once a score card is published. The report is at
  `/interview-report/{id}`, and the student can print it or save it as a PDF.

## Microsoft Teams setup (to get the keys)

Teams meetings are created in the browser with Microsoft Graph, as the signed-in Microsoft 365
user. There's no client secret, so nothing changes on the data service.

1. You need a Microsoft 365 **work or school** account with Teams. Personal Outlook or Hotmail
   accounts can't create meetings through Graph.
2. In the [Azure portal](https://portal.azure.com), go to **Microsoft Entra ID → App
   registrations → New registration**.
   - Name: `Anobyt Teams meetings`
   - Supported account types: **Accounts in this organizational directory only**
   - Redirect URI: platform **Single-page application (SPA)**, URI
     `https://anobyt.in/ms-auth.html`
3. Under **Authentication**, add more SPA redirect URIs:
   `http://localhost:5173/ms-auth.html` for local dev, and any Netlify preview URL you use.
4. Under **API permissions → Add → Microsoft Graph → Delegated**, add
   `OnlineMeetings.ReadWrite`. `openid`, `profile` and `offline_access` are usually there
   already. If your tenant blocks user consent, click **Grant admin consent**.
5. Don't create a client secret. It isn't needed and must never go in the frontend.
6. Copy the **Application (client) ID** and the **Directory (tenant) ID** from the Overview page.
   Set them as:
   - `VITE_MS_CLIENT_ID=<client id>`
   - `VITE_MS_TENANT_ID=<tenant id>`

   Add them in Netlify (Site settings → Environment variables) and in `.env.local` for
   `npm run dev`, then redeploy. The **Create Teams meeting** buttons appear once the client ID
   is set. Until then, the pages ask for the link to be pasted.

How it behaves:
- Whoever clicks **Create** (normally the super admin) signs in once per browser session in a
  popup and becomes the meeting organiser.
- Meetings are created with "everyone bypasses the lobby", so students and trainers join without
  being admitted.
- Recordings save to the organiser's OneDrive. Copy the recording's share link and paste it
  under the interview's **Links**. To fill this in automatically later, you'd also need the
  `OnlineMeetingRecording.Read.All` permission. Ask when you want it.
