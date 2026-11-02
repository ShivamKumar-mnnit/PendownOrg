import { useEffect } from "react";

export const SITE_URL = "https://anobyt.in";
export const SITE_NAME = "Anobyt";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

function setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Sets per-page title, meta description, canonical URL, and Open Graph/
 * Twitter tags. The SPA has no server-side rendering, so this only helps
 * crawlers that execute JS (Google does) and gives each route a distinct,
 * correct browser tab title — it does not fix the "empty HTML until JS
 * runs" limitation for crawlers/link-preview bots that don't run JS.
 * @param {{ title: string, description: string, path?: string, noindex?: boolean }} opts
 */
export function usePageSEO({ title, description: rawDescription, path = "/", noindex = false }) {
  useEffect(() => {
    // Same limits as scripts/prerender.mjs: titles up to 60 characters, descriptions up to 155.
    const withName = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const fullTitle = withName.length <= 60 ? withName : title.length <= 60 ? title : clip(title, 60);
    const description = clip(rawDescription || "", 155);
    const url = `${SITE_URL}${path}`;

    document.title = fullTitle;
    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setLink("canonical", url);

    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", OG_IMAGE);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE_NAME);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", OG_IMAGE);
  }, [title, rawDescription, path, noindex]);
}

/** Shortens to at most `n` characters at a word boundary, ending with an ellipsis. */
function clip(s, n) {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).replace(/\s+\S*$/, "")}…`;
}
