import { APIRequestContext, expect } from "@playwright/test";

const BASE = "http://127.0.0.1:8084";
const auth = (jwt: string) => ({ Authorization: "Bearer " + jwt });

export interface Jwts { membership: string; attendance: string; }

export async function apiLogin(request: APIRequestContext): Promise<Jwts> {
  const res = await request.post(BASE + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const church = body.userChurches[0];
  const jwt = (k: string) => church.apis.find((a: any) => a.keyName === k).jwt;
  return { membership: jwt("MembershipApi"), attendance: jwt("AttendanceApi") };
}

export async function createPerson(request: APIRequestContext, jwt: string, opts: { first: string; last: string; householdId: string; birthDate?: string }): Promise<string> {
  const person: any = { householdId: opts.householdId, name: { display: opts.first + " " + opts.last, first: opts.first, last: opts.last }, contactInfo: {} };
  if (opts.birthDate) person.birthDate = opts.birthDate;
  const res = await request.post(BASE + "/membership/people", { headers: auth(jwt), data: [person] });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return data[0].id;
}

export async function deletePerson(request: APIRequestContext, jwt: string, id: string) {
  await request.delete(BASE + "/membership/people/" + id, { headers: auth(jwt) }).catch(() => {});
}

export async function directCheckin(request: APIRequestContext, jwt: string, opts: { serviceId: string; personId: string; serviceTimeId: string; groupId: string; checkinType?: string }): Promise<{ securityCode: string }> {
  const visit: any = { personId: opts.personId, serviceId: opts.serviceId, visitSessions: [{ session: { serviceTimeId: opts.serviceTimeId, groupId: opts.groupId } }] };
  if (opts.checkinType) visit.checkinType = opts.checkinType;
  // acknowledgeWarnings bypasses the soft warning but capacity is a hard gate.
  const url = BASE + "/attendance/visits/checkin?serviceId=" + opts.serviceId + "&peopleIds=" + opts.personId + "&acknowledgeWarnings=true";
  const res = await request.post(url, { headers: auth(jwt), data: [visit] });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

// Uses /visits?personId (not /visits/checkin) to avoid date-copy id mangling.
export async function deleteVisitsForPeople(request: APIRequestContext, jwt: string, _serviceId: string, personIds: string[]) {
  const today = new Date().toISOString().slice(0, 10);
  for (const personId of personIds) {
    const visits = await (await request.get(BASE + "/attendance/visits?personId=" + personId, { headers: auth(jwt) })).json();
    for (const v of Array.isArray(visits) ? visits : []) {
      if (v.id && String(v.visitDate).slice(0, 10) === today) {
        await request.delete(BASE + "/attendance/visits/" + v.id, { headers: auth(jwt) }).catch(() => {});
      }
    }
  }
}

export const DEMO = {
  householdId: "HOU00000001",
  serviceId: "SER00000001",
  serviceTimeId: "SST00000001",
  nursery: "GRP00000007",
  elementaryK2: "GRP00000009",
  preschool: "GRP00000008",
  davisKids: ["PER00000029", "PER00000030"],
  michael: "PER00000005"
};
