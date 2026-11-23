import { expect, test } from "@playwright/test";
import { apiLogin, deleteVisitsForPeople, DEMO } from "./helpers/api";
import { confirmDuplicateIfPresent, searchSmith, startKiosk, WELCOME_TITLE } from "./helpers/kiosk";

// "Start on scanner" (Admin Settings, stored on the tablet): off by default; when on, the kiosk returns to the camera after each check-in.

const JOHN = "PER00000001";
const SCAN_SUBTITLE = "Hold the QR code from your phone up to the camera";

test.beforeEach(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [JOHN]);
});

test.afterEach(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [JOHN]);
});

test("start on scanner is off by default and returns to the camera after a check-in once on", async ({ page }) => {
  await startKiosk(page);
  await expect(page.getByText(SCAN_SUBTITLE)).toHaveCount(0);

  const logo = page.getByTestId("header-logo").last();
  for (let i = 0; i < 7; i++) await logo.click();
  await expect(page.getByText("Admin Settings")).toBeVisible({ timeout: 15000 });
  await page.getByText("Start on scanner").click();
  await page.getByRole("button", { name: "Back to Kiosk" }).click();
  await expect(page.getByText(WELCOME_TITLE).last()).toBeVisible({ timeout: 15000 });

  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: /John Smith/ }).click();
  await page.getByRole("button", { name: "Select Group" }).first().click();
  await page.getByRole("button", { name: /Children/ }).click();
  await page.getByRole("button", { name: /Preschool/ }).click();
  await page.getByRole("button", { name: /Check In/ }).click();
  await confirmDuplicateIfPresent(page);
  await expect(page.getByText("You're all set!")).toBeVisible({ timeout: 30000 });

  await expect(page.getByText(SCAN_SUBTITLE).last()).toBeVisible({ timeout: 30000 });

  // Back leaves the camera for the keypad without reopening it.
  await page.getByRole("button", { name: "back", exact: true }).last().click();
  await expect(page.getByText(WELCOME_TITLE).last()).toBeVisible({ timeout: 15000 });
});
