"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectButton from "@/components/ui/ConnectButton";
import BuiltOnBotChain from "@/components/botchain/BuiltOnBotChain";
import NetworkBadge from "@/components/botchain/NetworkBadge";
import { footerLinks } from "@/lib/botchain/chain";
import { app } from "@/lib/app-config";

export default function PageShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const path = usePathname();
  const { site, explorer, contract } = footerLinks();

  return (
    <div className="flex flex-col min-h-screen justify-between text-white" style={{ background: "var(--bg-base)" }}>
      {/* Top Navigation Bar */}
      <header className="border-b px-5 py-3 sticky top-0 z-50 shadow-md" style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <span className="text-2xl animate-pulse">⏳</span>
              <span className="font-timer text-3xl font-normal text-[var(--accent)] tracking-wider">
                HOURGLASS
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-4 text-sm font-semibold tracking-wider uppercase">
              <Link href="/" className={`px-2 py-1 transition-colors ${path === "/" ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-white"}`}>
                Arenas
              </Link>
              <Link href="/new" className={`px-2 py-1 transition-colors ${path.startsWith("/new") ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-white"}`}>
                Start Game
              </Link>
              <Link href="/me" className={`px-2 py-1 transition-colors ${path.startsWith("/me") ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-white"}`}>
                My Ledger
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NetworkBadge />
            <div className="w-36 sm:w-44">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {(title || description) && (
          <div className="mb-8">
            {title && <h1 className="font-timer text-4xl sm:text-5xl tracking-wide uppercase text-[var(--text-primary)]">{title}</h1>}
            {description && <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">{description}</p>}
          </div>
        )}
        {children}
      </main>

      {/* Footer Area */}
      <footer className="border-t py-8 mt-16 text-xs text-[var(--text-muted)]" style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <span className="font-timer text-lg tracking-wider text-[var(--accent)]">
              {app.name} · Game of Nerve
            </span>
            <p className="text-xs text-[var(--text-secondary)] max-w-md">
              {app.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <BuiltOnBotChain className="uppercase tracking-widest text-[11px] font-bold" />
            </span>

            {contract && (
              <a href={contract} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)] transition-colors underline">
                Contract
              </a>
            )}
            <a href={site} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)] transition-colors underline">
              botchain.ai
            </a>
            <a href={explorer} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)] transition-colors underline">
              BOT Chain Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
