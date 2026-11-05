# Handover: 62 — Hourglass

## Completed Milestones

1. **Scaffold**: Initialized via `./new-project.sh hourglass` with BG · Hourglass tokens.
2. **Contract & Invariants**:
   - `Hourglass.sol`: Implements `open`, `add`, `claim`, `withdraw`, `gameOf`, `required`, `timeLeft`, `latest`.
   - Comprehensive unit and fuzz tests with escalation calculations (`Hourglass.t.sol`).
   - Invariant testing (`HourglassInvariant.t.sol`): 256 runs, 128,000 handler calls verifying solvency balance conservation without reverts.
3. **ABI & Client Library**:
   - `lib/botchain/abi.ts`: Complete ABI with all contract methods and events.
   - `lib/hourglass.ts`: Parity functions (`required`, `sandFractions`, `ladder`, `formatAddress`).
   - `lib/errors.ts`: Custom error decoding.
   - Vitest unit test suite covering vector edges and ceiling calculations.
4. **Integration & Local Stack**:
   - `test/integration/hourglass.test.ts`: Runs on Anvil port 8662 covering complete lifecycle (open -> add -> add -> time expires -> claim -> withdraw).
   - `scripts/local-stack.mjs`: Seeds 6 games on port 8762 covering live, ended, claimed, and uncontested games.
5. **Design Tokens & Shell**:
   - Layout archetype **BG · Hourglass**: Ground `#1A2BA0`, Ink `#EEF0FF`, Surface `#121D6D`, Accent `#FFB347`.
   - Font pairing: Bebas Neue + Sarabun.
   - Contrast ratios (WCAG 2.1 AA/AAA compliant):
     - Ink on ground: 9.8:1 (AAA)
     - Ink on surface: 13.0:1 (AAA)
     - Muted on surface: 6.2:1 (AA)
     - Accent-ink on accent: 9.8:1 (AAA)
6. **Screens & Components**:
   - `components/glass/HourglassGlass.tsx`: Custom SVG hourglass visualizing remaining time as sand in the top bulb, accumulated pot in the bottom bulb, sand trickle animation, and accessible table fallback.
   - `/`: Home view with hero, chicken game rules, and grid of active games.
   - `/new`: Form with validation for custom window (1m-1d), escalation bump (5-50%), min add, optional seed.
   - `/game/[id]`: Full arena view with interactive hourglass, contextual "Flip it" button, victory claim, and live escalation ladder.
   - `/me`: History of winnings, seed refunds, and pull payment claim via `withdraw()`.
7. **Verification & Gates**:
   - Mutation check: 22 of 25 mutants killed (88%); survivors documented in `contracts/DECISIONS.md`.
   - `check-tokens.py hourglass`: 0 errors.
   - `check-ui-contract.py hourglass`: ok.
   - `check-distinct.py hourglass`: 0 errors.
   - `check-honesty.py hourglass`: 0 findings.
   - Production build passes with TypeScript and Turbopack.
