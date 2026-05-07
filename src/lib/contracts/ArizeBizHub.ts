// Auto-generated ABI for ArizeBizHub
// Do not edit manually - regenerate using: node scripts/export-abis.js

export const arizeBizHubAbi = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "buyPackage",
    "inputs": [
      {
        "name": "_amount",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "checkRank",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimROI",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimSalary",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getDirectReferrals",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "ids",
        "type": "uint32[]",
        "internalType": "uint32[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPendingROI",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "pending",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPoolMetrics",
    "inputs": [],
    "outputs": [
      {
        "name": "poolBalance",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "invested",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "withdrawn",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSortedLegBusinesses",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "power",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "weaker",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "weakest",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTeamInfo",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "counts",
        "type": "uint32[10]",
        "internalType": "uint32[10]"
      },
      {
        "name": "business",
        "type": "uint128[10]",
        "internalType": "uint128[10]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserInfo",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "userId",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "referrerId",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "directCount",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "availableBalance",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "totalWithdrawn",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "totalRoi",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "totalReferral",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "totalLevel",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "totalSalary",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserLevel",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserPackages",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct IArizeBizV2.PackageInfo[]",
        "components": [
          {
            "name": "amount",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "used",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "roiUsed",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "startTime",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "daysClaimed",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "dailyRoi",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "isActive",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "packageType",
            "type": "uint8",
            "internalType": "uint8"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserSalaryInfo",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "totalPerDay",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "pendingAmount",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "activeSlots",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isUserRegistered",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerUser",
    "inputs": [
      {
        "name": "_referrerId",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_amount",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setV2",
    "inputs": [
      {
        "name": "_v2",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "v2",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IArizeBizV2"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {
        "name": "_amount",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

export default arizeBizHubAbi;
