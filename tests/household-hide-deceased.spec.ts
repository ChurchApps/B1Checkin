import { expect, test } from "@playwright/test";
import { searchSmith, startKiosk } from "./helpers/kiosk";

// The kiosk household list never shows deceased members; inactive members stay (they may be returning).
test("household screen hides deceased members and keeps inactive ones", async ({ page }) => {
  await page.route("**/membership/people/household/**", async route => {
    const response = await route.fetch();
    const members = await response.json();
    const marked = members.map((m: any) => {
      if (m.name?.display === "Sarah Smith") return { ...m, membershipStatus: "Deceased" };
      if (m.name?.display === "Mary Smith") return { ...m, membershipStatus: "Inactive" };
      return m;
    });
    await route.fulfill({ response, json: marked });
  });

  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await expect(page.getByRole("button", { name: /John Smith/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mary Smith/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sarah Smith/ })).toHaveCount(0);
});
