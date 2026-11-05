// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

/**
 * @title Hourglass
 * @notice A last-one-standing chicken game with an escalating entry price.
 *         When the countdown reaches zero, the last person to add takes the whole pot.
 */
contract Hourglass {
  // --- Constants ---
  uint256 public constant MAX_NAME_BYTES = 48;
  uint32 public constant MIN_WINDOW = 1 minutes;
  uint32 public constant MAX_WINDOW = 1 days;
  uint16 public constant MIN_BUMP_BPS = 500;   // 5.00%
  uint16 public constant MAX_BUMP_BPS = 5000;  // 50.00%
  uint128 public constant MIN_ADD = 0.01 ether;
  uint128 public constant MAX_ADD = 100_000 ether;
  uint64 public constant MAX_GAME = 30 days;
  uint256 public constant MAX_PAGE = 50;

  // --- Structs ---
  struct Game {
    address opener;
    address last;
    uint64 endsAt;
    uint64 hardEnd;
    uint32 windowSecs;
    uint16 bumpBps;
    uint32 plays;
    bool paid;
    uint128 pot;
    uint128 lastAdd;
    uint128 minAdd;
    string name;
  }

  // --- Storage ---
  mapping(uint256 => Game) private _games;
  mapping(address => uint256) public pending;
  uint256 public gameCount;

  // Reentrancy guard
  uint256 private _status;
  uint256 private constant _NOT_ENTERED = 1;
  uint256 private constant _ENTERED = 2;

  // --- Errors ---
  error BadParams();
  error GameNotFound();
  error Ended();
  error AlreadyLast();
  error TooLow(uint128 required);
  error TooHigh(uint128 max);
  error StillRunning(uint64 endsAt);
  error AlreadyPaid();
  error NothingToWithdraw();
  error TransferFailed();
  error ReentrancyGuard();

  // --- Events ---
  event Opened(
    uint256 indexed id,
    address indexed opener,
    string name,
    uint32 windowSecs,
    uint16 bumpBps,
    uint128 minAdd,
    uint128 seed,
    uint64 endsAt,
    uint64 hardEnd
  );
  event Added(
    uint256 indexed id,
    address indexed who,
    uint128 amount,
    uint128 pot,
    uint64 endsAt
  );
  event Won(
    uint256 indexed id,
    address indexed winner,
    uint128 pot,
    uint32 plays
  );
  event Withdrawn(address indexed to, uint256 amount);

  modifier nonReentrant() {
    if (_status == _ENTERED) revert ReentrancyGuard();
    _status = _ENTERED;
    _;
    _status = _NOT_ENTERED;
  }

  constructor() {
    _status = _NOT_ENTERED;
  }

  /**
   * @notice Open a new Hourglass game.
   * @param name Descriptive name of game (<= 48 bytes)
   * @param windowSecs Countdown duration after each add (1 min to 1 day)
   * @param bumpBps Minimum bump bps over previous add (500 to 5000 bps)
   * @param minAdd Minimum first add (0.01 ether to 100,000 ether)
   */
  function open(
    string calldata name,
    uint32 windowSecs,
    uint16 bumpBps,
    uint128 minAdd
  ) external payable returns (uint256 id) {
    bytes memory nameBytes = bytes(name);
    if (nameBytes.length == 0 || nameBytes.length > MAX_NAME_BYTES) revert BadParams();
    if (windowSecs < MIN_WINDOW || windowSecs > MAX_WINDOW) revert BadParams();
    if (bumpBps < MIN_BUMP_BPS || bumpBps > MAX_BUMP_BPS) revert BadParams();
    if (minAdd < MIN_ADD || minAdd > MAX_ADD) revert BadParams();
    if (msg.value > MAX_ADD) revert TooHigh(MAX_ADD);

    id = ++gameCount;
    uint64 nowSec = uint64(block.timestamp);
    uint64 endsAt = nowSec + windowSecs;
    uint64 hardEnd = nowSec + MAX_GAME;

    _games[id] = Game({
      opener: msg.sender,
      last: address(0),
      endsAt: endsAt,
      hardEnd: hardEnd,
      windowSecs: windowSecs,
      bumpBps: bumpBps,
      plays: 0,
      paid: false,
      pot: uint128(msg.value),
      lastAdd: 0,
      minAdd: minAdd,
      name: name
    });

    emit Opened(
      id,
      msg.sender,
      name,
      windowSecs,
      bumpBps,
      minAdd,
      uint128(msg.value),
      endsAt,
      hardEnd
    );
  }

  /**
   * @notice Add to the pot and reset the countdown.
   * @param id The game ID
   */
  function add(uint256 id) external payable {
    if (id == 0 || id > gameCount) revert GameNotFound();
    Game storage g = _games[id];

    if (block.timestamp >= g.endsAt) revert Ended();
    if (g.last == msg.sender) revert AlreadyLast();

    uint128 req = requiredOf(g);
    if (msg.value < req) revert TooLow(req);
    if (msg.value > MAX_ADD) revert TooHigh(MAX_ADD);

    uint128 addedAmt = uint128(msg.value);
    g.pot += addedAmt;
    g.last = msg.sender;
    g.lastAdd = addedAmt;
    g.plays += 1;

    uint64 newEnd = uint64(block.timestamp) + g.windowSecs;
    if (newEnd > g.hardEnd) {
      newEnd = g.hardEnd;
    }
    g.endsAt = newEnd;

    emit Added(id, msg.sender, addedAmt, g.pot, newEnd);
  }

  /**
   * @notice Settle and claim the pot once time has run out.
   * @param id The game ID
   */
  function claim(uint256 id) external {
    if (id == 0 || id > gameCount) revert GameNotFound();
    Game storage g = _games[id];

    if (block.timestamp < g.endsAt) revert StillRunning(g.endsAt);
    if (g.paid) revert AlreadyPaid();

    g.paid = true;
    address winner = g.last == address(0) ? g.opener : g.last;
    uint128 potWon = g.pot;

    pending[winner] += potWon;

    emit Won(id, winner, potWon, g.plays);
  }

  /**
   * @notice Pull payment of pending winnings / seed refunds.
   */
  function withdraw() external nonReentrant {
    uint256 amount = pending[msg.sender];
    if (amount == 0) revert NothingToWithdraw();

    pending[msg.sender] = 0;

    (bool success, ) = msg.sender.call{value: amount}("");
    if (!success) revert TransferFailed();

    emit Withdrawn(msg.sender, amount);
  }

  // --- View helpers ---

  function requiredOf(Game storage g) internal view returns (uint128) {
    if (g.last == address(0)) {
      return g.minAdd;
    }
    // Ceil division: ceil(lastAdd * (10_000 + bumpBps) / 10_000)
    uint256 numerator = uint256(g.lastAdd) * (10_000 + g.bumpBps);
    return uint128((numerator + 9_999) / 10_000);
  }

  function required(uint256 id) external view returns (uint128) {
    if (id == 0 || id > gameCount) revert GameNotFound();
    return requiredOf(_games[id]);
  }

  function gameOf(uint256 id) external view returns (Game memory) {
    if (id == 0 || id > gameCount) revert GameNotFound();
    return _games[id];
  }

  function timeLeft(uint256 id) external view returns (uint64) {
    if (id == 0 || id > gameCount) revert GameNotFound();
    Game storage g = _games[id];
    if (block.timestamp >= g.endsAt) return 0;
    return g.endsAt - uint64(block.timestamp);
  }

  /**
   * @notice Return latest games slice in reverse order.
   */
  function latest(uint256 offset, uint256 count)
    external
    view
    returns (
      uint256[] memory ids,
      Game[] memory games,
      uint256 total
    )
  {
    total = gameCount;
    if (count > MAX_PAGE) {
      count = MAX_PAGE;
    }
    if (offset >= total || count == 0) {
      return (new uint256[](0), new Game[](0), total);
    }
    if (offset + count > total) {
      count = total - offset;
    }

    ids = new uint256[](count);
    games = new Game[](count);

    for (uint256 i = 0; i < count; i++) {
      uint256 id = total - (offset + i);
      ids[i] = id;
      games[i] = _games[id];
    }
  }
}
