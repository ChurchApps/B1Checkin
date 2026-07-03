import { expect, test } from "@playwright/test";
import { enableManned, startKiosk } from "./helpers/kiosk";
import { apiLogin, deleteVisitsForPeople, directCheckin, DEMO } from "./helpers/api";

const AJWT = (jwt: string) => ({ Authorization: "Bearer " + jwt });
const ATT = "http://127.0.0.1:8084/attendance";

// C-3 + C-4: trusted pickup card, not-authorized override, and page-a-parent (no provider).
let code = "";
let visitId = "";

test.beforeAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  const res = await directCheckin(request, attendance, { serviceId: DEMO.serviceId, personId: DEMO.michael, serviceTimeId: DEMO.serviceTimeId, groupId: DEMO.preschool });
  code = res.securityCode;
  const found = await (await request.get(ATT + "/visits/code/" + code, { headers: AJWT(attendance) })).json();
  visitId = found[0].id;
});

test.afterAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [DEMO.michael]);
});

test("checkout shows trusted people, pages a parent, and blocks a not-authorized pickup", async ({ page, request }) => {
  await startKiosk(page);
  await enableManned(page);
  await page.getByRole("button", { name: "Check Out" }).click();

  // Fill the code field directly — the on-screen digit keys collide with the kept-alive lookup keypad.
  await page.getByPlaceholder("____").fill(code);

  // Trusted person appears with a badge; the not-authorized person never renders as a card.
  await expect(page.getByText(/Grandma Edna/)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Trusted").first()).toBeVisible();
  await expect(page.getByText(/Rick Sanders/)).toHaveCount(0);

  // Page-a-parent surfaces a per-recipient result (or the friendly no-provider message
  // when texting is unconfigured — the demo's provider is present but non-functional).
  await page.getByRole("button", { name: "Page parent" }).click();
  await page.getByRole("button", { name: /Please come to/ }).click();
  await expect(page.getByText(/Sent to \d+ phone|No SMS provider configured/)).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "OK" }).click();

  // Not-authorized guard: typing the flagged name triggers a blocking override.
  await page.getByRole("button", { name: "Other" }).click();
  await page.getByPlaceholder("Enter name").fill("Rick Sanders");
  await page.getByRole("button", { name: "Check Out", exact: true }).click();

  await expect(page.getByText("Not authorized for pickup", { exact: true })).toBeVisible();
  await expect(page.getByText(/Rick Sanders is flagged as not authorized/)).toBeVisible();
  await page.getByRole("button", { name: "Override", exact: true }).click();

  // Override records the checkout with a greppable "OVERRIDE:" actor (API readback).
  const { attendance } = await apiLogin(request);
  await expect.poll(async () => {
    const v = await (await request.get(ATT + "/visits/" + visitId, { headers: AJWT(attendance) })).json();
    return v?.checkedOutBy || "";
  }, { timeout: 15000 }).toContain("OVERRIDE: Rick Sanders");
});
