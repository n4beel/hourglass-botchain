// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "forge-std/Test.sol";
import "../src/Hourglass.sol";

contract MaliciousActor {
  Hourglass public hg;
  bool public attackWithdraw;

  constructor(Hourglass _hg) {
    hg = _hg;
  }

  function setAttackWithdraw(bool v) external {
    attackWithdraw = v;
  }

  receive() external payable {
    if (attackWithdraw) {
      hg.withdraw();
    }
  }
}

contract HourglassTest is Test {
  Hourglass public hg;

  address public alice = address(0x1111);
  address public bob = address(0x2222);
  address public charlie = address(0x3333);
  address public david = address(0x4444);

  function setUp() public {
    hg = new Hourglass();
    vm.deal(alice, 1000 ether);
    vm.deal(bob, 1000 ether);
    vm.deal(charlie, 1000 ether);
    vm.deal(david, 1000 ether);

    vm.warp(1000 days);
  }

  function test_OpenWithAndWithoutSeed() public {
    // 1. Without seed
    vm.prank(alice);
    uint256 id1 = hg.open("Quick Game", 10 minutes, 1000, 0.1 ether);
    Hourglass.Game memory g1 = hg.gameOf(id1);
    assertEq(g1.opener, alice);
    assertEq(g1.pot, 0);
    assertEq(g1.windowSecs, 10 minutes);
    assertEq(g1.bumpBps, 1000);
    assertEq(g1.minAdd, 0.1 ether);
    assertEq(g1.endsAt, block.timestamp + 10 minutes);
    assertEq(g1.hardEnd, block.timestamp + 30 days);

    // 2. With seed
    vm.prank(bob);
    uint256 id2 = hg.open{value: 2 ether}("Seeded Game", 1 hours, 2000, 0.5 ether);
    Hourglass.Game memory g2 = hg.gameOf(id2);
    assertEq(g2.opener, bob);
    assertEq(g2.pot, 2 ether);
  }

  function test_FirstAddAtLeastMinAdd_ArgsRequired() public {
    vm.prank(alice);
    uint256 id = hg.open("Game", 10 minutes, 1000, 1 ether);

    assertEq(hg.required(id), 1 ether);

    // Less than minAdd reverts with TooLow
    vm.prank(bob);
    vm.expectRevert(abi.encodeWithSelector(Hourglass.TooLow.selector, 1 ether));
    hg.add{value: 0.9 ether}(id);

    // Exactly minAdd succeeds
    vm.prank(bob);
    hg.add{value: 1 ether}(id);

    Hourglass.Game memory g = hg.gameOf(id);
    assertEq(g.last, bob);
    assertEq(g.lastAdd, 1 ether);
    assertEq(g.pot, 1 ether);
    assertEq(g.plays, 1);
  }

  function test_NextAddMustBeBumpAboveLast_ArgsRequired() public {
    // 10% bump (1000 bps)
    vm.prank(alice);
    uint256 id = hg.open("Game", 10 minutes, 1000, 1 ether);

    vm.prank(bob);
    hg.add{value: 1 ether}(id);

    // Next add must be ceil(1 ether * 1.1) = 1.1 ether
    uint128 nextReq = hg.required(id);
    assertEq(nextReq, 1.1 ether);

    vm.prank(charlie);
    vm.expectRevert(abi.encodeWithSelector(Hourglass.TooLow.selector, 1.1 ether));
    hg.add{value: 1.09 ether}(id);

    // Adding 2 ether (higher than required) succeeds
    vm.prank(charlie);
    hg.add{value: 2 ether}(id);

    // Next required is ceil(2 ether * 1.1) = 2.2 ether
    assertEq(hg.required(id), 2.2 ether);
  }

  function test_RequiredRoundsUp() public {
    // 5% bump (500 bps) on odd amount: 1001 wei * 10500 / 10000 = 1051.05 -> 1052 wei
    vm.prank(alice);
    uint256 id = hg.open("Rounding Game", 10 minutes, 500, 0.01 ether);

    vm.deal(bob, 2000 ether);
    vm.prank(bob);
    hg.add{value: 1001 ether}(id);

    uint256 numerator = 1001 ether * 10500;
    uint128 expectedCeil = uint128((numerator + 9999) / 10000);
    assertEq(hg.required(id), expectedCeil);
  }

  function test_AddResetsCountdown() public {
    vm.prank(alice);
    uint256 id = hg.open("Countdown Game", 10 minutes, 1000, 0.1 ether);

    uint64 initialEnd = hg.gameOf(id).endsAt;

    // Warp forward 8 minutes
    vm.warp(block.timestamp + 8 minutes);
    assertEq(hg.timeLeft(id), 2 minutes);

    // Bob adds, resetting countdown to now + 10 minutes
    vm.prank(bob);
    hg.add{value: 0.1 ether}(id);

    uint64 newEnd = hg.gameOf(id).endsAt;
    assertEq(newEnd, block.timestamp + 10 minutes);
    assertTrue(newEnd > initialEnd);
    assertEq(hg.timeLeft(id), 10 minutes);
  }

  function test_AddNeverExtendsPastHardEnd() public {
    vm.prank(alice);
    uint256 id = hg.open("Hard End Game", 1 days, 1000, 0.1 ether);

    uint64 hardEnd = hg.gameOf(id).hardEnd;
    assertEq(hardEnd, block.timestamp + 30 days);

    // Keep adding every 12 hours so it stays alive up to 29 days
    for (uint256 i = 0; i < 58; i++) {
      vm.warp(block.timestamp + 12 hours);
      address p = (i % 2 == 0) ? bob : charlie;
      uint128 req = hg.required(id);
      vm.deal(p, req + 10 ether);
      vm.prank(p);
      hg.add{value: req}(id);
    }

    // Now warp to 6 hours before hardEnd
    vm.warp(hardEnd - 6 hours);
    address finalP = hg.gameOf(id).last == bob ? charlie : bob;
    uint128 finalReq = hg.required(id);
    vm.deal(finalP, finalReq + 10 ether);
    vm.prank(finalP);
    hg.add{value: finalReq}(id);

    assertEq(hg.gameOf(id).endsAt, hardEnd);
  }

  function test_AlreadyLastCannotAddAgain() public {
    vm.prank(alice);
    uint256 id = hg.open("Game", 10 minutes, 1000, 0.1 ether);

    vm.prank(bob);
    hg.add{value: 0.1 ether}(id);

    // Bob tries to add again
    vm.prank(bob);
    vm.expectRevert(Hourglass.AlreadyLast.selector);
    hg.add{value: 0.2 ether}(id);
  }

  function test_AddAfterEndReverts() public {
    vm.prank(alice);
    uint256 id = hg.open("Game", 10 minutes, 1000, 0.1 ether);

    vm.warp(block.timestamp + 10 minutes);

    vm.prank(bob);
    vm.expectRevert(Hourglass.Ended.selector);
    hg.add{value: 0.1 ether}(id);
  }

  function test_ClaimBeforeEndReverts_ArgsEndsAt() public {
    vm.prank(alice);
    uint256 id = hg.open("Game", 10 minutes, 1000, 0.1 ether);

    uint64 endsAt = hg.gameOf(id).endsAt;

    vm.expectRevert(abi.encodeWithSelector(Hourglass.StillRunning.selector, endsAt));
    hg.claim(id);
  }

  function test_LastAdderWinsWholePot() public {
    // Opener seeds 1 ether
    vm.prank(alice);
    uint256 id = hg.open{value: 1 ether}("Pot Game", 5 minutes, 1000, 0.5 ether);

    // Bob adds 0.5 ether
    vm.prank(bob);
    hg.add{value: 0.5 ether}(id);

    // Charlie adds 1 ether
    vm.prank(charlie);
    hg.add{value: 1 ether}(id);

    // Total pot = 1 + 0.5 + 1 = 2.5 ether
    assertEq(hg.gameOf(id).pot, 2.5 ether);

    // Time expires
    vm.warp(block.timestamp + 5 minutes);

    // Anyone triggers claim (e.g. David)
    vm.prank(david);
    hg.claim(id);

    // Charlie is winner and gets 2.5 ether in pending
    assertEq(hg.pending(charlie), 2.5 ether);

    // Charlie withdraws
    uint256 balBefore = charlie.balance;
    vm.prank(charlie);
    hg.withdraw();
    assertEq(charlie.balance - balBefore, 2.5 ether);
    assertEq(hg.pending(charlie), 0);
  }

  function test_NoAddsReturnsSeedToOpener() public {
    vm.prank(alice);
    uint256 id = hg.open{value: 3 ether}("Seed Game", 5 minutes, 1000, 0.1 ether);

    // Time expires with 0 adds
    vm.warp(block.timestamp + 5 minutes);

    hg.claim(id);

    // Opener gets seed back in pending
    assertEq(hg.pending(alice), 3 ether);

    vm.prank(alice);
    hg.withdraw();
    assertEq(hg.pending(alice), 0);
  }

  function test_ClaimOnce() public {
    vm.prank(alice);
    uint256 id = hg.open{value: 1 ether}("Game", 5 minutes, 1000, 0.1 ether);

    vm.warp(block.timestamp + 5 minutes);
    hg.claim(id);

    vm.expectRevert(Hourglass.AlreadyPaid.selector);
    hg.claim(id);
  }

  function test_AnyoneCanTriggerClaimButWinnerIsPaid() public {
    vm.prank(alice);
    uint256 id = hg.open("Game", 5 minutes, 1000, 0.1 ether);

    vm.prank(bob);
    hg.add{value: 0.1 ether}(id);

    vm.warp(block.timestamp + 5 minutes);

    // Outsider calls claim
    vm.prank(david);
    hg.claim(id);

    assertEq(hg.pending(bob), 0.1 ether);
    assertEq(hg.pending(david), 0);
  }

  function test_BadParamsRevert() public {
    // Empty name
    vm.expectRevert(Hourglass.BadParams.selector);
    hg.open("", 10 minutes, 1000, 0.1 ether);

    // Name > 48 bytes
    string memory longName = "1234567890123456789012345678901234567890123456789";
    vm.expectRevert(Hourglass.BadParams.selector);
    hg.open(longName, 10 minutes, 1000, 0.1 ether);

    // Window < 1 min or > 1 day
    vm.expectRevert(Hourglass.BadParams.selector);
    hg.open("Game", 59 seconds, 1000, 0.1 ether);

    vm.expectRevert(Hourglass.BadParams.selector);
    hg.open("Game", 1 days + 1 seconds, 1000, 0.1 ether);

    // Bump < 500 bps or > 5000 bps
    vm.expectRevert(Hourglass.BadParams.selector);
    hg.open("Game", 10 minutes, 499, 0.1 ether);

    vm.expectRevert(Hourglass.BadParams.selector);
    hg.open("Game", 10 minutes, 5001, 0.1 ether);

    // MinAdd < 0.01 ether or > 100_000 ether
    vm.expectRevert(Hourglass.BadParams.selector);
    hg.open("Game", 10 minutes, 1000, 0.009 ether);

    vm.expectRevert(Hourglass.BadParams.selector);
    hg.open("Game", 10 minutes, 1000, 100_001 ether);
  }

  function test_TooHighReverts_ArgsMax() public {
    vm.prank(alice);
    uint256 id = hg.open("Game", 10 minutes, 1000, 0.1 ether);

    vm.deal(bob, 200_000 ether);
    vm.prank(bob);
    vm.expectRevert(abi.encodeWithSelector(Hourglass.TooHigh.selector, 100_000 ether));
    hg.add{value: 100_001 ether}(id);
  }

  function test_ReentrantWithdrawBlocked() public {
    MaliciousActor mal = new MaliciousActor(hg);
    vm.deal(address(mal), 10 ether);

    vm.prank(address(mal));
    uint256 id = hg.open{value: 1 ether}("Mal Game", 5 minutes, 1000, 0.1 ether);

    vm.warp(block.timestamp + 5 minutes);
    hg.claim(id);

    mal.setAttackWithdraw(true);

    vm.prank(address(mal));
    vm.expectRevert(Hourglass.TransferFailed.selector);
    hg.withdraw();
  }

  function testFuzz_AddsEscalateAndPotConserves(uint8 numAdds) public {
    vm.assume(numAdds >= 1 && numAdds <= 15);

    vm.prank(alice);
    uint256 id = hg.open{value: 1 ether}("Fuzz Game", 1 hours, 1000, 0.1 ether);

    address[3] memory players = [bob, charlie, david];
    uint256 totalExpectedPot = 1 ether;
    address lastPlayer = address(0);

    for (uint8 i = 0; i < numAdds; i++) {
      address player = players[i % 3];
      if (player == lastPlayer) {
        player = players[(i + 1) % 3];
      }

      uint128 req = hg.required(id);
      uint128 addAmt = req + uint128(i) * 0.01 ether;

      vm.deal(player, addAmt + 10 ether);
      vm.prank(player);
      hg.add{value: addAmt}(id);

      totalExpectedPot += addAmt;
      lastPlayer = player;

      // Small time jump
      vm.warp(block.timestamp + 10 seconds);
    }

    assertEq(hg.gameOf(id).pot, totalExpectedPot);
    assertEq(address(hg).balance, totalExpectedPot);

    // End game
    vm.warp(block.timestamp + 1 hours + 1);
    hg.claim(id);

    assertEq(hg.pending(lastPlayer), totalExpectedPot);
  }

  function test_SpecificMutantKillers() public {
    // 1. Boundary checks: MAX_NAME_BYTES (48), MIN_WINDOW (60s), MAX_WINDOW (86400s), MIN_BUMP (500), MAX_BUMP (5000), MIN_ADD, MAX_ADD
    string memory name48 = "123456789012345678901234567890123456789012345678";
    vm.prank(alice);
    uint256 idMin = hg.open(name48, 1 minutes, 500, 0.01 ether);
    assertEq(hg.gameOf(idMin).minAdd, 0.01 ether);

    vm.prank(alice);
    uint256 idMax = hg.open(name48, 1 days, 5000, 100_000 ether);
    assertEq(hg.gameOf(idMax).minAdd, 100_000 ether);

    // 2. Exact MAX_ADD boundary test
    vm.deal(bob, 200_000 ether);
    vm.prank(bob);
    hg.add{value: 100_000 ether}(idMax);
    assertEq(hg.gameOf(idMax).lastAdd, 100_000 ether);

    // 3. Exact endsAt boundary test for timeLeft
    uint64 endsAt = hg.gameOf(idMax).endsAt;
    vm.warp(endsAt);
    assertEq(hg.timeLeft(idMax), 0);

    // 4. Pagination views
    (uint256[] memory ids, Hourglass.Game[] memory games, uint256 total) = hg.latest(0, 10);
    assertEq(ids.length, 2);
    assertEq(total, 2);
    assertEq(games[0].name, name48);

    // Pagination slice clamping
    (uint256[] memory sliceIds, , ) = hg.latest(1, 5);
    assertEq(sliceIds.length, 1);
    assertEq(sliceIds[0], 1);

    // Offset out of range
    (uint256[] memory emptyIds, , ) = hg.latest(5, 10);
    assertEq(emptyIds.length, 0);

    // Invalid game queries
    vm.expectRevert(Hourglass.GameNotFound.selector);
    hg.gameOf(0);
    vm.expectRevert(Hourglass.GameNotFound.selector);
    hg.required(0);
    vm.expectRevert(Hourglass.GameNotFound.selector);
    hg.timeLeft(0);
    vm.expectRevert(Hourglass.GameNotFound.selector);
    hg.gameOf(999);
  }
}
