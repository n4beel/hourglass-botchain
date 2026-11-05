import { describe, it, expect } from "vitest";
import {
  required,
  sandFractions,
  ladder,
  MIN_WINDOW,
  MAX_WINDOW,
  MIN_BUMP_BPS,
  MAX_BUMP_BPS,
  MIN_ADD,
  MAX_ADD,
  Game,
} from "../hourglass";

describe("Hourglass library calculations", () => {
  it("calculates required add amounts including ceiling division", () => {
    const minAdd = 100_000_000_000_000_000n; // 0.1 BOT
    // First add with no previous last
    expect(required(0n, 1000, minAdd, false)).toBe(minAdd);

    // 10% bump (1000 bps) on 1 BOT (1_000_000_000_000_000_000)
    // 1 ether * 11000 / 10000 = 1.1 ether
    const oneEther = 1_000_000_000_000_000_000n;
    expect(required(oneEther, 1000, minAdd, true)).toBe(1_100_000_000_000_000_000n);

    // Ceiling rounding test: 1001 wei with 500 bps (5%)
    // 1001 * 10500 = 10510500 / 10000 = 1051.05 -> ceiling is 1052 wei
    expect(required(1001n, 500, minAdd, true)).toBe(1052n);
  });

  it("calculates sand fractions for the hourglass display", () => {
    const now = 1000n;
    const game: Game = {
      opener: "0x1111111111111111111111111111111111111111",
      last: "0x2222222222222222222222222222222222222222",
      endsAt: 1600n, // 600s left
      hardEnd: 2000n,
      windowSecs: 1200, // half of window left -> 0.5
      bumpBps: 1000,
      plays: 3,
      paid: false,
      pot: 5_000_000_000_000_000_000n, // 5 BOT
      lastAdd: 2_000_000_000_000_000_000n,
      minAdd: 100_000_000_000_000_000n,
      name: "Test Game",
    };

    const { topFraction, bottomFraction } = sandFractions(
      game,
      now,
      10_000_000_000_000_000_000n
    );
    expect(topFraction).toBeCloseTo(0.5, 3);
    expect(bottomFraction).toBeCloseTo(0.5, 3);
  });

  it("reverses adds for ladder display", () => {
    const logs = [
      { who: "0x1" as `0x${string}`, amount: 1n, pot: 1n, endsAt: 10n },
      { who: "0x2" as `0x${string}`, amount: 2n, pot: 3n, endsAt: 20n },
    ];
    const lad = ladder(logs);
    expect(lad[0].who).toBe("0x2");
    expect(lad[1].who).toBe("0x1");
  });

  it("verifies contract constants", () => {
    expect(MIN_WINDOW).toBe(60);
    expect(MAX_WINDOW).toBe(86400);
    expect(MIN_BUMP_BPS).toBe(500);
    expect(MAX_BUMP_BPS).toBe(5000);
    expect(MIN_ADD).toBe(10_000_000_000_000_000n);
    expect(MAX_ADD).toBe(100_000_000_000_000_000_000_000n);
  });
});
