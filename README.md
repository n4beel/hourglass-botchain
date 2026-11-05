# Hourglass

Add to the pot. Last to add when time runs out takes it.

Hourglass is a last-one-standing chicken game on BOT Chain built with the **BG · Hourglass** archetype.

## Overview

- **Countdown Chicken Game**: Open games with a countdown window (1 minute to 1 day), escalation percentage (5% to 50%), and minimum initial add.
- **Dynamic Resets & Escalation Ladder**: Every addition to the pot resets the countdown and must exceed the previous add by at least `escalation%`.
- **Winner Takes All**: When the countdown reaches zero, the last player to add claims the entire cumulative pot. If nobody adds, the opener retrieves their initial seed in full.
- **Solvency & Conservation**: All funds are held in escrow, with pull-payment claims via `withdraw()`.

## Design Tokens & Archetype: BG · Hourglass

- Ground: `#1A2BA0`
- Ink: `#EEF0FF`
- Surface: `#121D6D`
- Accent: `#FFB347`
- Accent-ink: `#0A1050`
- Border-default: `#4956B5`
- Danger: `#FFB4AB`
- Success: `#7EE2A8`
- Typography: **Bebas Neue** (countdown timer, headings) + **Sarabun** (UI copy)

## Verification & Testing

- Foundry Unit & Fuzz Tests: 18 tests, fuzzing escalating additions and pot conservation (256 runs).
- Foundry Invariant Suite: Solvency check `balance == sum(pot of unpaid games) + sum(pending)` (256 runs, 128,000 handler calls, 0 reverts).
- Mutation Check: 22 of 25 mutants killed (88% kill rate; survivors analyzed in `contracts/DECISIONS.md`).
- Quality Gates: `check-tokens.py`, `check-ui-contract.py`, `check-distinct.py`, `check-honesty.py` all exit 0.
