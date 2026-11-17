# Hosting on Cloudflare Pages

anobyt.in is served by Cloudflare Pages, which builds from the `master` branch on GitHub
(`npm run build`, output `dist`). These are the Cloudflare versions of the old Netlify pieces:

| What | Netlify (old) | Cloudflare (now) |
| --- | --- | --- |
| Website server code (`/api/*`) | `netlify/functions/*` | `functions/api/[[path]].js`, which runs the same handlers from `src/lib/server/` |
| Data-service proxy for previews (`/ds/*`) | `netlify/functions/ds.js` | `functions/ds/[[path]].js` |
| Stored data (accounts, purchases, content, tests, CodeVita progress) | Netlify Blobs | Cloudflare **D1** database (`functions/_lib/d1Store.js`, one `kv` table, created automatically) |
| CodeVita built-in bank (~8 MB, hidden test cases) | bundled into the function | Cloudflare **R2** file `codevita-bank.json` (too big to bundle on Cloudflare) |
| Redirects | `netlify.toml` | `public/_redirects` |
| Long caching for `/assets/*` | – | `public/_headers` |
| Bulk login emails from the website (`/api/mail/send`) | nodemailer function | Not ported. The admin screen sends through the data service's `/api/email/student-credentials` instead. |
| IndexNow ping after deploys | `deploy-succeeded.js` | Turn on Cloudflare **Crawler Hints** (dashboard → Caching → Configuration), which sends IndexNow automatically. |

The `netlify/` folder and `netlify.toml` are kept so the site can still run on Netlify if needed.

## One-time setup (Cloudflare dashboard)

1. **Create the database:** Storage & Databases → D1 → Create. Name it `anobyt`.
2. **Create the bucket:** R2 → Create bucket. Name it `anobyt-codevita-bank` and leave it private (no public access).
3. Open **Workers & Pages → the anobyt.in Pages project → Settings → Bindings**:
   - **D1 database:** variable name `DB`, database `anobyt`.
   - **R2 bucket:** variable name `CV_BANK`, bucket `anobyt-codevita-bank`.
4. **Settings → Variables and Secrets.** Add these for Production (and Preview if you use it), with the same values as Netlify had:
   - `ADMIN_PASSWORD`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `MIGRATION_KEY`: a long random value, only while migrating (next section). At least 24 characters, for example from `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.
   - The build-time variables the frontend reads, if you used them on Netlify: `VITE_MS_CLIENT_ID`, `VITE_MS_TENANT_ID`, `VITE_GOOGLE_CLIENT_ID`, `VITE_DATA_API_URL`, `VITE_DATA_API_KEY`.
5. Go to **Deployments → Retry deployment** (or push to `master`) so the bindings and variables take effect.
6. If Razorpay sends webhooks to the old Netlify URL, point them at `https://anobyt.in/api/pay/...`. It's the same path, now served by Cloudflare.

## Moving the existing data from Netlify (once)

The data is still in **Netlify Blobs**, in your Netlify account, as long as the Netlify site isn't deleted. On your PC, in this repo:

1. In Netlify:
   - Go to **Site configuration → Site details** and copy the **Site ID**.
   - Go to **User settings → Applications → Personal access tokens** and create a token.
2. Run this in Git Bash or another bash shell (use the same `MIGRATION_KEY` you set on Cloudflare):

   ```bash
   MIGRATION_KEY=... NETLIFY_SITE_ID=... NETLIFY_AUTH_TOKEN=... node scripts/cloudflare/migrate-from-netlify.mjs
   ```

   It copies every item from the `anobyt-content`, `anobyt-tests` and `anobyt-codevita` stores into D1, then uploads the CodeVita bank to R2. It's safe to run again; items are overwritten, not duplicated.
3. When it says "All done", **delete the `MIGRATION_KEY` secret** in Cloudflare and redeploy. Without it, the import endpoint is switched off.
4. Revoke the Netlify token.

## When the CodeVita bank files change

The bank in R2 doesn't update itself when `src/lib/codevita/bank/*` changes in the code. After such a change:
1. Set `MIGRATION_KEY` on Cloudflare again and redeploy.
2. Run:

   ```bash
   MIGRATION_KEY=... node scripts/cloudflare/migrate-from-netlify.mjs --bank-only
   ```

3. Delete `MIGRATION_KEY` again.

Problems edited in Admin → CodeVita are stored in D1 and don't need this.

## Testing locally on the Cloudflare runtime

```bash
npm run build
npx wrangler pages dev dist --d1 DB --r2 CV_BANK --binding ADMIN_PASSWORD=local
```

This uses a local D1 database and R2 bucket. To load the bank into the local R2 bucket, add
`--binding MIGRATION_KEY=<any 24+ characters>` and run the script with `TARGET=http://127.0.0.1:8788 ... --bank-only`.
