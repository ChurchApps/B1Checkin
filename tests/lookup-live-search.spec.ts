import { expect, test } from "@playwright/test";
import { startKiosk, tapDigits } from "./helpers/kiosk";

// The lookup screen searches as the person types (same 4-digit / 2-letter minimum); the Search button still works.

test("typing four digits lists matching families without pressing Search", async ({ page }) => {
  await startKiosk(page);
  const live = page.getByTestId("lookup-live-results");

  await tapDigits(page, "010");
  await page.waitForTimeout(800);
  await expect(live).toHaveCount(0);

  await tapDigits(page, "1");
  await expect(live.getByRole("button", { name: /John Smith/ })).toBeVisible({ timeout: 30000 });

  await live.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });
});

test("typing a last name lists matches as you type and Search still opens the full results", async ({ page }) => {
  await startKiosk(page);
  await page.getByRole("button", { name: "Search by name" }).click();
  const live = page.getByTestId("lookup-live-results");

  await page.getByPlaceholder("Enter last name").fill("S");
  await page.waitForTimeout(800);
  await expect(live).toHaveCount(0);

  await page.getByPlaceholder("Enter last name").fill("Smith");
  await expect(live.getByRole("button", { name: /John Smith/ })).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("button", { name: "Back to keypad" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("button", { name: /Mary Smith/ })).toBeVisible();
});

test("a live search with no matches says so", async ({ page }) => {
  await startKiosk(page);
  await tapDigits(page, "9989");
  await expect(page.getByTestId("lookup-live-results").getByText("No Matches Found")).toBeVisible({ timeout: 30000 });
});
