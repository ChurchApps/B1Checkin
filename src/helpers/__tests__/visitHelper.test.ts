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
