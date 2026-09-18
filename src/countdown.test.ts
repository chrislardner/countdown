import { describe, expect, it } from "vitest";
import { formatTarget, timeLeft } from "./countdown.ts";

const target = new Date("2027-01-01T00:00:00-07:00");

describe("timeLeft", () => {
  it("splits the remaining time into units", () => {
    const now = new Date(target.getTime() - (2 * 86_400 + 3 * 3600 + 4 * 60 + 5) * 1000);
    expect(timeLeft(target, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it("counts a partial second as a whole one", () => {
    expect(timeLeft(target, new Date(target.getTime() - 200))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 1,
    });
  });

  it("returns null at and after the target", () => {
    expect(timeLeft(target, target)).toBeNull();
    expect(timeLeft(target, new Date(target.getTime() + 1000))).toBeNull();
  });
});

describe("formatTarget", () => {
  it("writes the moment in the local time zone", () => {
    process.env.TZ = "America/Los_Angeles";
    expect(formatTarget(target)).toBe("Thursday, December 31, 2026 at 11:00 PM PST");
  });
});
