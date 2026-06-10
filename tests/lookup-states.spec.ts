import { expect, test } from "@playwright/test";
import { startKiosk, tapDigits, WELCOME_TITLE } from "./helpers/kiosk";

test("no-match search offers recovery actions", async ({ page }) => {
  await startKiosk(page);

  await tapDigits(page, "9989");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page.getByText("No Matches Found")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText(WELCOME_TITLE)).toBeVisible();
});

test("name search finds the demo family", async ({ page }) => {
  await startKiosk(page);

  await page.getByRole("button", { name: "Search by name" }).click();
  await page.getByPlaceholder("Enter last name").fill("Smith");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page.getByRole("button", { name: /John Smith/ })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("button", { name: /Mary Smith/ })).toBeVisible();

  await page.getByRole("button", { name: "Back to keypad" }).click();
  await expect(page.getByText(WELCOME_TITLE)).toBeVisible();
});
