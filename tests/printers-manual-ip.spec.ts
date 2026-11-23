import { expect, test } from "@playwright/test";

// Web has no printer hardware, so the scan always finds nothing: the case the IP entry is for.
test("a printer can be entered by IP address and model when the scan finds nothing", async ({ page }) => {
  await page.goto("/printers");
  await expect(page.getByText("No printers found on this network")).toBeVisible({ timeout: 60000 });

  await page.getByTestId("printer-enter-ip").click();
  await expect(page.getByText("Printer model")).toBeVisible();

  const confirm = page.getByTestId("printer-ip-confirm");
  await page.getByTestId("printer-ip-input").fill("192.168.1.999");
  await expect(confirm).toBeDisabled();
  await page.getByTestId("printer-ip-input").fill("192.168.1.50");
  await page.getByRole("button", { name: "Brother QL-820NWB" }).click();
  await confirm.click();

  // The entered printer joins the list, selected, and Test Print saves it for the kiosk.
  await expect(page.getByText("192.168.1.50")).toBeVisible();
  await page.getByRole("button", { name: "Test Print" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem("@Printer") || "{}")))
    .toEqual({ brand: "Brother", model: "Brother QL-820NWB", ipAddress: "192.168.1.50" });
});
