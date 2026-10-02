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
