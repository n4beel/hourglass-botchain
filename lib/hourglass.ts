export const MIN_WINDOW = 60; // 1 minute
export const MAX_WINDOW = 86400; // 1 day
export const MIN_BUMP_BPS = 500; // 5.00%
export const MAX_BUMP_BPS = 5000; // 50.00%
export const MIN_ADD = 10_000_000_000_000_000n; // 0.01 ether
export const MAX_ADD = 100_000_000_000_000_000_000_000n; // 100,000 ether
export const MAX_GAME_SECS = 2592000n; // 30 days
export const MAX_NAME_BYTES = 48;
export const MAX_PAGE = 50;

export interface Game {
  opener: `0x${string}`;
  last: `0x${string}`;
  endsAt: bigint;
  hardEnd: bigint;
  windowSecs: number;
  bumpBps: number;
  plays: number;
  paid: boolean;
  pot: bigint;
  lastAdd: bigint;
  minAdd: bigint;
  name: string;
}

export interface GameData extends Game {
  id: bigint;
}

/**
 * Calculates the required amount for the next add.
 * required(g) = g.last == 0 ? g.minAdd : ceil(g.lastAdd * (10_000 + g.bumpBps) / 10_000)
 */
export function required(
  lastAdd: bigint,
  bumpBps: number,
  minAdd: bigint,
  hasLast: boolean
): bigint {
  if (!hasLast || lastAdd === 0n) {
    return minAdd;
  }
  const numerator = lastAdd * BigInt(10_000 + bumpBps);
  return (numerator + 9_999n) / 10_000n;
}

/**
 * Sand fractions for the SVG hourglass:
 * topFraction: time left in current window (0.0 to 1.0)
 * bottomFraction: pot relative to maxPotSeen (0.0 to 1.0)
 */
export function sandFractions(
  game: Game,
  nowSec: bigint,
  maxPotSeen: bigint = 10_000_000_000_000_000_000n // default 10 BOT reference
): { topFraction: number; bottomFraction: number } {
  let topFraction = 0;
  if (nowSec < game.endsAt && game.windowSecs > 0) {
    const remaining = Number(game.endsAt - nowSec);
    topFraction = Math.max(0, Math.min(1, remaining / game.windowSecs));
  }

  const pot = game.pot;
  const refPot = maxPotSeen > 0n ? maxPotSeen : 1_000_000_000_000_000_000n;
  const bottomFraction = Math.max(0.05, Math.min(1, Number(pot) / Number(refPot)));

  return { topFraction, bottomFraction };
}

export interface AddLog {
  who: `0x${string}`;
  amount: bigint;
  pot: bigint;
  endsAt: bigint;
  txHash?: `0x${string}`;
}

/**
 * Orders and formats logs for the escalation ladder (most recent first)
 */
export function ladder(adds: AddLog[]): AddLog[] {
  return [...adds].reverse();
}

export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
