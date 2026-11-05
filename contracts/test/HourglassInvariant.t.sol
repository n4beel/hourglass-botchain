// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/Hourglass.sol";

contract HourglassHandler is Test {
  Hourglass public hg;

  address public alice = address(0x1111);
  address public bob = address(0x2222);
  address public charlie = address(0x3333);

  uint256 public activeGameId;
  uint256 public ghost_totalPots;
  uint256 public ghost_totalPending;

  constructor(Hourglass _hg) {
    hg = _hg;

    vm.deal(alice, 100_000 ether);
    vm.deal(bob, 100_000 ether);
    vm.deal(charlie, 100_000 ether);

    vm.prank(alice);
    activeGameId = hg.open{value: 1 ether}("Main Invariant Game", 1 hours, 1000, 0.1 ether);
    ghost_totalPots = 1 ether;
  }

  function addAlice(uint128 extra) external {
    Hourglass.Game memory g = hg.gameOf(activeGameId);
    if (block.timestamp >= g.endsAt || g.paid || g.last == alice) return;

    uint128 req = hg.required(activeGameId);
    uint128 addAmt = req + (extra % 1 ether);
    if (addAmt > 100_000 ether) return;

    vm.deal(alice, addAmt + 1 ether);
    vm.prank(alice);
    try hg.add{value: addAmt}(activeGameId) {
      ghost_totalPots += addAmt;
    } catch {}
  }

  function addBob(uint128 extra) external {
    Hourglass.Game memory g = hg.gameOf(activeGameId);
    if (block.timestamp >= g.endsAt || g.paid || g.last == bob) return;

    uint128 req = hg.required(activeGameId);
    uint128 addAmt = req + (extra % 1 ether);
    if (addAmt > 100_000 ether) return;

    vm.deal(bob, addAmt + 1 ether);
    vm.prank(bob);
    try hg.add{value: addAmt}(activeGameId) {
      ghost_totalPots += addAmt;
    } catch {}
  }

  function advanceTime(uint32 secs) external {
    vm.warp(block.timestamp + (secs % 3 hours));
  }

  function claimGame() external {
    Hourglass.Game memory g = hg.gameOf(activeGameId);
    if (block.timestamp >= g.endsAt && !g.paid) {
      uint128 pot = g.pot;
      try hg.claim(activeGameId) {
        ghost_totalPots -= pot;
        ghost_totalPending += pot;
      } catch {}
    }
  }

  function withdrawPending() external {
    address[3] memory actors = [alice, bob, charlie];
    for (uint256 i = 0; i < 3; i++) {
      uint256 amt = hg.pending(actors[i]);
      if (amt > 0) {
        vm.prank(actors[i]);
        try hg.withdraw() {
          ghost_totalPending -= amt;
        } catch {}
      }
    }
  }
}

contract HourglassInvariantTest is Test {
  Hourglass public hg;
  HourglassHandler public handler;

  function setUp() public {
    hg = new Hourglass();
    handler = new HourglassHandler(hg);

    targetContract(address(handler));
  }

  function invariant_BalanceEqualsPotsPlusPending() public view {
    // Solvency Invariant: balance == total active pots + total pending
    assertEq(address(hg).balance, handler.ghost_totalPots() + handler.ghost_totalPending());
  }
}
