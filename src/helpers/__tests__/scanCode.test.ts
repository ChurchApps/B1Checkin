import { ScanCodeHelper } from "../ScanCodeHelper";

describe("ScanCodeHelper.parse", () => {
  it("accepts a 4-character security code, trimmed and upper-cased", () => {
    expect(ScanCodeHelper.parse("B7KX")).toBe("B7KX");
    expect(ScanCodeHelper.parse("  b7kx \n")).toBe("B7KX");
  });

  it("rejects text that isn't a security code", () => {
    expect(ScanCodeHelper.parse("")).toBeNull();
    expect(ScanCodeHelper.parse("B7K")).toBeNull();
    expect(ScanCodeHelper.parse("B7KXZ")).toBeNull();
    expect(ScanCodeHelper.parse("A1O0")).toBeNull();
    expect(ScanCodeHelper.parse("https://example.com")).toBeNull();
  });
});

describe("ScanCodeHelper.isRepeat", () => {
  it("ignores the same code within 4 seconds", () => {
    const last = { code: "B7KX", at: 1000 };
    expect(ScanCodeHelper.isRepeat(last, "B7KX", 4999)).toBe(true);
    expect(ScanCodeHelper.isRepeat(last, "B7KX", 5000)).toBe(false);
    expect(ScanCodeHelper.isRepeat(last, "C8LY", 1500)).toBe(false);
  });
});
