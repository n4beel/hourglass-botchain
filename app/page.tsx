"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { useAccount, useReadContract } from "wagmi";
import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { BOTCHAIN_ABI } from "@/lib/botchain/abi";
import { activeBotChain } from "@/lib/botchain/chain";
import { getDeployment } from "@/lib/botchain/deployment";
import { formatAddress } from "@/lib/hourglass";

export default function HomePage() {
  const { address } = useAccount();
  const deployment = getDeployment(activeBotChain.id);
  const contractAddress = deployment.address;

  // Read gameCount
  const { data: countData } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "gameCount",
    query: { enabled: contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const count = countData ? Number(countData) : 0;

  // Read latest games
  const { data: latestData, isLoading } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "latest",
    args: [0n, BigInt(Math.min(count, 12))],
    query: { enabled: count > 0 && contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const games = (latestData ? (latestData as any)[1] : []) as any[];

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        {/* Hero Section */}
        <Panel glassStyle className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <h1 className="font-timer text-5xl md:text-6xl font-normal tracking-wide text-[var(--accent)] leading-tight">
              Add To The Pot. <br />
              <span className="text-white">Last To Add When Time Runs Out Takes It.</span>
            </h1>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              A game of pure chicken. Every add resets the countdown and costs more than the last.
              When the sand runs dry, the last one standing claims the entire pot.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link href="/new" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Open Hourglass
              </Button>
            </Link>
            <Link href="/me" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full">
                My Ledger
              </Button>
            </Link>
          </div>
        </Panel>

        {/* Limits & Rules Card */}
        <Panel className="border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <h2 className="font-timer text-2xl font-bold uppercase tracking-wider mb-3 text-[var(--accent)]">
            A game of chicken
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
            <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col gap-1 rounded">
              <span className="font-timer text-base uppercase text-[var(--accent)]">High Risk Nerve</span>
              <p className="text-[var(--text-secondary)]">
                Most players lose what they add. Only the last one wins. This is a game of timing and stamina.
              </p>
            </div>
            <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col gap-1 rounded">
              <span className="font-timer text-base uppercase text-[var(--accent)]">Sudden Death</span>
              <p className="text-[var(--text-secondary)]">
                A well-timed last add wins. Nobody can see it coming. Every flip raises the minimum price for the next player.
              </p>
            </div>
            <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col gap-1 rounded">
              <span className="font-timer text-base uppercase text-[var(--accent)]">Chain Finality</span>
              <p className="text-[var(--text-secondary)]">
                Block order on a fast chain isn&apos;t yours to control. Don&apos;t add what you can&apos;t afford to lose.
              </p>
            </div>
          </div>
        </Panel>

        {/* Games Grid - Row of Hourglasses */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-timer text-3xl font-bold uppercase tracking-wide">
              Active Glasses ({count})
            </h2>
            <Link href="/new">
              <Button size="sm">+ Open Glass</Button>
            </Link>
          </div>

          {isLoading && (
            <Panel className="text-center py-10">
              <p className="font-timer text-xl uppercase">Loading glasses...</p>
            </Panel>
          )}

          {!isLoading && games.length === 0 && (
            <Panel className="text-center py-12 flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">⏳</span>
              <p className="font-timer uppercase text-2xl">No active games found</p>
              <p className="text-xs text-[var(--text-secondary)] max-w-md">
                Open a new game with your chosen countdown window, seed, and bump percentage.
              </p>
              <Link href="/new">
                <Button size="md">Start First Game</Button>
              </Link>
            </Panel>
          )}

          {!isLoading && games.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {games.map((g: any, idx: number) => {
                const id = BigInt(count - idx);
                const nowSec = BigInt(Math.floor(Date.now() / 1000));
                const isEnded = nowSec >= BigInt(g.endsAt);
                const timeLeft = isEnded ? 0 : Number(BigInt(g.endsAt) - nowSec);

                return (
                  <Panel key={id.toString()} glassStyle className="flex flex-col justify-between gap-4 p-5 hover:border-[var(--accent)] transition-all">
                    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                      <span className="font-timer text-xl font-bold uppercase text-[var(--accent)]">
                        #{id.toString()} {g.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        g.paid ? "bg-[var(--success)] text-[var(--accent-ink)]" : isEnded ? "bg-[var(--danger)] text-white" : "bg-[var(--accent)] text-[var(--accent-ink)]"
                      }`}>
                        {g.paid ? "Claimed" : isEnded ? "Ended" : "Live"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-[var(--text-secondary)]">Pot Size</span>
                        <span className="font-timer text-2xl font-bold text-white">
                          {formatEther(g.pot)} BOT
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase text-[var(--text-secondary)]">Time Left</span>
                        <span className="font-timer text-2xl font-bold text-[var(--accent)]">
                          {isEnded ? "00:00" : `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[var(--text-secondary)] flex flex-col gap-1 border-t border-[var(--border-subtle)] pt-2">
                      <div className="flex justify-between">
                        <span>Last Adder:</span>
                        <span className="font-mono text-white">
                          {g.last === "0x0000000000000000000000000000000000000000" ? "None (Opener seed)" : formatAddress(g.last)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Plays / Flips:</span>
                        <span className="font-bold text-white">{g.plays}</span>
                      </div>
                    </div>

                    <Link href={`/game/${id.toString()}`} className="w-full mt-2">
                      <Button size="md" className="w-full">
                        Enter Arena →
                      </Button>
                    </Link>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
