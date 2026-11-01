// Netlify runs this automatically after every successful deploy (the file name is the trigger).
// For production deploys it tells IndexNow (Bing, which ChatGPT search and Copilot use, plus
// Yandex and others) that every page in the sitemap may have changed, so they recrawl soon
// instead of waiting. Google doesn't use IndexNow; it reads the sitemap in Search Console.
//
// The key is public by design: IndexNow checks that https://anobyt.in/<key>.txt contains it,
// which proves this site sent the ping.

const SITE = "https://anobyt.in";
const KEY = "232828a53c78e158e0763575ad34a127";

export const handler = async (event) => {
  let deploy = {};
  try {
    deploy = JSON.parse(event.body || "{}").payload || {};
  } catch {
    /* no payload: treat as production below */
  }
  if (deploy.context && deploy.context !== "production") return { statusCode: 200, body: `Skipped (${deploy.context} deploy)` };

  try {
    const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
    const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 10000);
    if (!urlList.length) return { statusCode: 200, body: "Sitemap had no URLs" };
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: "anobyt.in", key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
    });
    console.log(`IndexNow: ${urlList.length} URLs, HTTP ${res.status}`);
    return { statusCode: 200, body: `IndexNow ${res.status} for ${urlList.length} URLs` };
  } catch (e) {
    // Never fail the deploy over this.
    console.log(`IndexNow ping failed: ${e.message}`);
    return { statusCode: 200, body: "IndexNow ping failed" };
  }
};
