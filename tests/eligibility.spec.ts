import { expect, test } from "@playwright/test";
import { searchSmith, startKiosk } from "./helpers/kiosk";
import { apiLogin, createPerson, deletePerson, DEMO } from "./helpers/api";

// C-1: rooms are highlighted/dimmed by age eligibility (never hidden; override always available).
// Demo has no under-2 child, so seed a baby in the Smith household for the "eligible" case.
let babyId = "";

test.beforeAll(async ({ request }) => {
  const { membership } = await apiLogin(request);
  babyId = await createPerson(request, membership, { first: "Baby", last: "Testkid", householdId: DEMO.householdId, birthDate: "2026-01-03" });
});

test.afterAll(async ({ request }) => {
  if (babyId) { const { membership } = await apiLogin(request); await deletePerson(request, membership, babyId); }
});

test("an under-2 child sees the Nursery highlighted as eligible", async ({ page }) => {
  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /Baby Testkid/ }).first().click();
  await page.getByRole("button", { name: "Select Group" }).first().click();
  await expect(page.getByText("Select a Group")).toBeVisible();
  await page.getByRole("button", { name: /Children/ }).click();

  await expect(page.getByText("Eligible").first()).toBeVisible();
});

test("a school-age child sees the Nursery dimmed and must confirm the override", async ({ page }) => {
  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /Michael Smith/ }).click();
  await page.getByRole("button", { name: "Select Group" }).first().click();
  await expect(page.getByText("Select a Group")).toBeVisible();
  await page.getByRole("button", { name: /Children/ }).click();

  await expect(page.getByText("Outside age range").first()).toBeVisible();

  await page.getByRole("button", { name: /Nursery/ }).click();
  await expect(page.getByText(/outside .* age range/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Check In Anyway" })).toBeVisible();
});
