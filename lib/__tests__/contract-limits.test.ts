import { describe, it, expect } from "vitest";
import { BOTCHAIN_ABI } from "../botchain/abi";
import {
  MIN_WINDOW,
  MAX_WINDOW,
  MIN_BUMP_BPS,
  MAX_BUMP_BPS,
  MIN_ADD,
  MAX_ADD,
} from "../hourglass";

describe("Hourglass contract limits and ABI match", () => {
  it("matches limits between contract ABI and TypeScript definitions", () => {
    const minWin = BOTCHAIN_ABI.find((x: any) => x.name === "MIN_WINDOW");
    const maxWin = BOTCHAIN_ABI.find((x: any) => x.name === "MAX_WINDOW");
    const minBump = BOTCHAIN_ABI.find((x: any) => x.name === "MIN_BUMP_BPS");
    const maxBump = BOTCHAIN_ABI.find((x: any) => x.name === "MAX_BUMP_BPS");
    const minAdd = BOTCHAIN_ABI.find((x: any) => x.name === "MIN_ADD");
    const maxAdd = BOTCHAIN_ABI.find((x: any) => x.name === "MAX_ADD");

    expect(minWin).toBeDefined();
    expect(maxWin).toBeDefined();
    expect(minBump).toBeDefined();
    expect(maxBump).toBeDefined();
    expect(minAdd).toBeDefined();
    expect(maxAdd).toBeDefined();

    expect(MIN_WINDOW).toBe(60);
    expect(MAX_WINDOW).toBe(86400);
    expect(MIN_BUMP_BPS).toBe(500);
    expect(MAX_BUMP_BPS).toBe(5000);
    expect(MIN_ADD).toBe(10_000_000_000_000_000n);
    expect(MAX_ADD).toBe(100_000_000_000_000_000_000_000n);
  });
});
