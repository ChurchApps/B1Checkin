import { expect, test } from "@playwright/test";
import { confirmDuplicateIfPresent, searchSmith, startKiosk } from "./helpers/kiosk";
import { apiLogin, deleteVisitsForPeople } from "./helpers/api";

// Keep John unassigned before + after (the demo DB is shared and not reset per run).
test.beforeAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, "SER00000001", ["PER00000001"]);
});

test.afterAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, "SER00000001", ["PER00000001"]);
});

// C-2: pick a check-in type chip and assert it persists as the visit's checkinType.
test("volunteer check-in type is submitted and persisted", async ({ page, request }) => {
  await startKiosk(page);
  await searchSmith(page);

  await page.getByRole("button", { name: /John Smith/ }).click();
  await expect(page.getByText("Who's checking in?")).toBeVisible({ timeout: 30000 });

  // Expand John, choose the Volunteer chip.
  await page.getByRole("button", { name: /John Smith/ }).click();
  await page.getByRole("button", { name: /Volunteer/ }).click();

  // Assign a room so there is a visit to type.
  await page.getByRole("button", { name: "Select Group" }).first().click();
  await expect(page.getByText("Select a Group")).toBeVisible();
  await page.getByRole("button", { name: /Children/ }).click();
  await page.getByRole("button", { name: /Preschool/ }).click();

  await expect(page.getByText("Who's checking in?")).toBeVisible();

  const checkinPost = page.waitForRequest(r => r.url().includes("/visits/checkin") && r.method() === "POST");
  await page.getByRole("button", { name: /Check In/ }).click();
  await confirmDuplicateIfPresent(page);

  const req = await checkinPost;
  expect(JSON.stringify(req.postDataJSON())).toContain("\"checkinType\":\"volunteer\"");

  await expect(page.getByText("You're all set!")).toBeVisible({ timeout: 30000 });

  // API readback: John's visit is stored with checkinType volunteer.
  const { attendance } = await apiLogin(request);
  const res = await request.get("http://127.0.0.1:8084/attendance/visits/checkin?serviceId=SER00000001&peopleIds=PER00000001&include=visitSessions", { headers: { Authorization: "Bearer " + attendance } });
  const visits = await res.json();
  expect(visits.some((v: any) => v.checkinType === "volunteer")).toBeTruthy();
});
