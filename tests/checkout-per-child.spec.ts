import { expect, test } from "@playwright/test";
import { enableManned, startKiosk } from "./helpers/kiosk";
import { apiLogin, deleteVisitsForPeople, DEMO } from "./helpers/api";

const AJWT = (jwt: string) => ({ Authorization: "Bearer " + jwt });
const ATT = "http://127.0.0.1:8084/attendance";
const [olivia, noah] = DEMO.davisKids;
let code = "";

// Both Davis kids are checked in together so they share one pickup code.
test.beforeAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, DEMO.davisKids);
  const visits = DEMO.davisKids.map(personId => ({ personId, serviceId: DEMO.serviceId, visitSessions: [{ session: { serviceTimeId: DEMO.serviceTimeId, groupId: DEMO.elementaryK2 } }] }));
  const url = ATT + "/visits/checkin?serviceId=" + DEMO.serviceId + "&peopleIds=" + DEMO.davisKids.join(",") + "&acknowledgeWarnings=true";
  const res = await request.post(url, { headers: AJWT(attendance), data: visits });
  expect(res.ok()).toBeTruthy();
  code = (await res.json()).securityCode;
});

test.afterAll(async ({ request }) => {
  const { attendance } = await apiLogin(request);
  await deleteVisitsForPeople(request, attendance, DEMO.serviceId, DEMO.davisKids);
});

test("manned check-out lists each child checked and sends only the checked visits", async ({ page, request }) => {
  await startKiosk(page);
  await enableManned(page);
  await page.getByRole("button", { name: "Check Out" }).click();
  await page.getByPlaceholder("____").fill(code);

  const oliviaBox = page.getByRole("checkbox", { name: "Olivia Davis" });
  const noahBox = page.getByRole("checkbox", { name: "Noah Davis" });
  await expect(oliviaBox).toBeChecked({ timeout: 30000 });
  await expect(noahBox).toBeChecked();

  // With nobody checked, pickup is blocked until a child is picked again.
  await oliviaBox.click();
  await noahBox.click();
  await expect(page.getByText("Select at least one child to check out.")).toBeVisible();
  await oliviaBox.click();
  await expect(oliviaBox).toBeChecked();
  await expect(noahBox).not.toBeChecked();

  const post = page.waitForRequest(r => r.url().includes("/visits/checkout") && r.method() === "POST");
  await page.getByRole("button", { name: "Emily Davis" }).click();
  expect((await post).postDataJSON().visitIds).toHaveLength(1);
  await expect(page.getByText("Checked out successfully")).toBeVisible();

  // Noah stays checked in; only Olivia is checked out.
  const { attendance } = await apiLogin(request);
  const active = await (await request.get(ATT + "/visits/active?peopleIds=" + olivia + "," + noah, { headers: AJWT(attendance) })).json();
  expect(active.map((v: any) => v.personId)).toEqual([noah]);
});
