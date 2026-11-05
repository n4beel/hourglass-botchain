export const BOTCHAIN_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "MAX_ADD",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_BUMP_BPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_GAME",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_NAME_BYTES",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_PAGE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_WINDOW",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_ADD",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_BUMP_BPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_WINDOW",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "add",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "claim",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "gameCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "gameOf",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct Hourglass.Game",
        "components": [
          {
            "name": "opener",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "last",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "endsAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "hardEnd",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "windowSecs",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "bumpBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "plays",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "paid",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "pot",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "lastAdd",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "minAdd",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "latest",
    "inputs": [
      {
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "ids",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "games",
        "type": "tuple[]",
        "internalType": "struct Hourglass.Game[]",
        "components": [
          {
            "name": "opener",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "last",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "endsAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "hardEnd",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "windowSecs",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "bumpBps",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "plays",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "paid",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "pot",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "lastAdd",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "minAdd",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "name",
            "type": "string",
            "internalType": "string"
          }
        ]
      },
      {
        "name": "total",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "open",
    "inputs": [
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "windowSecs",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "bumpBps",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "minAdd",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "outputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "pending",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "required",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "timeLeft",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Added",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "who",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint128",
        "indexed": false,
        "internalType": "uint128"
      },
      {
        "name": "pot",
        "type": "uint128",
        "indexed": false,
        "internalType": "uint128"
      },
      {
        "name": "endsAt",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Opened",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "opener",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "windowSecs",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "bumpBps",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "minAdd",
        "type": "uint128",
        "indexed": false,
        "internalType": "uint128"
      },
      {
        "name": "seed",
        "type": "uint128",
        "indexed": false,
        "internalType": "uint128"
      },
      {
        "name": "endsAt",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "hardEnd",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Withdrawn",
    "inputs": [
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Won",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "winner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "pot",
        "type": "uint128",
        "indexed": false,
        "internalType": "uint128"
      },
      {
        "name": "plays",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyLast",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlreadyPaid",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadParams",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Ended",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GameNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NothingToWithdraw",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuard",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StillRunning",
    "inputs": [
      {
        "name": "endsAt",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "TooHigh",
    "inputs": [
      {
        "name": "max",
        "type": "uint128",
        "internalType": "uint128"
      }
    ]
  },
  {
    "type": "error",
    "name": "TooLow",
    "inputs": [
      {
        "name": "required",
        "type": "uint128",
        "internalType": "uint128"
      }
    ]
  },
  {
    "type": "error",
    "name": "TransferFailed",
    "inputs": []
  }
] as const;
