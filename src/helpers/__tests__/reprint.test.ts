// PrinterLog pulls in the native printer module (no web/node impl); stub it so the pure
// label logic is unit-testable off-device.
jest.mock("../PrinterLog", () => ({ PrinterLog: { add: jest.fn(), attachNativeListeners: jest.fn() } }));

import { LabelHelper } from "../LabelHelper";
import { ServiceTimeInterface, VisitInterface } from "../Interfaces";

// Mirrors the checkout screen's data shape: visits with populated sessions + the
// service-time tree that carries each group's parentPickup flag.
const serviceTimes: ServiceTimeInterface[] = [
  {
    id: "ST1",
    name: "9:00 AM",
    groups: [
      { id: "GNURSERY", name: "Nursery", parentPickup: true, printNametag: true },
      { id: "GADULT", name: "Adult Class", parentPickup: false, printNametag: false }
    ]
  }
];

const childVisit: VisitInterface = { id: "V1", personId: "P1", visitSessions: [{ session: { groupId: "GNURSERY", serviceTimeId: "ST1", displayName: "Nursery" } }] };
const adultVisit: VisitInterface = { id: "V2", personId: "P2", visitSessions: [{ session: { groupId: "GADULT", serviceTimeId: "ST1", displayName: "Adult Class" } }] };

describe("LabelHelper.selectChildVisits", () => {
  it("keeps only visits whose group has parentPickup", () => {
    const result = LabelHelper.selectChildVisits([childVisit, adultVisit], serviceTimes);
    expect(result.map(v => v.id)).toEqual(["V1"]);
  });

  it("returns empty when no visit lands in a pickup room", () => {
    expect(LabelHelper.selectChildVisits([adultVisit], serviceTimes)).toEqual([]);
  });

  it("tolerates empty/missing inputs", () => {
    expect(LabelHelper.selectChildVisits([], serviceTimes)).toEqual([]);
    expect(LabelHelper.selectChildVisits([{ id: "V3", visitSessions: [] }], serviceTimes)).toEqual([]);
  });
});
