"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, usePublicClient } from "wagmi";
import { parseEther } from "viem";
import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { BOTCHAIN_ABI } from "@/lib/botchain/abi";
import { activeBotChain } from "@/lib/botchain/chain";
import { getDeployment } from "@/lib/botchain/deployment";
import { useToast } from "@/components/ui/Toast";
import { useWriteContract } from "@/lib/useChainWrite";
import { formatError } from "@/lib/errors";

export default function NewGamePage() {
  const router = useRouter();
  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient({ chainId: activeBotChain.id });
  const { writeContractAsync } = useWriteContract();
  const deployment = getDeployment(activeBotChain.id);
  const contractAddress = deployment.address;

  const [name, setName] = useState("Arena Showdown");
  const [windowSecs, setWindowSecs] = useState("300"); // 5 minutes
  const [bumpPercent, setBumpPercent] = useState("10"); // 10% (1000 bps)
  const [minAdd, setMinAdd] = useState("0.1");
  const [seed, setSeed] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast("error", "Wallet Disconnected", "Connect your wallet to open a game");
      return;
    }

    if (!name.trim() || new TextEncoder().encode(name).length > 48) {
      toast("error", "Invalid Name", "Game name must be 1 to 48 bytes");
      return;
    }

    const win = parseInt(windowSecs, 10);
    if (isNaN(win) || win < 60 || win > 86400) {
      toast("error", "Invalid Window", "Countdown window must be 1 minute (60s) to 1 day (86400s)");
      return;
    }

    const bumpPct = parseFloat(bumpPercent);
    if (isNaN(bumpPct) || bumpPct < 5 || bumpPct > 50) {
      toast("error", "Invalid Escalation", "Escalation must be between 5% and 50%");
      return;
    }
    const bumpBps = Math.round(bumpPct * 100);

    let parsedMinAdd: bigint;
    try {
      parsedMinAdd = parseEther(minAdd);
      if (parsedMinAdd < parseEther("0.01") || parsedMinAdd > parseEther("100000")) {
        toast("error", "Invalid Min Add", "Minimum add must be between 0.01 and 100,000 BOT");
        return;
      }
    } catch {
      toast("error", "Invalid Amount", "Check your minimum add amount");
      return;
    }

    let parsedSeed = 0n;
    try {
      if (seed && parseFloat(seed) > 0) {
        parsedSeed = parseEther(seed);
      }
    } catch {
      toast("error", "Invalid Seed", "Check your optional seed amount");
      return;
    }

    setSubmitting(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "open",
        args: [name.trim(), win, bumpBps, parsedMinAdd],
        value: parsedSeed,
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast("success", "Hourglass Opened!", "Game initialized successfully");
      router.push("/");
    } catch (err: any) {
      toast("error", "Opening Failed", formatError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Open An Hourglass"
      description="Initialize a new countdown game with your custom rules and optional initial pot seed."
    >
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <Panel glassStyle>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Game Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="font-timer text-xl uppercase tracking-wider text-[var(--accent)]">
                Game Name (Max 48 Bytes)
              </label>
              <input
                id="name"
                type="text"
                maxLength={48}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm rounded focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Countdown Window */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="windowSecs" className="font-timer text-xl uppercase tracking-wider text-[var(--accent)]">
                Countdown Window (Seconds)
              </label>
              <input
                id="windowSecs"
                type="number"
                min="60"
                max="86400"
                value={windowSecs}
                onChange={(e) => setWindowSecs(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold rounded focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-xs text-[var(--text-secondary)]">
                Time until timer runs out after each add. Common: 60s (1m), 300s (5m), 1800s (30m).
              </span>
            </div>

            {/* Escalation % */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bumpPercent" className="font-timer text-xl uppercase tracking-wider text-[var(--accent)]">
                Escalation Percentage (5% to 50%)
              </label>
              <input
                id="bumpPercent"
                type="number"
                min="5"
                max="50"
                step="any"
                value={bumpPercent}
                onChange={(e) => setBumpPercent(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold rounded focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-xs text-[var(--text-secondary)]">
                How much each new add must exceed the previous add (e.g. 10% means a 1 BOT add requires 1.1 BOT next).
              </span>
            </div>

            {/* Minimum First Add */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="minAdd" className="font-timer text-xl uppercase tracking-wider text-[var(--accent)]">
                Minimum First Add (BOT)
              </label>
              <input
                id="minAdd"
                type="number"
                step="any"
                min="0.01"
                max="100000"
                value={minAdd}
                onChange={(e) => setMinAdd(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold rounded focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-xs text-[var(--text-secondary)]">
                The minimum entry price to flip the glass for the first participant.
              </span>
            </div>

            {/* Optional Seed */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="seed" className="font-timer text-xl uppercase tracking-wider text-[var(--accent)]">
                Initial Pot Seed (BOT - Optional)
              </label>
              <input
                id="seed"
                type="number"
                step="any"
                min="0"
                max="100000"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold rounded focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-xs text-[var(--text-secondary)]">
                Sweeten the pot to attract competitors. If nobody ever adds, your seed returns to you in full.
              </span>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              disabled={submitting || !address}
              className="mt-3 w-full"
            >
              {submitting ? "Opening..." : "Open Hourglass Arena"}
            </Button>
          </form>
        </Panel>
      </div>
    </PageShell>
  );
}
