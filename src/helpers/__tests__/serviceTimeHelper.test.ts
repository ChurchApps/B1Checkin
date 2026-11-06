import { ServiceTimeHelper } from "../ServiceTimeHelper";

describe("ServiceTimeHelper.getGroupSummary", () => {
  it("returns an empty string when there are no groups", () => {
    expect(ServiceTimeHelper.getGroupSummary({ id: "st1", name: "9:00 AM" })).toBe("");
    expect(ServiceTimeHelper.getGroupSummary({ id: "st1", name: "9:00 AM", groups: [] })).toBe("");
  });

  it("joins group names with commas", () => {
    const st = { id: "st1", name: "9:00 AM", groups: [{ id: "g1", name: "Sunday Worship" }, { id: "g2", name: "Youth Group" }] };
    expect(ServiceTimeHelper.getGroupSummary(st)).toBe("Sunday Worship, Youth Group");
  });

  it("drops blank and duplicate names and keeps order", () => {
    const st = {
      id: "st1",
      name: "9:00 AM",
      groups: [{ id: "g1", name: " Nursery " }, { id: "g2", name: "" }, { id: "g3", name: "Preschool" }, { id: "g4", name: "nursery" }, { id: "g5" }]
    };
    expect(ServiceTimeHelper.getGroupSummary(st)).toBe("Nursery, Preschool");
  });
});

describe("ServiceTimeHelper.isCheckinOpen", () => {
  // Sunday 9:30 service, 9:30-10:30, opens 30 min before, closes 15 min after.
  const st = { id: "st1", dayOfWeek: 0, startTime: "09:30", endTime: "10:30", checkinOpenMinutes: 30, checkinCloseMinutes: 15 };
  const at = (day: number, h: number, m: number) => new Date(2024, 0, 7 + day, h, m);

  it("is always open without a schedule", () => {
    expect(ServiceTimeHelper.isCheckinOpen({ id: "st1" }, at(3, 12, 0))).toBe(true);
  });

  it("opens and closes around the window", () => {
    expect(ServiceTimeHelper.isCheckinOpen(st, at(0, 8, 59))).toBe(false);
    expect(ServiceTimeHelper.isCheckinOpen(st, at(0, 9, 0))).toBe(true);
    expect(ServiceTimeHelper.isCheckinOpen(st, at(0, 10, 45))).toBe(true);
    expect(ServiceTimeHelper.isCheckinOpen(st, at(0, 10, 46))).toBe(false);
    expect(ServiceTimeHelper.isCheckinOpen(st, at(1, 9, 30))).toBe(false);
  });

  it("stays open until the end of that day when neither an end time nor close minutes is set", () => {
    // Issue #1461: Thursday 10:25 service with blank end time and blank close field.
    const startOnly = { id: "st3", dayOfWeek: 4, startTime: "10:25" };
    expect(ServiceTimeHelper.isCheckinOpen(startOnly, at(4, 10, 24))).toBe(false);
    expect(ServiceTimeHelper.isCheckinOpen(startOnly, at(4, 10, 27))).toBe(true);
    expect(ServiceTimeHelper.isCheckinOpen(startOnly, at(4, 23, 59))).toBe(true);
    expect(ServiceTimeHelper.isCheckinOpen(startOnly, at(5, 8, 0))).toBe(false);
  });

  it("handles a window spilling from Saturday into Sunday", () => {
    const early = { id: "st2", dayOfWeek: 0, startTime: "00:15", checkinOpenMinutes: 30 };
    expect(ServiceTimeHelper.isCheckinOpen(early, at(-1, 23, 50))).toBe(true);
  });
});

describe("ServiceTimeHelper.getOpensLabel", () => {
  const sunday = { id: "st1", dayOfWeek: 0, startTime: "09:30", checkinOpenMinutes: 30 };
  const wednesday = { id: "st2", dayOfWeek: 3, startTime: "19:00" };
  const monday = new Date(2024, 0, 8, 12, 0);

  it("subtracts the open lead time, rolling into the previous day", () => {
    expect(ServiceTimeHelper.getOpensLabel([sunday], "en-US", monday)).toBe("Sun 9:00 AM");
    expect(ServiceTimeHelper.getOpensLabel([{ id: "st3", dayOfWeek: 0, startTime: "00:15", checkinOpenMinutes: 30 }], "en-US", monday)).toBe("Sat 11:45 PM");
    expect(ServiceTimeHelper.getOpensLabel([{ id: "st4" }])).toBe("");
  });

  it("picks the soonest upcoming opening", () => {
    expect(ServiceTimeHelper.getOpensLabel([sunday, wednesday], "en-US", monday)).toBe("Wed 7:00 PM");
    expect(ServiceTimeHelper.getOpensLabel([sunday, wednesday], "en-US", new Date(2024, 0, 11, 12, 0))).toBe("Sun 9:00 AM");
  });
});

describe("ServiceTimeHelper.sortByTime", () => {
  const names = (times: { name?: string }[]) => times.map(t => t.name);

  it("orders times in the name by the clock, not as text", () => {
    const sorted = ServiceTimeHelper.sortByTime([{ id: "a", name: "10:30 AM Service" }, { id: "b", name: "9:00 AM Service" }, { id: "c", name: "6:00 PM" }, { id: "d", name: "12:15 PM" }]);
    expect(names(sorted)).toEqual(["9:00 AM Service", "10:30 AM Service", "12:15 PM", "6:00 PM"]);
  });

  it("uses the scheduled day and start time when set", () => {
    const sorted = ServiceTimeHelper.sortByTime([
      { id: "a", name: "Second", dayOfWeek: 0, startTime: "10:30" },
      { id: "b", name: "Saturday", dayOfWeek: 6, startTime: "08:00" },
      { id: "c", name: "First", dayOfWeek: 0, startTime: "09:00" }
    ]);
    expect(names(sorted)).toEqual(["First", "Second", "Saturday"]);
  });

  it("puts names without a time last, by name, and leaves the input alone", () => {
    const input = [{ id: "a", name: "Kids" }, { id: "b", name: "Adults" }, { id: "c", name: "9:00 AM" }];
    expect(names(ServiceTimeHelper.sortByTime(input))).toEqual(["9:00 AM", "Adults", "Kids"]);
    expect(names(input)).toEqual(["Kids", "Adults", "9:00 AM"]);
  });
});
