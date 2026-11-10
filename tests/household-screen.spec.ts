import { expect, test } from "@playwright/test";
import { searchSmith, startKiosk, WELCOME_TITLE } from "./helpers/kiosk";
import { apiLogin, deleteVisitsForPeople, DEMO } from "./helpers/api";

// Issue #1350: service times list in clock order, and "You're all set!" stays up long enough to read without a printer.

const JOHN = "PER00000001";

test.beforeEach(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [JOHN]);
});

test("household screen lists service times earliest first", async ({ page }) => {
  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /Sarah Smith/ }).click();
  const times = page.getByText(/^\d{1,2}:\d{2} AM Service$/);
  await expect(times).toHaveCount(2);
  await expect(times).toHaveText(["9:00 AM Service", "10:30 AM Service"]);
});

test("success screen stays up without a printer even when tapped right away", async ({ page }) => {
  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /John Smith/ }).click();
  await page.getByRole("button", { name: "Select Group" }).first().click();
  await page.getByRole("button", { name: /Children/ }).click();
  await page.getByRole("button", { name: /Preschool/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible();

  // beforeEach cleared John's visits, so no duplicate prompt: the success screen follows the tap.
  await page.getByRole("button", { name: /Check In/ }).click();

  const allSet = page.getByText("You're all set!");
  await expect(allSet).toBeVisible({ timeout: 30000 });
  const shownAt = Date.now();
  await expect(page.getByText(/Returning to start/i)).toBeVisible();
  await allSet.click();

  await expect(allSet).toBeHidden({ timeout: 15000 });
  await expect(page.getByText(WELCOME_TITLE)).toBeVisible();
  expect(Date.now() - shownAt).toBeGreaterThanOrEqual(5000);
});
