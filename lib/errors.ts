export function formatHourglassError(err: any): string {
  const msg = err?.shortMessage || err?.message || String(err);

  if (msg.includes("BadParams")) {
    return "Invalid parameters. Check name length (<= 48 bytes), window (1m-1d), bump (5-50%), and min add (0.01-100k BOT).";
  }
  if (msg.includes("GameNotFound")) {
    return "Game not found.";
  }
  if (msg.includes("Ended")) {
    return "Time ran out.";
  }
  if (msg.includes("AlreadyLast")) {
    return "You are the last one. Wait for someone else to add.";
  }
  if (msg.includes("TooLow")) {
    return "Someone flipped first. You now need to add a higher amount.";
  }
  if (msg.includes("TooHigh")) {
    return "Amount exceeds the maximum limit of 100,000 BOT.";
  }
  if (msg.includes("StillRunning")) {
    return "The countdown is still running. Cannot claim yet.";
  }
  if (msg.includes("AlreadyPaid")) {
    return "This game has already been claimed.";
  }
  if (msg.includes("NothingToWithdraw")) {
    return "No pending balance to withdraw.";
  }
  if (msg.includes("TransferFailed")) {
    return "Transfer failed during withdrawal.";
  }

  return msg;
}

export const formatError = formatHourglassError;
