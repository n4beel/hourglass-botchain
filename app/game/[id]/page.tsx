"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import HourglassGlass from "@/components/glass/HourglassGlass";
import { BOTCHAIN_ABI } from "@/lib/botchain/abi";
import { activeBotChain } from "@/lib/botchain/chain";
import { getDeployment } from "@/lib/botchain/deployment";
import { useToast } from "@/components/ui/Toast";
import { useWriteContract } from "@/lib/useChainWrite";
import { sandFractions, formatAddress, AddLog, ladder } from "@/lib/hourglass";
import { formatError } from "@/lib/errors";

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = BigInt(resolvedParams.id);

  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient({ chainId: activeBotChain.id });
  const { writeContractAsync } = useWriteContract();
  const deployment = getDeployment(activeBotChain.id);
  const contractAddress = deployment.address;

  const [txBusy, setTxBusy] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [addLogs, setAddLogs] = useState<AddLog[]>([]);
  const [nowSec, setNowSec] = useState<bigint>(BigInt(Math.floor(Date.now() / 1000)));

  // Contract data
  const { data: gameData, refetch: refetchGame } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "gameOf",
    args: [id],
    query: { enabled: contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const { data: reqData, refetch: refetchReq } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "required",
    args: [id],
    query: { enabled: contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  // Re-sync clock with block timestamp every 4 seconds
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      if (publicClient) {
        try {
          const block = await publicClient.getBlock();
          if (!cancelled) setNowSec(block.timestamp);
        } catch {
          if (!cancelled) setNowSec(BigInt(Math.floor(Date.now() / 1000)));
        }
      } else {
        if (!cancelled) setNowSec(BigInt(Math.floor(Date.now() / 1000)));
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress]);

  // Load Added event logs for escalation ladder
  useEffect(() => {
    let cancelled = false;
    async function fetchLogs() {
      if (!publicClient || !contractAddress) return;
      try {
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: {
            type: "event",
            name: "Added",
            inputs: [
              { indexed: true, name: "id", type: "uint256" },
              { indexed: true, name: "who", type: "address" },
              { indexed: false, name: "amount", type: "uint128" },
              { indexed: false, name: "pot", type: "uint128" },
              { indexed: false, name: "endsAt", type: "uint64" },
            ],
          },
          args: { id },
          fromBlock: deployment.deployBlock,
        });

        if (!cancelled) {
          const formatted: AddLog[] = logs.map((l: any) => ({
            who: l.args.who,
            amount: l.args.amount,
            pot: l.args.pot,
            endsAt: l.args.endsAt,
            txHash: l.transactionHash,
          }));
          setAddLogs(formatted);
        }
      } catch (err) {
        console.error("Could not fetch add logs", err);
      }
    }
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress, id, deployment.deployBlock]);

  const g = gameData as any;
  const reqAmount = (reqData as bigint) || 0n;

  if (!g || !g.opener || g.opener === "0x0000000000000000000000000000000000000000") {
    return (
      <PageShell title="Hourglass Not Found">
        <Panel className="text-center py-12">
          <p className="font-timer text-2xl uppercase mb-3">Game #{id.toString()} does not exist</p>
          <Link href="/">
            <Button size="sm">Back to Arenas</Button>
          </Link>
        </Panel>
      </PageShell>
    );
  }

  const endsAt = BigInt(g.endsAt);
  const isEnded = nowSec >= endsAt;
  const timeLeftSecs = isEnded ? 0 : Number(endsAt - nowSec);
  const isLast = address && g.last.toLowerCase() === address.toLowerCase();
  const isOpener = address && g.opener.toLowerCase() === address.toLowerCase();
  const hasNoAdds = g.last === "0x0000000000000000000000000000000000000000";

  const { topFraction, bottomFraction } = sandFractions(g, nowSec);

  // Actions
  const handleAdd = async () => {
    if (!address) {
      toast("error", "Wallet Disconnected", "Connect wallet to flip");
      return;
    }
    setTxBusy(true);
    try {
      // Re-read latest required directly
      const latestReq = (await publicClient?.readContract({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "required",
        args: [id],
      })) as bigint;

      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "add",
        args: [id],
        value: latestReq,
      });

      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      setFlipped(!flipped);
      toast("success", "Flipped!", `Added ${formatEther(latestReq)} BOT to the pot!`);
      await Promise.all([refetchGame(), refetchReq()]);
    } catch (err: any) {
      toast("error", "Flip Failed", formatError(err));
    } finally {
      setTxBusy(false);
    }
  };

  const handleClaim = async () => {
    setTxBusy(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "claim",
        args: [id],
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      toast("success", "Game Settled", "Pot distributed to the victor's pending balance!");
      await refetchGame();
    } catch (err: any) {
      toast("error", "Claim Failed", formatError(err));
    } finally {
      setTxBusy(false);
    }
  };

  const ladderList = ladder(addLogs);

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        {/* Game Title & Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border-default)" }}>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="font-timer text-4xl sm:text-5xl font-bold uppercase text-[var(--text-primary)]">
                {g.name}
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
                g.paid ? "bg-[var(--success)] text-[var(--accent-ink)]" : isEnded ? "bg-[var(--danger)] text-white" : "bg-[var(--accent)] text-[var(--accent-ink)]"
              }`}>
                {g.paid ? "Claimed" : isEnded ? "Time Expired" : "Active Battle"}
              </span>
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              Opener: {formatAddress(g.opener)} · Window: {g.windowSecs}s · Escalation: {(g.bumpBps / 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs uppercase text-[var(--text-secondary)] font-bold">Total Pot</span>
              <span className="font-timer text-3xl font-bold text-[var(--accent)]">
                {formatEther(g.pot)} BOT
              </span>
            </div>
          </div>
        </div>

        {/* Status Callouts */}
        {hasNoAdds && !isEnded && isOpener && (
          <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--accent)] text-xs font-semibold text-[var(--accent)] rounded">
            ★ You opened this game. If time expires and nobody adds, your entire seed will return to you.
          </div>
        )}
        {isLast && !isEnded && (
          <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--success)] text-xs font-semibold text-[var(--success)] rounded">
            ★ YOU ARE THE LAST ADDER! If time expires before another flip, you win {formatEther(g.pot)} BOT!
          </div>
        )}
        {timeLeftSecs > 0 && timeLeftSecs <= 10 && (
          <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--danger)] text-xs font-bold text-[var(--danger)] rounded animate-pulse">
            ⚠ UNDER 10 SECONDS REMAINING! Blocks mine quickly; late additions are high risk.
          </div>
        )}

        {/* Main Arena Layout: Hourglass & Action on Left, Escalation Ladder on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Hourglass & Flip Control (7 cols) */}
          <Panel glassStyle className="lg:col-span-7 flex flex-col items-center gap-6 py-8">
            <HourglassGlass
              topFraction={topFraction}
              bottomFraction={bottomFraction}
              pot={g.pot}
              timeLeftSecs={timeLeftSecs}
              lastPlayer={g.last}
              plays={g.plays}
              isEnded={isEnded}
              flipped={flipped}
            />

            {/* Flip / Action Area */}
            <div className="w-full max-w-md flex flex-col gap-3 mt-2">
              {!isEnded && !g.paid && (
                <Button
                  size="lg"
                  variant="ladder"
                  loading={txBusy}
                  disabled={txBusy || isLast || !address}
                  onClick={handleAdd}
                  className="w-full py-4 text-lg font-black tracking-wider"
                >
                  {isLast
                    ? "You are the last one. Wait for someone to add."
                    : `Flip it: ${formatEther(reqAmount)} BOT`}
                </Button>
              )}

              {isEnded && !g.paid && (
                <Button
                  size="lg"
                  variant="primary"
                  loading={txBusy}
                  disabled={txBusy}
                  onClick={handleClaim}
                  className="w-full py-4 text-lg font-bold"
                >
                  {hasNoAdds ? "Claim Seed Refund" : `Claim Pot: ${formatEther(g.pot)} BOT`}
                </Button>
              )}

              {g.paid && (
                <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--success)] rounded text-center">
                  <span className="font-timer text-2xl text-[var(--success)] block">VICTORY CLAIMED</span>
                  <span className="text-xs text-[var(--text-secondary)] font-mono">
                    Winner: {hasNoAdds ? formatAddress(g.opener) : formatAddress(g.last)} ({formatEther(g.pot)} BOT)
                  </span>
                </div>
              )}
            </div>
          </Panel>

          {/* Escalation Ladder (5 cols) */}
          <Panel className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--border-default)" }}>
              <h3 className="font-timer text-2xl font-bold uppercase tracking-wider text-[var(--accent)]">
                Escalation Ladder
              </h3>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {g.plays} Total Flips
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
              {ladderList.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
                  No flips yet. Be the first to turn the glass!
                </div>
              ) : (
                ladderList.map((entry, idx) => {
                  const isCurrent = idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded border flex items-center justify-between transition-all ${
                        isCurrent
                          ? "bg-[var(--bg-elevated)] border-[var(--accent)] shadow-md"
                          : "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-white">
                          {formatAddress(entry.who)} {entry.who.toLowerCase() === address?.toLowerCase() && "(You)"}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          Flip #{g.plays - idx}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="font-timer text-base font-bold text-[var(--accent)]">
                          +{formatEther(entry.amount)} BOT
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          Pot: {formatEther(entry.pot)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
