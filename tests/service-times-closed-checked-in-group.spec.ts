import { APIRequestContext, expect, test } from "@playwright/test";
import { searchSmith, startKiosk } from "./helpers/kiosk";
import { apiLogin, deleteVisitsForPeople, directCheckin, DEMO } from "./helpers/api";

// Issue #1317: a person already checked in to a service time whose window has since closed sees that check-in, not just "Closed".
const BASE = "http://127.0.0.1:8084";
const JOHN = "PER00000001";
const ADULT_BIBLE_CLASS = "GRP00000004";

async function setClosed(request: APIRequestContext, jwt: string, closed: boolean) {
  const headers = { Authorization: "Bearer " + jwt };
  const times = await (await request.get(BASE + "/attendance/servicetimes?serviceId=" + DEMO.serviceId, { headers })).json();
  const updated = times.map((t: any) => {
    const { checkinOpen: _open, ...rest } = t;
    // Three days from today is never inside a one-hour window in any zone; the 10:30 time stays unscheduled (always open).
    return closed && t.id === DEMO.serviceTimeId
      ? { ...rest, dayOfWeek: (new Date().getDay() + 3) % 7, startTime: "09:00", endTime: "10:00", checkinOpenMinutes: 30, checkinCloseMinutes: 15 }
      : { ...rest, dayOfWeek: null, startTime: null, endTime: null, checkinOpenMinutes: null, checkinCloseMinutes: null };
  });
  const res = await request.post(BASE + "/attendance/servicetimes", { headers, data: updated });
  expect(res.ok()).toBeTruthy();
}

test.beforeAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [JOHN]);
  await setClosed(request, attendance, false);
  await directCheckin(request, attendance, { serviceId: DEMO.serviceId, personId: JOHN, serviceTimeId: DEMO.serviceTimeId, groupId: ADULT_BIBLE_CLASS });
  await setClosed(request, attendance, true);
});

test.afterAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await setClosed(request, attendance, false);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, [JOHN]);
});

test("a closed service time shows the group the person is already checked in to", async ({ page }) => {
  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText(/Closed · opens/)).toHaveCount(0);
  await expect(page.getByText("Adult Bible Class · Checked in")).toBeVisible();
});
