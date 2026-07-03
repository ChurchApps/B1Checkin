import { expect, Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@b1.church";
export const DEMO_PASSWORD = "password";
export const WELCOME_TITLE = "Welcome! Let's check you in.";

// Each test runs the full station-setup journey because kiosk state lives in-memory per session.
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

  // Dev stack occasionally drops login POST on stale keep-alive; Chrome won't retry.
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

export async function confirmDuplicateIfPresent(page: Page) {
  const again = page.getByRole("button", { name: "Check In Again" });
  await again.waitFor({ state: "visible", timeout: 2500 }).then(() => again.click()).catch(() => {});
}

export async function enableManned(page: Page) {
  // Activity keep-alive keeps multiple headers mounted; tap the last logo (7-tap counter is per-instance).
  const logo = page.getByTestId("header-logo").last();
  for (let i = 0; i < 7; i++) await logo.click();
  await expect(page.getByText("Admin Settings")).toBeVisible({ timeout: 15000 });
  await page.getByText("Manned station mode").click();
  await page.getByRole("button", { name: "Back to Kiosk" }).click();
  await expect(page.getByRole("button", { name: "Check Out" })).toBeVisible({ timeout: 15000 });
}

export async function searchSmith(page: Page) {
  await tapDigits(page, "0101");
  await page.getByRole("button", { name: "Search", exact: true }).click();
}
