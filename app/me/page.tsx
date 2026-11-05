"use client";

import { useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { BOTCHAIN_ABI } from "@/lib/botchain/abi";
import { activeBotChain } from "@/lib/botchain/chain";
import { getDeployment } from "@/lib/botchain/deployment";
import { useToast } from "@/components/ui/Toast";
import { useWriteContract } from "@/lib/useChainWrite";
import { formatError } from "@/lib/errors";

export default function MyHourglassLedgerPage() {
  const { address } = useAccount();
  const { toast } = useToast();
  const publicClient = usePublicClient({ chainId: activeBotChain.id });
  const { writeContractAsync } = useWriteContract();
  const deployment = getDeployment(activeBotChain.id);
  const contractAddress = deployment.address;

  const [withdrawing, setWithdrawing] = useState(false);

  // Read pending balance
  const { data: pendingBalance, refetch: refetchPending } = useReadContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "pending",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address && contractAddress !== "0x0000000000000000000000000000000000000000" },
  });

  const pendingAmount = pendingBalance ? (pendingBalance as bigint) : 0n;

  const handleWithdraw = async () => {
    if (!address || pendingAmount === 0n) return;
    setWithdrawing(true);
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: BOTCHAIN_ABI,
        functionName: "withdraw",
        args: [],
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      toast("success", "Withdrawn!", `${formatEther(pendingAmount)} BOT transferred to your wallet`);
      await refetchPending();
    } catch (err: any) {
      toast("error", "Withdraw Failed", formatError(err));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <PageShell
      title="My Ledger & Winnings"
      description="Track claimable pot earnings and seed refunds, and pull them into your connected wallet."
    >
      <div className="flex flex-col gap-8">
        {/* Pending Claimable Panel */}
        <Panel glassStyle className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <span className="font-timer text-xl uppercase tracking-wider text-[var(--accent)]">
              Pending Claimable Balance
            </span>
            <span className="font-timer text-4xl sm:text-5xl font-bold text-white">
              {formatEther(pendingAmount)} BOT
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              Includes pots won from claimed games and uncontested seed refunds.
            </span>
          </div>

          <Button
            size="lg"
            variant="ladder"
            loading={withdrawing}
            disabled={withdrawing || pendingAmount === 0n}
            onClick={handleWithdraw}
            className="w-full sm:w-auto px-8 py-4 text-base"
          >
            {pendingAmount === 0n ? "No Balance" : `Withdraw ${formatEther(pendingAmount)} BOT`}
          </Button>
        </Panel>

        {/* Quick Links Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-timer text-2xl font-bold uppercase text-[var(--accent)]">
                Ready to challenge?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Open your own custom Hourglass arena with a tight countdown window and an escalating entry ladder.
              </p>
            </div>
            <Link href="/new">
              <Button size="md" className="w-full">
                Open New Hourglass
              </Button>
            </Link>
          </Panel>

          <Panel className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-timer text-2xl font-bold uppercase text-[var(--accent)]">
                Browse Active Arenas
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Review live hourglass countdowns, watch the sand trickle down, and find the perfect moment to flip the glass.
              </p>
            </div>
            <Link href="/">
              <Button variant="ghost" size="md" className="w-full">
                Explore Arenas
              </Button>
            </Link>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
