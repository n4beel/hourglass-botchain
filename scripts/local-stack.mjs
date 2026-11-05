import { spawn } from "node:child_process";
import { createPublicClient, createWalletClient, defineChain, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BOTCHAIN_ABI } from "../lib/botchain/abi.js";

const PORT = 8762;
const RPC_URL = `http://127.0.0.1:${PORT}`;

const localChain = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
});

async function main() {
  console.log(`Starting local Anvil on port ${PORT}...`);
  const anvil = spawn("anvil", ["-p", String(PORT)], { stdio: "ignore" });

  const publicClient = createPublicClient({
    chain: localChain,
    transport: http(RPC_URL),
  });

  // Wait for anvil
  for (let i = 0; i < 30; i++) {
    try {
      await publicClient.getBlockNumber();
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log("Deploying Hourglass contract...");
  const deployer = spawn(
    "forge",
    [
      "create",
      "contracts/src/Hourglass.sol:Hourglass",
      "--rpc-url",
      RPC_URL,
      "--private-key",
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      "--broadcast",
    ],
    { cwd: process.cwd() }
  );

  let output = "";
  deployer.stdout.on("data", (d) => (output += d.toString()));
  deployer.stderr.on("data", (d) => (output += d.toString()));

  await new Promise((resolve, reject) => {
    deployer.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Deploy failed: ${output}`));
    });
  });

  const match = output.match(/Deployed to:\s*(0x[a-fA-F0-9]{40})/);
  if (!match) throw new Error("Could not find address");
  const contractAddress = match[1];
  console.log(`Hourglass deployed to: ${contractAddress}`);

  // Seeding roles
  const opener = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  const playerA = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  const playerB = privateKeyToAccount("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
  const playerC = privateKeyToAccount("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6");

  const clientOpener = createWalletClient({ account: opener, chain: localChain, transport: http(RPC_URL) });
  const clientA = createWalletClient({ account: playerA, chain: localChain, transport: http(RPC_URL) });
  const clientB = createWalletClient({ account: playerB, chain: localChain, transport: http(RPC_URL) });
  const clientC = createWalletClient({ account: playerC, chain: localChain, transport: http(RPC_URL) });

  // Seed 6 games per §5:
  // Game 1: running with adds
  const t1 = await clientOpener.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "open",
    args: ["Grand Hourglass", 1800, 1000, parseEther("0.1")],
    value: parseEther("0.5"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t1 });
  await clientA.writeContract({ address: contractAddress, abi: BOTCHAIN_ABI, functionName: "add", args: [1n], value: parseEther("0.1") });
  await clientB.writeContract({ address: contractAddress, abi: BOTCHAIN_ABI, functionName: "add", args: [1n], value: parseEther("0.12") });
  await clientC.writeContract({ address: contractAddress, abi: BOTCHAIN_ABI, functionName: "add", args: [1n], value: parseEther("0.15") });

  // Game 2: with 20 seconds left
  const t2 = await clientOpener.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "open",
    args: ["Blitz Hourglass", 60, 2000, parseEther("0.05")],
    value: parseEther("0.2"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t2 });
  await clientA.writeContract({ address: contractAddress, abi: BOTCHAIN_ABI, functionName: "add", args: [2n], value: parseEther("0.05") });

  // Game 3: ended with winner unclaimed
  const t3 = await clientOpener.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "open",
    args: ["Expired Unclaimed", 60, 1000, parseEther("0.1")],
    value: parseEther("1.0"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t3 });
  await clientA.writeContract({ address: contractAddress, abi: BOTCHAIN_ABI, functionName: "add", args: [3n], value: parseEther("0.1") });

  // Game 4: claimed
  const t4 = await clientOpener.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "open",
    args: ["Claimed Trophy", 60, 1000, parseEther("0.2")],
    value: parseEther("0.5"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t4 });
  await clientB.writeContract({ address: contractAddress, abi: BOTCHAIN_ABI, functionName: "add", args: [4n], value: parseEther("0.2") });

  // Game 5: no adds (seed returns)
  const t5 = await clientOpener.writeContract({
    address: contractAddress,
    abi: BOTCHAIN_ABI,
    functionName: "open",
    args: ["Uncontested Pot", 60, 1000, parseEther("1.0")],
    value: parseEther("2.0"),
  });
  await publicClient.waitForTransactionReceipt({ hash: t5 });

  console.log("Local stack seeded! Press Ctrl+C to terminate.");
  process.on("SIGINT", () => {
    anvil.kill();
    process.exit();
  });
}

main().catch(console.error);
