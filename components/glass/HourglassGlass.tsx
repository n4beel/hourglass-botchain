"use client";

import { useId, useState } from "react";
import { formatEther } from "viem";

export interface HourglassGlassProps {
  topFraction: number; // 0 to 1 (time remaining in current window)
  bottomFraction: number; // 0 to 1 (pot relative to reference pot)
  pot: bigint;
  timeLeftSecs: number;
  lastPlayer: `0x${string}`;
  plays: number;
  isEnded: boolean;
  flipped?: boolean;
}

export default function HourglassGlass({
  topFraction,
  bottomFraction,
  pot,
  timeLeftSecs,
  lastPlayer,
  plays,
  isEnded,
  flipped = false,
}: HourglassGlassProps) {
  const tableId = useId();
  const [showTable, setShowTable] = useState(false);

  // Clamping fractions
  const topH = Math.max(0, Math.min(1, topFraction));
  const botH = Math.max(0, Math.min(1, bottomFraction));

  // Time format
  const mins = Math.floor(timeLeftSecs / 60);
  const secs = timeLeftSecs % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Visual Glass Container */}
      <div className="relative w-full max-w-[340px] aspect-[4/5] p-2 flex items-center justify-center">
        <svg
          viewBox="0 0 200 260"
          className={`w-full h-full transition-transform duration-700 ease-out ${
            flipped ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <defs>
            {/* Sand Linear Gradients */}
            <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFE0A3" />
              <stop offset="100%" stopColor="#FFB347" />
            </linearGradient>

            <clipPath id="topBulbClip">
              <path d="M 30,30 L 170,30 L 115,120 A 15 15 0 0 0 100,128 A 15 15 0 0 0 85,120 Z" />
            </clipPath>

            <clipPath id="bottomBulbClip">
              <path d="M 85,140 A 15 15 0 0 0 100,132 A 15 15 0 0 0 115,140 L 170,230 L 30,230 Z" />
            </clipPath>
          </defs>

          {/* Wooden / Metallic Frame */}
          {/* Top Plate */}
          <rect x="20" y="15" width="160" height="15" rx="3" fill="#3141AA" stroke="#4956B5" strokeWidth="2" />
          {/* Bottom Plate */}
          <rect x="20" y="230" width="160" height="15" rx="3" fill="#3141AA" stroke="#4956B5" strokeWidth="2" />

          {/* Pillars */}
          <line x1="26" y1="30" x2="26" y2="230" stroke="#4956B5" strokeWidth="6" strokeLinecap="round" />
          <line x1="174" y1="30" x2="174" y2="230" stroke="#4956B5" strokeWidth="6" strokeLinecap="round" />

          {/* Glass Contour Fill */}
          <path
            d="M 30,30 L 170,30 L 115,120 A 15 15 0 0 0 100,128 A 15 15 0 0 0 85,120 Z"
            fill="rgba(255, 255, 255, 0.05)"
            stroke="#4956B5"
            strokeWidth="3"
          />
          <path
            d="M 85,140 A 15 15 0 0 0 100,132 A 15 15 0 0 0 115,140 L 170,230 L 30,230 Z"
            fill="rgba(255, 255, 255, 0.05)"
            stroke="#4956B5"
            strokeWidth="3"
          />

          {/* Top Sand: height decreases as time expires */}
          <g clipPath="url(#topBulbClip)">
            <rect
              x="20"
              y={30 + (1 - topH) * 95}
              width="160"
              height={topH * 95}
              fill="url(#sandGrad)"
            />
          </g>

          {/* Sand Trickle Stream in Neck (only when running and top has sand) */}
          {!isEnded && topH > 0 && (
            <line
              x1="100"
              y1="125"
              x2="100"
              y2="190"
              stroke="#FFE0A3"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              className="animate-trickle"
            />
          )}

          {/* Bottom Sand: fills upward based on pot volume */}
          <g clipPath="url(#bottomBulbClip)">
            <rect
              x="20"
              y={230 - botH * 95}
              width="160"
              height={botH * 95}
              fill="url(#sandGrad)"
            />
          </g>

          {/* Glass Highlights */}
          <path
            d="M 40,40 Q 60,80 85,115"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 40,220 Q 60,180 85,145"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* Big Center Countdown & Pot Badges */}
        <div className="absolute inset-0 flex flex-col items-center justify-between py-12 pointer-events-none text-center">
          {/* Top Timer Display */}
          <div className="bg-[var(--bg-surface)]/90 border border-[var(--border-default)] px-3 py-1 rounded shadow-md backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
              Time Remaining
            </span>
            <span className="font-timer text-2xl font-bold tracking-wider text-[var(--text-primary)]">
              {isEnded ? "EXPIRED" : timeFormatted}
            </span>
          </div>

          {/* Bottom Pot Display */}
          <div className="bg-[var(--bg-surface)]/90 border border-[var(--accent)] px-3 py-1 rounded shadow-md backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-[var(--accent)] block">
              Pot Value
            </span>
            <span className="font-timer text-2xl font-bold tracking-wider text-[var(--text-primary)]">
              {formatEther(pot)} BOT
            </span>
          </div>
        </div>
      </div>

      {/* Accessible fallback toggle */}
      <div className="w-full flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          aria-expanded={showTable}
          aria-controls={tableId}
          className="text-xs uppercase tracking-wider text-[var(--text-secondary)] underline hover:text-white cursor-pointer"
        >
          {showTable ? "Hide state table" : "Show accessible state table"}
        </button>

        {showTable && (
          <div id={tableId} className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] p-3 rounded text-xs">
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="py-1 text-[var(--text-secondary)]">Status:</th>
                  <td className="py-1 font-bold">{isEnded ? "Game Ended" : "Game In Progress"}</td>
                </tr>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="py-1 text-[var(--text-secondary)]">Time Left:</th>
                  <td className="py-1 font-mono">{timeFormatted} ({timeLeftSecs} seconds)</td>
                </tr>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="py-1 text-[var(--text-secondary)]">Current Pot:</th>
                  <td className="py-1 font-bold text-[var(--accent)]">{formatEther(pot)} BOT</td>
                </tr>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="py-1 text-[var(--text-secondary)]">Last Player:</th>
                  <td className="py-1 font-mono text-[11px]">{lastPlayer}</td>
                </tr>
                <tr>
                  <th className="py-1 text-[var(--text-secondary)]">Total Adds (Flips):</th>
                  <td className="py-1 font-bold">{plays}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
