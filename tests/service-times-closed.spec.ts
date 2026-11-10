import { APIRequestContext, expect, test } from "@playwright/test";
import { searchSmith, startKiosk, DEMO_EMAIL, DEMO_PASSWORD } from "./helpers/kiosk";
import { apiLogin, DEMO } from "./helpers/api";

// Issue #1300: a scheduled check-in window that is closed must say so, not "room is full".
const BASE = "http://127.0.0.1:8084";

async function setSchedule(request: APIRequestContext, jwt: string, dayOfWeek: number | null) {
  const headers = { Authorization: "Bearer " + jwt };
  const times = await (await request.get(BASE + "/attendance/servicetimes?serviceId=" + DEMO.serviceId, { headers })).json();
  const updated = times.map((t: any) => {
    const { checkinOpen: _open, ...rest } = t;
    return dayOfWeek === null
      ? { ...rest, dayOfWeek: null, startTime: null, endTime: null, checkinOpenMinutes: null, checkinCloseMinutes: null }
      : { ...rest, dayOfWeek, startTime: "09:00", endTime: "10:00", checkinOpenMinutes: 30, checkinCloseMinutes: 15 };
  });
  const res = await request.post(BASE + "/attendance/servicetimes", { headers, data: updated });
  expect(res.ok()).toBeTruthy();
}

test.describe("closed service times", () => {
  test.beforeAll(async ({ request }) => {
    const { attendance } = await apiLogin(request);
    // Three days from today is never inside a one-hour window in any zone.
    await setSchedule(request, attendance, (new Date().getDay() + 3) % 7);
  });

  test.afterAll(async ({ request }) => {
    const { attendance } = await apiLogin(request);
    await setSchedule(request, attendance, null);
  });

  test("a service whose check-in window is closed says when check-in opens", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Email").fill(DEMO_EMAIL);
    await page.getByPlaceholder("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await page.getByRole("button", { name: /Grace Community Church/i }).click({ timeout: 30000 });
    await page.getByRole("button", { name: /Sunday Morning Service/i }).click({ timeout: 30000 });
    await expect(page.getByText(/Check-in for this service opens \w{3} 8:30\sAM\./)).toBeVisible({ timeout: 30000 });
  });
});

test("a notOpen rejection says check-in isn't open instead of room is full", async ({ page }) => {
  await page.route("**/attendance/visits/checkin**", route => {
    if (route.request().method() !== "POST") return route.continue();
    return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: "notOpen", groups: [{ groupId: DEMO.elementaryK2, groupName: "Elementary (K-2)", reason: "notOpen" }] }) });
  });
  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /James Smith/ }).click();
  await page.getByRole("button", { name: "Select Group" }).first().click();
  await expect(page.getByText("Select a Group")).toBeVisible();
  await page.getByRole("button", { name: /Children/ }).click();
  await page.getByRole("button", { name: /Elementary \(K-2\)/ }).click();

  await expect(page.getByText("Who's checking in?")).toBeVisible();
  await page.getByRole("button", { name: /Check In/ }).click();

  await expect(page.getByText("Can't check in yet")).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("Elementary (K-2) — check-in isn't open right now")).toBeVisible();
});
