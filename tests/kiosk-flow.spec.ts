import { expect, test } from "@playwright/test";
import { apiLogin, deleteVisitsForPeople, DEMO, directCheckin } from "./helpers/api";
import { confirmDuplicateIfPresent, startKiosk, tapDigits, WELCOME_TITLE } from "./helpers/kiosk";

test("family checks in via phone keypad search", async ({ page }) => {
  await startKiosk(page);

  await tapDigits(page, "0101");
  await expect(page.getByText("0101", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /John Smith/ }).click();
  await page.getByRole("button", { name: "Select Group" }).first().click();

  await expect(page.getByText("Select a Group")).toBeVisible();
  await page.getByRole("button", { name: /Children/ }).click();
  await page.getByRole("button", { name: /Preschool/ }).click();

  await expect(page.getByText("Who's checking in?")).toBeVisible();
  await expect(page.getByText(/Preschool/).first()).toBeVisible();

  await page.getByRole("button", { name: /Check In/ }).click();
  await confirmDuplicateIfPresent(page);

  await expect(page.getByText("You're all set!")).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(WELCOME_TITLE)).toBeVisible({ timeout: 15000 });
});

test("backspace and clear edit the typed number", async ({ page }) => {
  await startKiosk(page);

  await tapDigits(page, "0102");
  await expect(page.getByText("0102", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "backspace" }).click();
  await expect(page.getByText("010", { exact: true })).toBeVisible();

  await tapDigits(page, "23456789");
  await expect(page.getByText("(010) 234-5678", { exact: true })).toBeVisible();
});

test("household screen lists the groups offered at each service time", async ({ page }) => {
  await startKiosk(page);
  await tapDigits(page, "0101");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /Sarah Smith/ }).click();
  await expect(page.getByText("9:00 AM Service", { exact: true })).toBeVisible();

  // Only 9:00 AM offers the adult classes; both times offer the nursery.
  await expect(page.getByText(/Adult Bible Class/)).toHaveCount(1);
  await expect(page.getByText(/Nursery \(0-2\)/)).toHaveCount(2);
});

// Issue #1408: someone already checked in today is marked on the household screen and the kiosk asks before checking them in again.
test.describe("already checked in today", () => {
  const JOHN = "PER00000001";
  test.beforeEach(async ({ request }) => {
    const { attendance } = await apiLogin(request);
    await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [JOHN]);
    await directCheckin(request, attendance, { serviceId: DEMO.serviceId, personId: JOHN, serviceTimeId: DEMO.serviceTimeId, groupId: DEMO.preschool });
  });

  test.afterEach(async ({ request }) => {
    const { attendance } = await apiLogin(request);
    await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [JOHN]);
  });

  test("a person checked in today shows Already checked in and asks before checking in again", async ({ page }) => {
    await startKiosk(page);
    await tapDigits(page, "0101");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByRole("button", { name: /John Smith/ }).click();
    await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /John Smith/ }).getByText("Already checked in")).toBeVisible();

    await page.getByRole("button", { name: /Check In/ }).click();
    await expect(page.getByText("Already Checked In", { exact: true })).toBeVisible();
    await expect(page.getByText(/John Smith already checked in for this service/)).toBeVisible();
    await page.getByRole("button", { name: "Check In Again" }).click();
    await expect(page.getByText("You're all set!")).toBeVisible({ timeout: 30000 });
  });
});
