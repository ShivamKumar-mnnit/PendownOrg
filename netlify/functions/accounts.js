import { blobStore } from "../../src/lib/server/blobStore.js";
import { handleAccountsApi } from "../../src/lib/server/accountsApi.js";

// Student and college accounts, payments (Razorpay or manual UPI), premium
// feature prices and the student-records workspace. Shares the content store
// so course pages can see what a signed-in student has bought.
export default async function handler(request) {
  return handleAccountsApi(request, blobStore("anobyt-content"), {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  });
}

export const config = {
  path: ["/api/auth/*", "/api/pay/*", "/api/manage/*", "/api/workspace/*"],
};
