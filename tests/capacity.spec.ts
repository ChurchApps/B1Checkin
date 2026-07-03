import { expect, test } from "@playwright/test";
import { searchSmith, startKiosk } from "./helpers/kiosk";
import { apiLogin, deleteVisitsForPeople, directCheckin, DEMO } from "./helpers/api";

// Per-room capacity: fill Elementary (K-2) (capacity 2) via the API, then the kiosk's
// next child into that room must be rejected with a named-room error.
test.beforeAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  for (const personId of DEMO.davisKids) {
    await directCheckin(request, attendance, { serviceId: DEMO.serviceId, personId, serviceTimeId: DEMO.serviceTimeId, groupId: DEMO.elementaryK2 });
  }
});

test.afterAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, DEMO.davisKids);
});

test("check-in into a full room is rejected with the room named", async ({ page }) => {
  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /James Smith/ }).click();
  await page.getByRole("button", { name: "Select Group" }).first().click();
  await expect(page.getByText("Select a Group")).toBeVisible();
  await page.getByRole("button", { name: /Children/ }).click();
  await page.getByRole("button", { name: /Elementary \(K-2\)/ }).click();

  await expect(page.getByText("Who's checking in?")).toBeVisible();
  await page.getByRole("button", { name: /Check In/ }).click();

  await expect(page.getByText("Can't check in yet")).toBeVisible({ timeout: 30000 });
  // The gate error row names the offending room + reason (unique to the error screen).
  await expect(page.getByText(/Elementary \(K-2\) — room is full/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Change Rooms" })).toBeVisible();
});
