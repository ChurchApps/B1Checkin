import { expect, test } from "@playwright/test";
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
