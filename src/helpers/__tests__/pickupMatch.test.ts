import { PickupMatchHelper } from "../PickupMatchHelper";
import { HouseholdPickupInterface } from "../Interfaces";

const people: HouseholdPickupInterface[] = [
  { id: "1", name: "Grandma Edna", relationship: "Grandmother", status: "trusted" },
  { id: "2", name: "Rick Sanders", status: "notAuthorized" }
];

describe("PickupMatchHelper.isMatch", () => {
  it("matches exact and case-insensitive", () => {
    expect(PickupMatchHelper.isMatch("Rick Sanders", "Rick Sanders")).toBe(true);
    expect(PickupMatchHelper.isMatch("rick sanders", "Rick Sanders")).toBe(true);
    expect(PickupMatchHelper.isMatch("RICK SANDERS", "Rick Sanders")).toBe(true);
  });

  it("matches punctuation/spacing noise and reordered tokens", () => {
    expect(PickupMatchHelper.isMatch("Sanders, Rick", "Rick Sanders")).toBe(true);
    expect(PickupMatchHelper.isMatch("Rick  Sanders", "Rick Sanders")).toBe(true);
  });

  it("matches minor typos and partial names", () => {
    expect(PickupMatchHelper.isMatch("Rick Sander", "Rick Sanders")).toBe(true);
    expect(PickupMatchHelper.isMatch("Rik Sanders", "Rick Sanders")).toBe(true);
  });

  it("does not match unrelated names or too-short input", () => {
    expect(PickupMatchHelper.isMatch("Grandma Edna", "Rick Sanders")).toBe(false);
    expect(PickupMatchHelper.isMatch("John Smith", "Rick Sanders")).toBe(false);
    expect(PickupMatchHelper.isMatch("R", "Rick Sanders")).toBe(false);
  });
});

describe("PickupMatchHelper.findNotAuthorized", () => {
  it("flags a not-authorized match", () => {
    const hit = PickupMatchHelper.findNotAuthorized("Rick Sanders", people);
    expect(hit?.id).toBe("2");
  });

  it("ignores trusted entries even on an exact name match", () => {
    expect(PickupMatchHelper.findNotAuthorized("Grandma Edna", people)).toBeNull();
  });

  it("returns null when nothing matches or list empty", () => {
    expect(PickupMatchHelper.findNotAuthorized("Mary Smith", people)).toBeNull();
    expect(PickupMatchHelper.findNotAuthorized("Rick Sanders", [])).toBeNull();
  });
});
