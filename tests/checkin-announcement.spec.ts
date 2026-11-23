import { APIRequestContext, expect, test } from "@playwright/test";
import { searchSmith, startKiosk } from "./helpers/kiosk";
import { apiLogin } from "./helpers/api";

// The church-wide check-in announcement (Mobile > B1 CheckIn in B1Admin) shows with OK before the household screen.

const BASE = "http://127.0.0.1:8084";
const KEY = "checkinAnnouncement";
// Markup must show as literal text on the kiosk.
const MESSAGE = "Children's wing doors close at 10:15. <b>Thank you!</b>";

type SettingRow = { id?: string; keyName: string; value: string; public?: number };
let original: SettingRow | undefined;

async function settings(request: APIRequestContext, jwt: string): Promise<SettingRow[]> {
  return (await request.get(BASE + "/membership/settings", { headers: { Authorization: "Bearer " + jwt } })).json();
}

async function saveAnnouncement(request: APIRequestContext, jwt: string, value: string) {
  const row = (await settings(request, jwt)).find(s => s.keyName === KEY) || { keyName: KEY, value: "", public: 0 };
  const res = await request.post(BASE + "/membership/settings", { headers: { Authorization: "Bearer " + jwt }, data: [{ ...row, value }] });
  expect(res.ok()).toBeTruthy();
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  const { membership } = await apiLogin(request);
  original = (await settings(request, membership)).find(s => s.keyName === KEY);
});

test.afterAll(async ({ request }) => {
  const { membership } = await apiLogin(request);
  await saveAnnouncement(request, membership, original?.value ?? "");
});

test("shows the announcement as plain text before the household screen, once per household", async ({ page, request }) => {
  const { membership } = await apiLogin(request);
  await saveAnnouncement(request, membership, MESSAGE);

  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();

  const text = page.getByTestId("checkin-announcement-text");
  await expect(text).toBeVisible({ timeout: 30000 });
  await expect(text).toHaveText(MESSAGE);
  await expect(page.locator("[data-testid='checkin-announcement'] b")).toHaveCount(0);

  await page.getByTestId("checkin-announcement-ok").click();
  await expect(text).toBeHidden();
  await expect(page.getByText("Who's checking in?")).toBeVisible();

  // Picking a group and coming back to the household screen doesn't ask again.
  await page.getByRole("button", { name: /John Smith/ }).click();
  await page.getByRole("button", { name: "Select Group" }).first().click();
  await page.getByRole("button", { name: /Children/ }).click();
  await page.getByRole("button", { name: /Preschool/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible();
  await expect(text).toBeHidden();
});

test("goes straight to the household screen when the announcement is blank", async ({ page, request }) => {
  const { membership } = await apiLogin(request);
  await saveAnnouncement(request, membership, "");

  await startKiosk(page);
  await searchSmith(page);
  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId("checkin-announcement-text")).toHaveCount(0);
});
