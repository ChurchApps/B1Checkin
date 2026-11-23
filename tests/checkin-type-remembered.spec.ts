import { expect, test } from "@playwright/test";
import { searchSmith, startKiosk } from "./helpers/kiosk";
import { apiLogin, deleteVisitsForPeople, directCheckin, DEMO } from "./helpers/api";

const john = "PER00000001";
const mary = "PER00000002";

// John's last visit to this service was as a Volunteer; Mary's was as a Guest.
test.beforeAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [john, mary]);
  await directCheckin(request, attendance, { serviceId: DEMO.serviceId, personId: john, serviceTimeId: DEMO.serviceTimeId, groupId: DEMO.preschool, checkinType: "volunteer" });
  await directCheckin(request, attendance, { serviceId: DEMO.serviceId, personId: mary, serviceTimeId: DEMO.serviceTimeId, groupId: DEMO.preschool, checkinType: "guest" });
});

test.afterAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [john, mary]);
});

test("the type chip starts on Volunteer after a volunteer visit, and Guest is not carried over", async ({ page }) => {
  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByRole("button", { name: /Volunteer/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: /Member/ })).not.toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: /Mary Smith/ }).click();
  await expect(page.getByRole("button", { name: /Member/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: /Guest/ })).not.toHaveAttribute("aria-selected", "true");
});
