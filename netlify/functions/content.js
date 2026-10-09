import { blobStore } from "../../src/lib/server/blobStore.js";
import { handleContentApi } from "../../src/lib/server/contentApi.js";

// Site content (courses, events, FAQs, settings), the admin inbox, event
// registrations and premium access codes, stored in Netlify Blobs.
export default async function handler(request) {
  return handleContentApi(request, blobStore("anobyt-content"), { ADMIN_PASSWORD: process.env.ADMIN_PASSWORD });
}

export const config = {
  path: ["/api/content/*", "/api/events/*", "/api/leads", "/api/leads/*", "/api/codes", "/api/codes/*", "/api/premium/*"],
};
