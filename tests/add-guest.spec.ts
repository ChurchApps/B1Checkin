import { expect, test } from "@playwright/test";
import { searchSmith, startKiosk } from "./helpers/kiosk";
import { apiLogin, deletePerson } from "./helpers/api";

// ChurchAppsSupport#1554: a volunteer adding a guest to a household can record the guest's email.

const BASE = "http://127.0.0.1:8084";
const FIRST = "Zebulun";
const LAST = "Guestemail";

async function findGuests(request: any, jwt: string): Promise<any[]> {
  const res = await request.get(BASE + "/membership/people/search?term=" + encodeURIComponent(FIRST + " " + LAST), { headers: { Authorization: "Bearer " + jwt } });
  return (await res.json()) || [];
}

test.beforeEach(async ({ request }) => {
  const { membership } = await apiLogin(request);
  for (const p of await findGuests(request, membership)) await deletePerson(request, membership, p.id);
});

test.afterEach(async ({ request }) => {
  const { membership } = await apiLogin(request);
  for (const p of await findGuests(request, membership)) await deletePerson(request, membership, p.id);
});

test("Add Guest saves the guest's email", async ({ page, request }) => {
  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Add a Guest" }).click();

  await page.getByPlaceholder("Enter first name").fill(FIRST);
  await page.getByPlaceholder("Enter last name").fill(LAST);
  await page.getByPlaceholder("Enter email (optional)").fill("zebulun.guest@example.com");
  await page.screenshot({ path: test.info().outputPath("after.png") });
  await page.getByRole("button", { name: "Add Guest", exact: true }).click();
  // The kiosk keeps earlier screens mounted, so look for the guest's row rather than the heading.
  await expect(page.getByRole("button", { name: new RegExp(FIRST + " " + LAST) }).first()).toBeVisible({ timeout: 30000 });

  const { membership } = await apiLogin(request);
  const [guest] = await findGuests(request, membership);
  expect(guest).toBeTruthy();
  const full = await (await request.get(BASE + "/membership/people/" + guest.id, { headers: { Authorization: "Bearer " + membership } })).json();
  expect(full.contactInfo.email).toBe("zebulun.guest@example.com");
});
