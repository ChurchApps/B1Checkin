import { expect, test } from "@playwright/test";
import { enableManned, startKiosk } from "./helpers/kiosk";
import { apiLogin, deleteVisitsForPeople, directCheckin, DEMO } from "./helpers/api";

const AJWT = (jwt: string) => ({ Authorization: "Bearer " + jwt });
const ATT = "http://127.0.0.1:8084/attendance";
const [olivia, noah] = DEMO.davisKids;

// Check out without a printed code: staff find the family by last name, then the usual pickup step runs.
test.beforeAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, DEMO.davisKids);
  await directCheckin(request, attendance, { serviceId: DEMO.serviceId, personId: olivia, serviceTimeId: DEMO.serviceTimeId, groupId: DEMO.elementaryK2 });
});

test.afterAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, DEMO.davisKids);
});

async function openNameSearch(page: import("@playwright/test").Page) {
  await startKiosk(page);
  await enableManned(page);
  await page.getByRole("button", { name: "Check Out" }).click();
  await expect(page.getByPlaceholder("____")).toBeVisible();
  await page.getByTestId("checkout-search-button").click();
}

test("checkout by last name finds the family's active check-ins and records the pickup", async ({ page, request }) => {
  await openNameSearch(page);
  await page.getByPlaceholder("Enter last name").last().fill("Davis");
  await page.getByTestId("checkout-name-search").click();
  await page.getByText("Michael Davis", { exact: true }).last().click();

  // Only the child still checked in today is listed; parents are offered as pickup people.
  await expect(page.getByText("Who is picking up?")).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Olivia Davis", { exact: true })).toBeVisible();
  await expect(page.getByText("Noah Davis", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Emily Davis" }).click();
  await expect(page.getByText("Checked out successfully")).toBeVisible();

  const { attendance } = await apiLogin(request);
  const active = await (await request.get(ATT + "/visits/active?peopleIds=" + olivia + "," + noah, { headers: AJWT(attendance) })).json();
  expect(active).toEqual([]);
  const visits = await (await request.get(ATT + "/visits?personId=" + olivia, { headers: AJWT(attendance) })).json();
  const today = new Date().toLocaleDateString("en-CA");
  const todays = visits.find((v: any) => String(v.visitDate).slice(0, 10) === today);
  expect(todays?.checkedOutBy).toBe("Emily Davis");
});

test("checkout by name explains when no one in the household is checked in", async ({ page }) => {
  await openNameSearch(page);
  await page.getByPlaceholder("Enter last name").last().fill("Miller");
  await page.getByTestId("checkout-name-search").click();
  await page.getByText("Richard Miller", { exact: true }).last().click();
  await expect(page.getByText("No one in this household is checked in right now.")).toBeVisible({ timeout: 30000 });

  await page.getByTestId("checkout-back-to-code").click();
  await expect(page.getByPlaceholder("____").last()).toBeVisible();
});
