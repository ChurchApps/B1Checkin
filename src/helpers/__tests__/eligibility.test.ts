import { EligibilityHelper } from "../EligibilityHelper";

const nursery = { minAgeMonths: 0, maxAgeMonths: 24 };
const elementary = { minGrade: "K", maxGrade: "2" };
const asOf = new Date(2026, 6, 3); // 2026-07-03

describe("EligibilityHelper.resolveAsOfDate", () => {
  const today = new Date(2026, 6, 3);

  it("returns today when unset", () => {
    expect(EligibilityHelper.resolveAsOfDate(null, today).getTime()).toBe(today.getTime());
    expect(EligibilityHelper.resolveAsOfDate("", today).getTime()).toBe(today.getTime());
  });

  it("uses this year's occurrence when it is on/before today", () => {
    const d = EligibilityHelper.resolveAsOfDate("01-01", today);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("wraps to last year when the cutoff is later this year", () => {
    const d = EligibilityHelper.resolveAsOfDate("10-01", today);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(9);
  });

  it("falls back to today on malformed input", () => {
    expect(EligibilityHelper.resolveAsOfDate("nope", today).getTime()).toBe(today.getTime());
    expect(EligibilityHelper.resolveAsOfDate("13-99-1", today).getTime()).toBe(today.getTime());
  });
});

describe("EligibilityHelper.ageInMonths", () => {
  it("computes whole months, decrementing before the birthday day", () => {
    expect(EligibilityHelper.ageInMonths(new Date(2024, 6, 3), asOf)).toBe(24);
    expect(EligibilityHelper.ageInMonths(new Date(2024, 7, 3), asOf)).toBe(23);
    expect(EligibilityHelper.ageInMonths(new Date(2026, 5, 4), asOf)).toBe(0); // one month shy of 1mo (day not reached)
  });
});

describe("EligibilityHelper.isEligible — age", () => {
  it("eligible inside the range and on the max boundary", () => {
    expect(EligibilityHelper.isEligible({ birthDate: new Date(2025, 6, 3) }, nursery, asOf)).toBe("eligible");
    expect(EligibilityHelper.isEligible({ birthDate: new Date(2024, 6, 3) }, nursery, asOf)).toBe("eligible"); // exactly 24mo
  });

  it("ineligible past the max", () => {
    expect(EligibilityHelper.isEligible({ birthDate: new Date(2024, 5, 3) }, nursery, asOf)).toBe("ineligible"); // 25mo
    expect(EligibilityHelper.isEligible({ birthDate: new Date(2012, 8, 30) }, nursery, asOf)).toBe("ineligible");
  });

  it("unknown when birthDate missing or invalid", () => {
    expect(EligibilityHelper.isEligible({}, nursery, asOf)).toBe("unknown");
    expect(EligibilityHelper.isEligible({ birthDate: new Date("not-a-date") }, nursery, asOf)).toBe("unknown");
  });

  it("accepts string birthDates", () => {
    expect(EligibilityHelper.isEligible({ birthDate: "2025-07-03" as any }, nursery, asOf)).toBe("eligible");
  });
});

describe("EligibilityHelper.isEligible — grade", () => {
  it("eligible inside range incl. boundaries", () => {
    expect(EligibilityHelper.isEligible({ grade: "K" }, elementary, asOf)).toBe("eligible");
    expect(EligibilityHelper.isEligible({ grade: "1" }, elementary, asOf)).toBe("eligible");
    expect(EligibilityHelper.isEligible({ grade: "2" }, elementary, asOf)).toBe("eligible");
  });

  it("ineligible below and above range (PreK, 3, Graduated)", () => {
    expect(EligibilityHelper.isEligible({ grade: "PreK" }, elementary, asOf)).toBe("ineligible");
    expect(EligibilityHelper.isEligible({ grade: "3" }, elementary, asOf)).toBe("ineligible");
    expect(EligibilityHelper.isEligible({ grade: "Graduated" }, elementary, asOf)).toBe("ineligible");
  });

  it("unknown when grade missing or unrecognized", () => {
    expect(EligibilityHelper.isEligible({}, elementary, asOf)).toBe("unknown");
    expect(EligibilityHelper.isEligible({ grade: "Freshman" }, elementary, asOf)).toBe("unknown");
  });
});

describe("EligibilityHelper.isEligible — combined + unconstrained", () => {
  const both = { ...nursery, ...elementary };

  it("unconstrained room is always unknown (never hidden)", () => {
    expect(EligibilityHelper.isEligible({ birthDate: new Date(2012, 0, 1), grade: "6" }, {}, asOf)).toBe("unknown");
  });

  it("eligible if any declared dimension matches", () => {
    // matches age, grade unknown -> eligible
    expect(EligibilityHelper.isEligible({ birthDate: new Date(2025, 6, 3) }, both, asOf)).toBe("eligible");
  });

  it("ineligible if any declared dimension is out of range", () => {
    expect(EligibilityHelper.isEligible({ birthDate: new Date(2024, 5, 3), grade: "K" }, both, asOf)).toBe("ineligible");
  });

  it("unknown when no declared dimension can be evaluated", () => {
    expect(EligibilityHelper.isEligible({}, both, asOf)).toBe("unknown");
  });
});
