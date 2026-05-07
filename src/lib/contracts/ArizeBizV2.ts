// Auto-generated ABI for ArizeBizV2
// Do not edit manually - regenerate using: node scripts/export-abis.js

export const arizeBizV2Abi = [
  {
    "type": "function",
    "name": "LEVEL_BIZ_THRESHOLD",
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
    "name": "UNIT_DIVIDER",
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
    "name": "addrToId",
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
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "adminDeposit",
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
    "name": "allUserIds",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "bonanzaCount",
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
    "name": "bonanzaIsPaid",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
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
    "name": "bonanzaNameExists",
    "inputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
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
    "name": "changeWallet",
    "inputs": [
      {
        "name": "_old",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_new",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "checkBonanzaQualification",
    "inputs": [
      {
        "name": "_bonanzaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "qualifiedTier",
        "type": "int256",
        "internalType": "int256"
      },
      {
        "name": "rewardAmount",
        "type": "uint128",
        "internalType": "uint128"
      },
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
    "name": "checkRank",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "checkRank",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimROI",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
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
    "name": "claimSalary",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "computeLevel",
    "inputs": [
      {
        "name": "_uid",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "level",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createBonanza",
    "inputs": [
      {
        "name": "_name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_startDate",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_endDate",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_directTargets",
        "type": "uint128[]",
        "internalType": "uint128[]"
      },
      {
        "name": "_teamTargets",
        "type": "uint128[]",
        "internalType": "uint128[]"
      },
      {
        "name": "_rewardAmounts",
        "type": "uint128[]",
        "internalType": "uint128[]"
      }
    ],
    "outputs": [
      {
        "name": "bonanzaId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "dRoiPer",
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
    "name": "dailyStats",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "totalDeposits",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "totalWithdrawals",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "dayLength",
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
    "name": "directRefPer",
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
    "name": "directReferrals",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "emergencyWithdraw",
    "inputs": [
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
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
    "name": "emergencyWithdrawAll",
    "inputs": [
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "firstUser",
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
    "name": "getBonanza",
    "inputs": [
      {
        "name": "_id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "startDate",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "endDate",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "directTargets",
        "type": "uint128[]",
        "internalType": "uint128[]"
      },
      {
        "name": "teamTargets",
        "type": "uint128[]",
        "internalType": "uint128[]"
      },
      {
        "name": "rewardAmounts",
        "type": "uint128[]",
        "internalType": "uint128[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDailyStats",
    "inputs": [
      {
        "name": "_dayKey",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "deposits",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "withdrawals",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDailyStatsRange",
    "inputs": [
      {
        "name": "_fromDay",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_toDay",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "deposits",
        "type": "uint128[]",
        "internalType": "uint128[]"
      },
      {
        "name": "withdrawals",
        "type": "uint128[]",
        "internalType": "uint128[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getLegBusiness",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_dirId",
        "type": "uint32",
        "internalType": "uint32"
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
    "name": "getPendingSalary",
    "inputs": [
      {
        "name": "_uid",
        "type": "uint32",
        "internalType": "uint32"
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
    "name": "getRankSalaries",
    "inputs": [
      {
        "name": "_uid",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[10]",
        "internalType": "struct ArizeBizV2.SalaryInfo[10]",
        "components": [
          {
            "name": "salaryPerDay",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "qualifiedAt",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "expiry",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "lastClaimed",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
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
    "name": "grantPackage",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_amount",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "_dailyRoi",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "idToAddr",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
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
    "name": "incomeInfo",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
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
    "name": "initialize",
    "inputs": [
      {
        "name": "_usdt",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_firstUser",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_feeReceiver",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "initialized",
    "inputs": [],
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
    "name": "invest",
    "inputs": [
      {
        "name": "_forUserId",
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
    "name": "invest",
    "inputs": [
      {
        "name": "_forUser",
        "type": "address",
        "internalType": "address"
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
    "name": "investMultiple",
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
    "name": "lastWithdrawDay",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
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
    "name": "legBusiness",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
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
    "name": "levelPer",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
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
    "name": "maxInvest",
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
    "name": "minInvest",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint96",
        "internalType": "uint96"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "minWithdraw",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint96",
        "internalType": "uint96"
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
    "name": "packages",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
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
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "payBonanza",
    "inputs": [
      {
        "name": "_bonanzaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "powerLegPct",
    "inputs": [],
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
    "name": "register",
    "inputs": [
      {
        "name": "_forUser",
        "type": "address",
        "internalType": "address"
      },
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
    "name": "roiMultiplier",
    "inputs": [],
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
    "name": "setDailyRoi",
    "inputs": [
      {
        "name": "_bps",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDayLength",
    "inputs": [
      {
        "name": "_val",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDirectRefPer",
    "inputs": [
      {
        "name": "_bps",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setFeeReceiver",
    "inputs": [
      {
        "name": "_new",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setInvestMultiple",
    "inputs": [
      {
        "name": "_val",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setLevelPer",
    "inputs": [
      {
        "name": "_p",
        "type": "uint16[10]",
        "internalType": "uint16[10]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setMaxInvest",
    "inputs": [
      {
        "name": "_val",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setMinInvest",
    "inputs": [
      {
        "name": "_val",
        "type": "uint96",
        "internalType": "uint96"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setMinWithdraw",
    "inputs": [
      {
        "name": "_val",
        "type": "uint96",
        "internalType": "uint96"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setOwner",
    "inputs": [
      {
        "name": "_new",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setRoiMultiplier",
    "inputs": [
      {
        "name": "_val",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setWithdrawFee",
    "inputs": [
      {
        "name": "_bps",
        "type": "uint16",
        "internalType": "uint16"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setWorkingMultiplier",
    "inputs": [
      {
        "name": "_val",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalAvailableBalance",
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
    "name": "totalInvested",
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
    "name": "totalUsers",
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
    "name": "totalWithdrawFee",
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
    "name": "totalWithdrawn",
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
    "name": "txHistory",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "amount",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "from",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "to",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "time",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "txType",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "updateBonanza",
    "inputs": [
      {
        "name": "_bonanzaId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_startDate",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_endDate",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_active",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "_directTargets",
        "type": "uint128[]",
        "internalType": "uint128[]"
      },
      {
        "name": "_teamTargets",
        "type": "uint128[]",
        "internalType": "uint128[]"
      },
      {
        "name": "_rewardAmounts",
        "type": "uint128[]",
        "internalType": "uint128[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "updateLegPercentages",
    "inputs": [
      {
        "name": "_power",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "_weaker",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "_weakest",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "usdt",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "userInfo",
    "inputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "referrerId",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "isRegistered",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "directReferrals",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "weakerLegPct",
    "inputs": [],
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
    "name": "weakestLegPct",
    "inputs": [],
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
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {
        "name": "_user",
        "type": "address",
        "internalType": "address"
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
    "name": "withdrawFee",
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
    "name": "withdrawalFeeReceiver",
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
    "name": "workingMultiplier",
    "inputs": [],
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
    "name": "adminRegister",
    "inputs": [
      { "name": "_forUser",   "type": "address", "internalType": "address" },
      { "name": "_referrerId","type": "uint32",  "internalType": "uint32"  },
      { "name": "_amount",    "type": "uint128", "internalType": "uint128" },
      { "name": "_dailyRoi",  "type": "uint16",  "internalType": "uint16"  }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getTxCount",
    "inputs": [{ "name": "_uid", "type": "uint32", "internalType": "uint32" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTxHistory",
    "inputs": [
      { "name": "_uid",    "type": "uint32",  "internalType": "uint32"  },
      { "name": "_offset", "type": "uint256", "internalType": "uint256" },
      { "name": "_limit",  "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "records",
        "type": "tuple[]",
        "internalType": "struct ArizeBizV2.TxRecord[]",
        "components": [
          { "name": "amount", "type": "uint128", "internalType": "uint128" },
          { "name": "from",   "type": "uint32",  "internalType": "uint32"  },
          { "name": "to",     "type": "uint32",  "internalType": "uint32"  },
          { "name": "time",   "type": "uint32",  "internalType": "uint32"  },
          { "name": "txType", "type": "uint8",   "internalType": "uint8"   }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "BonanzaCreated",
    "inputs": [
      {
        "name": "bonanzaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "name",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "startDate",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "endDate",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "BonanzaPaid",
    "inputs": [
      {
        "name": "bonanzaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "rewardAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "BonanzaUpdated",
    "inputs": [
      {
        "name": "bonanzaId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LevelIncome",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "level",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
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
    "name": "PackagePurchased",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "investmentId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ROIClaimed",
    "inputs": [
      {
        "name": "user",
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
    "name": "ReferralIncome",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "level",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
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
    "name": "Registration",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "referrer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WeeklySalaryClaimed",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "weekIndex",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
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
    "name": "Withdrawal",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "fee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "netAmount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AboveMaximumInvestment",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ActivePackageExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ActivePackageRequired",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlreadyInitialized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlreadyRegistered",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BelowLastPackageAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BelowMinimumInvestment",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BelowMinimumWithdrawal",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BonanzaAlreadyPaid",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BonanzaDoesNotExist",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BonanzaEmptyTiers",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BonanzaNameAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BonanzaNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BonanzaTierLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CannotReferYourself",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DailyWithdrawalLimitReached",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientBalance",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidBonanzaDates",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidBonanzaPercents",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidFirstUser",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidReferrer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidUSDTToken",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MustBeMultipleOfInvestmentMultiple",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoROIAvailable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoSalaryToClaim",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotQualifiedForBonanza",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UserNotRegistered",
    "inputs": []
  }
] as const;

export default arizeBizV2Abi;
