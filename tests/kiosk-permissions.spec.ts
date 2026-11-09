import { test, expect } from "@playwright/test";
import { DEMO_PASSWORD } from "./helpers/kiosk";

// ChurchAppsSupport#1426: counter@b1.church is in a role, but none of its permissions are Check-in or Attendance Edit.
test("a role holder without Check-in is turned away from the kiosk", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Email").fill("counter@b1.church");
  await page.getByPlaceholder("Password").fill(DEMO_PASSWORD);
  await page.getByText("Login", { exact: true }).click();

  await expect(page.getByText("No check-in access")).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Grace Community Church")).toHaveCount(0);
});
