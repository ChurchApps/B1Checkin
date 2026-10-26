import crypto from "crypto";
import { test, expect, request, type APIRequestContext } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
// Seeded only for 2FA specs, so the demo login other specs use never meets a code prompt.
const EMAIL = "twofactor@b1.church";

const totp = (secret: string, offsetSteps = 0) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = secret.split("").map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offsetSteps));
  const hmac = crypto.createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  return ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
};

const login = async (ctx: APIRequestContext, email: string) => (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email, password: "password" } })).json();

// Demo is a server admin, so it can clear the test account's 2FA whatever state a failed run left it in.
const resetTwoFactor = async (ctx: APIRequestContext) => {
  const demo = await login(ctx, "demo@b1.church");
  const adminChurch = demo.userChurches.find((uc: any) => uc.apis?.some((a: any) => a.permissions?.some((p: any) => p.contentType === "Server"))) || demo.userChurches[0];
  const headers = { Authorization: "Bearer " + adminChurch.jwt };
  const target = await (await ctx.get(`${API_BASE}/membership/users/search?term=${encodeURIComponent(EMAIL)}`, { headers })).json();
  const reset = await ctx.post(`${API_BASE}/membership/users/mfa/reset/${target[0].id}`, { headers });
  expect(reset.ok()).toBeTruthy();
};

test.describe("Two-factor sign-in", () => {
  let secret = "";

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    await resetTwoFactor(ctx);
    const headers = { Authorization: "Bearer " + (await login(ctx, EMAIL)).userChurches[0].jwt };
    secret = (await (await ctx.post(`${API_BASE}/membership/users/mfa/setup`, { headers })).json()).secret;
    await ctx.post(`${API_BASE}/membership/users/mfa/enable`, { headers, data: { code: totp(secret) } });
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await request.newContext();
    await resetTwoFactor(ctx);
    await ctx.dispose();
  });

  test("a staff login with 2FA asks for a code before choosing a church", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Email").fill(EMAIL);
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: "Login" }).click();

    const code = page.getByPlaceholder("Code or backup code");
    await expect(code).toBeVisible({ timeout: 15000 });
    await code.fill("000000");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("That code didn't work")).toBeVisible();

    // Setup spent the current time step; the next one is still inside the drift window.
    await code.fill(totp(secret, 1));
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByRole("button", { name: /Grace Community Church/i })).toBeVisible({ timeout: 15000 });
  });
});
