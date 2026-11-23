import { VisitHelper } from "../VisitHelper";

// Issue #1408: the "Already checked in" badge and sheet key off today's visit, not the (always removed) visit id.
describe("VisitHelper.isToday", () => {
  const now = new Date("2026-10-28T15:30:00Z");

  it("is true for a visit dated today", () => {
    expect(VisitHelper.isToday({ personId: "p1", visitDate: "2026-10-28T00:00:00.000Z" as any }, now)).toBe(true);
  });

  it("is true for a visit stamped with the Api's local midnight", () => {
    expect(VisitHelper.isToday({ personId: "p1", visitDate: "2026-10-28T05:00:00.000Z" as any }, now)).toBe(true);
  });

  it("is false for yesterday's or last week's visit", () => {
    expect(VisitHelper.isToday({ personId: "p1", visitDate: "2026-10-27T00:00:00.000Z" as any }, now)).toBe(false);
    expect(VisitHelper.isToday({ personId: "p1", visitDate: "2026-10-21T00:00:00.000Z" as any }, now)).toBe(false);
  });

  it("is false without a visit or a date", () => {
    expect(VisitHelper.isToday(null, now)).toBe(false);
    expect(VisitHelper.isToday({ personId: "p1" }, now)).toBe(false);
    expect(VisitHelper.isToday({ personId: "p1", visitDate: "not a date" as any }, now)).toBe(false);
  });
});

// Remembered type: Volunteer carries over from the last visit to this service; Guest never does.
describe("VisitHelper.getDefaultCheckinType", () => {
  const visits = [
    { personId: "vol", checkinType: "volunteer" as const },
    { personId: "guest", checkinType: "guest" as const },
    { personId: "mem", checkinType: "member" as const }
  ];

  it("starts on Volunteer when the last visit was Volunteer", () => {
    expect(VisitHelper.getDefaultCheckinType(visits, "vol")).toBe("volunteer");
  });

  it("does not carry Guest over and falls back to Member", () => {
    expect(VisitHelper.getDefaultCheckinType(visits, "guest")).toBe("member");
    expect(VisitHelper.getDefaultCheckinType(visits, "mem")).toBe("member");
    expect(VisitHelper.getDefaultCheckinType(visits, "nobody")).toBe("member");
    expect(VisitHelper.getDefaultCheckinType([], "vol")).toBe("member");
  });

  it("starts a just-added guest on Guest", () => {
    expect(VisitHelper.getDefaultCheckinType(visits, "vol", true)).toBe("guest");
  });
});

// Checked in by: the looked-up person when they are clearly an adult, else no one.
describe("VisitHelper.getCheckedInById", () => {
  const today = new Date(2026, 10, 23);

  it("records the adult whose phone or name found the household", () => {
    expect(VisitHelper.getCheckedInById({ id: "mom", householdRole: "Head" }, today)).toBe("mom");
    expect(VisitHelper.getCheckedInById({ id: "dad", householdRole: "Spouse", birthDate: "1985-04-02" as any }, today)).toBe("dad");
    expect(VisitHelper.getCheckedInById({ id: "gran", birthDate: "1950-01-01" as any }, today)).toBe("gran");
  });

  it("records no one when a child's name was searched", () => {
    expect(VisitHelper.getCheckedInById({ id: "kid", householdRole: "Child" }, today)).toBe("");
    expect(VisitHelper.getCheckedInById({ id: "kid", householdRole: "Child", birthDate: "1990-01-01" as any }, today)).toBe("");
    expect(VisitHelper.getCheckedInById({ id: "teen", householdRole: "Other", birthDate: "2010-06-01" as any }, today)).toBe("");
  });

  it("records no one when nothing shows the person is an adult", () => {
    expect(VisitHelper.getCheckedInById({ id: "p1" }, today)).toBe("");
    expect(VisitHelper.getCheckedInById({ id: "p1", householdRole: "Other" }, today)).toBe("");
    expect(VisitHelper.getCheckedInById({ id: "p1", householdRole: "Other", birthDate: "1960-01-01" as any }, today)).toBe("p1");
    expect(VisitHelper.getCheckedInById({ id: "p1", birthDate: "not a date" as any }, today)).toBe("");
    expect(VisitHelper.getCheckedInById(null, today)).toBe("");
    expect(VisitHelper.getCheckedInById({ householdRole: "Head" }, today)).toBe("");
  });

  it("turns 18 on the birthday", () => {
    expect(VisitHelper.getCheckedInById({ id: "p1", birthDate: new Date(2008, 10, 23) }, today)).toBe("p1");
    expect(VisitHelper.getCheckedInById({ id: "p1", birthDate: new Date(2008, 10, 24) }, today)).toBe("");
  });
});

describe("VisitHelper.stampCheckedInBy", () => {
  it("sets the adult on every visit and clears an old week's value when there is none", () => {
    const visits = [{ personId: "k1", checkedInById: "oldAdult" }, { personId: "k2" }];
    VisitHelper.stampCheckedInBy(visits, "mom");
    expect(visits.map(v => v.checkedInById)).toEqual(["mom", "mom"]);
    VisitHelper.stampCheckedInBy(visits, "");
    expect(visits.map(v => v.checkedInById)).toEqual([undefined, undefined]);
  });
});
