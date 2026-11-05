import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "node:child_process";
import { createPublicClient, createWalletClient, defineChain, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BOTCHAIN_ABI } from "../../lib/botchain/abi";
import { required } from "../../lib/hourglass";

const ANVIL_PORT = 8662;
const RPC_URL = `http://127.0.0.1:${ANVIL_PORT}`;

const localChain = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
});

describe("Hourglass Integration Test", () => {
  let anvil: ChildProcess;

  const opener = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  const playerA = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  const playerB = privateKeyToAccount("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");

  const publicClient = createPublicClient({
    chain: localChain,
    transport: http(RPC_URL),
  });

  const clientOpener = createWalletClient({ account: opener, chain: localChain, transport: http(RPC_URL) });
  const clientA = createWalletClient({ account: playerA, chain: localChain, transport: http(RPC_URL) });
  const clientB = createWalletClient({ account: playerB, chain: localChain, transport: http(RPC_URL) });

  let hgAddress: `0x${string}`;

  beforeAll(async () => {
    anvil = spawn("anvil", ["-p", String(ANVIL_PORT)], { stdio: "ignore" });

    for (let i = 0; i < 30; i++) {
      try {
        await publicClient.getBlockNumber();
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

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

    await new Promise<void>((resolve, reject) => {
      deployer.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Deploy failed: ${output}`));
      });
    });

    const match = output.match(/Deployed to:\s*(0x[a-fA-F0-9]{40})/);
    if (!match) throw new Error(`Could not find deployed address: ${output}`);
    hgAddress = match[1] as `0x${string}`;
  }, 30000);

  afterAll(() => {
    if (anvil) anvil.kill();
  });

  it("handles the complete hourglass game flow: open -> add -> add -> time expires -> claim -> withdraw", async () => {
    // 1. Opener opens a 5-minute game with 1 BOT seed, 10% bump, 0.5 BOT minAdd
    const windowSecs = 300;
    const bumpBps = 1000;
    const minAdd = parseEther("0.5");
    const seed = parseEther("1.0");

    const openTx = await clientOpener.writeContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "open",
      args: ["Arena Showdown", windowSecs, bumpBps, minAdd],
      value: seed,
    });
    await publicClient.waitForTransactionReceipt({ hash: openTx });

    const id = 1n;
    const game1 = (await publicClient.readContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "gameOf",
      args: [id],
    })) as any;

    expect(game1.opener.toLowerCase()).toBe(opener.address.toLowerCase());
    expect(game1.pot).toBe(seed);
    expect(game1.last).toBe("0x0000000000000000000000000000000000000000");

    // 2. Player A adds minAdd
    const req1Contract = (await publicClient.readContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "required",
      args: [id],
    })) as bigint;

    const req1Lib = required(0n, bumpBps, minAdd, false);
    expect(req1Contract).toBe(req1Lib);
    expect(req1Contract).toBe(minAdd);

    const add1Tx = await clientA.writeContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "add",
      args: [id],
      value: minAdd,
    });
    await publicClient.waitForTransactionReceipt({ hash: add1Tx });

    // 3. Player B adds 10% bumped amount
    const req2Contract = (await publicClient.readContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "required",
      args: [id],
    })) as bigint;

    const req2Lib = required(minAdd, bumpBps, minAdd, true);
    expect(req2Contract).toBe(req2Lib);
    expect(req2Contract).toBe(parseEther("0.55")); // 0.5 * 1.1

    const add2Tx = await clientB.writeContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "add",
      args: [id],
      value: req2Contract,
    });
    await publicClient.waitForTransactionReceipt({ hash: add2Tx });

    const gameAfterAdd2 = (await publicClient.readContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "gameOf",
      args: [id],
    })) as any;

    expect(gameAfterAdd2.last.toLowerCase()).toBe(playerB.address.toLowerCase());
    expect(gameAfterAdd2.plays).toBe(2);
    expect(gameAfterAdd2.pot).toBe(seed + minAdd + req2Contract); // 1.0 + 0.5 + 0.55 = 2.05 BOT

    // 4. Warp past endsAt
    await (publicClient.request as any)({
      method: "evm_increaseTime",
      params: [windowSecs + 10],
    });
    await (publicClient.request as any)({ method: "evm_mine", params: [] });

    // 5. Outsider (Opener) claims
    const claimTx = await clientOpener.writeContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "claim",
      args: [id],
    });
    await publicClient.waitForTransactionReceipt({ hash: claimTx });

    // Winner (Player B) has entire pot in pending
    const pendingB = (await publicClient.readContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "pending",
      args: [playerB.address],
    })) as bigint;
    expect(pendingB).toBe(gameAfterAdd2.pot);

    // 6. Winner (Player B) withdraws
    const withdrawTx = await clientB.writeContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "withdraw",
      args: [],
    });
    await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

    const pendingBAfter = (await publicClient.readContract({
      address: hgAddress,
      abi: BOTCHAIN_ABI,
      functionName: "pending",
      args: [playerB.address],
    })) as bigint;
    expect(pendingBAfter).toBe(0n);
  });
});
