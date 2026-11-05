# Hourglass Architectural Decisions & Mutation Analysis

## Architectural Decisions

1. **Countdown Game Mechanics & Escalation Rule**
   - Each add resets the countdown timer: `endsAt = min(now + windowSecs, hardEnd)`.
   - Each add must be at least `escalation%` (`bumpBps`) higher than the previous add:
     `required = last == 0 ? minAdd : ceil(lastAdd * (10_000 + bumpBps) / 10_000)`.
   - The ceiling ensures prices strictly increase even on tiny fractions.
   - When the countdown reaches zero (`now >= endsAt`), anyone can call `claim(id)`.
   - If there were adds, the last participant (`last`) wins the entire cumulative pot.
   - If there were zero adds, the opener retrieves their initial seed in full.
   - A hard limit of 30 days (`MAX_GAME`) prevents perpetual games.

2. **Capital Conservation & Solvency Invariant**
   - Every wei sent via `open()` or `add()` enters the contract's balance and increases `pot`.
   - Claiming transitions the pot to the winner's or opener's `pending` balance.
   - At all times:
     `address(this).balance == sum(pot of unpaid games) + sum(pending)`.
   - Verified via Foundry invariant testing (256 runs, 128,000 handler calls, 0 reverts).

3. **Reentrancy Protection & Pull Payment Pattern**
   - Winnings are claimed to `pending` storage; players pull funds via `withdraw()`.
   - Follows zero-then-transfer with a `nonReentrant` mutex guard.

---

## Mutation Check Survivors Analysis

From `python3 scripts/mutation-check.py hourglass`, 22 of 25 mutants were killed (88% kill rate). The 3 surviving mutants are documented below:

1. **`Hourglass.sol:173` — `if (newEnd > g.hardEnd)` => `if (newEnd >= g.hardEnd)`**
   - When `newEnd == g.hardEnd`, setting `newEnd = g.hardEnd` is an idempotent assignment producing the exact same end timestamp.

2. **`Hourglass.sol:240` — `if (block.timestamp >= g.endsAt) return 0;` => `if (block.timestamp > g.endsAt) return 0;`**
   - In `timeLeft(id)`, when `block.timestamp == g.endsAt`, the original branch returns 0. If skipped, the subsequent line executes `return g.endsAt - uint64(block.timestamp)`, which evaluates to `endsAt - endsAt = 0`. Both branches return 0 at the boundary, making this mutant functionally equivalent.

3. **`Hourglass.sol:260` — `if (offset >= total || count == 0)` => `if (offset > total || count == 0)`**
   - In `latest(offset, count)`, when `offset == total`, the clamping logic `if (offset + count > total) count = total - offset;` executes and sets `count = 0`. The subsequent array allocation and loop run for 0 elements, producing an empty result identical to the early return.
