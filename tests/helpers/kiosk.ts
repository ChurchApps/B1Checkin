import { expect, Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@b1.church";
export const DEMO_PASSWORD = "password";
export const WELCOME_TITLE = "Welcome! Let's check you in.";

// Logs into the kiosk and lands on the lookup keypad. Each test runs the full
// station-setup journey because kiosk state lives in-memory per session.
export async function startKiosk(page: Page) {
  const events: string[] = [];
  page.on("console", m => {
    if (m.type() === "error") events.push("CONSOLE: " + m.text().slice(0, 300));
  });
  page.on("requestfailed", r => events.push("REQFAIL: " + r.url() + " -> " + (r.failure()?.errorText || "?")));
  page.on("response", r => {
    if (r.url().includes("/users/login")) events.push("LOGIN RESPONSE: " + r.status());
  });

  await page.goto("/");
  await page.getByPlaceholder("Email").fill(DEMO_EMAIL);
  await page.getByPlaceholder("Password").fill(DEMO_PASSWORD);

  // The local dev stack (cold Metro + dev Api) occasionally drops the login POST
  // on a stale keep-alive socket; Chrome never retries POSTs. Retry like a human
  // would — a genuine login regression still fails all three attempts.
  const loginButton = page.getByRole("button", { name: "Login" });
  const churchButton = page.getByRole("button", { name: /Grace Community Church/i });
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await loginButton.isVisible().catch(() => false)) await loginButton.click();
    try {
      await churchButton.click({ timeout: 15000 });
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError) {
    console.log("startKiosk diagnostics:\n  " + events.join("\n  "));
    throw lastError;
  }

  await page.getByRole("button", { name: /Sunday Morning Service/i }).click({ timeout: 30000 });
  await expect(page.getByText(WELCOME_TITLE)).toBeVisible({ timeout: 30000 });
}

export async function tapDigits(page: Page, digits: string) {
  for (const digit of digits) {
    await page.getByRole("button", { name: digit, exact: true }).click();
  }
}

// The duplicate-check-in sheet appears when the person already has a visit
// this week (e.g. on repeat runs without a demo reset). Confirm through it.
export async function confirmDuplicateIfPresent(page: Page) {
  const again = page.getByRole("button", { name: "Check In Again" });
  await again.waitFor({ state: "visible", timeout: 2500 }).then(() => again.click()).catch(() => {});
}
