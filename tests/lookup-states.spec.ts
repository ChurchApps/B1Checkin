import { expect, test } from "@playwright/test";
import { startKiosk, tapDigits, WELCOME_TITLE } from "./helpers/kiosk";

test("lookup keypad shows a visible scan-code control", async ({ page }) => {
  await startKiosk(page);
  const scan = page.getByRole("button", { name: "Scan code" });
  await expect(scan).toBeVisible();
  await scan.click();
  await expect(page.getByText("Hold the QR code from your phone up to the camera")).toBeVisible();
});

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

test("guest QR sheet offers registering on the kiosk", async ({ page }) => {
  // Demo church has QR guest registration off; turn it on for this session only.
  await page.route("**/membership/settings/public/**", route => route.fulfill({ json: { enableQRGuestRegistration: "true" } }));
  await startKiosk(page);

  await page.getByText("Register as guest").click();
  await expect(page.getByText("Scan to register as a guest")).toBeVisible();
  await page.getByRole("button", { name: "Register here" }).click();

  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Done" }).click();
  // The form screen (and its WebView) must unmount so the next family starts clean.
  await expect(page.getByRole("button", { name: "Done" })).toHaveCount(0);
  await expect(page.getByText(WELCOME_TITLE).last()).toBeVisible({ timeout: 15000 });
});
