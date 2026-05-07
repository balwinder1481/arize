export interface ContractConfig {
  totalUsers:     number;
  totalInvested:  bigint;
  totalWithdrawn: bigint;
  contractBal:    bigint;
  dRoiPer:        number;
  directRefPer:   number;
  minInvest:      bigint;
  minWithdraw:    bigint;
  withdrawFee:    number;
  workingMult:    number;
  roiMult:        number;
  dayLength:      number;
}

export interface LookupResult {
  id:     bigint;
  addr:   string;
  income: {
    availableBalance: bigint;
    totalWithdrawn:   bigint;
    totalRoi:         bigint;
    totalReferral:    bigint;
    totalLevel:       bigint;
    totalSalary:      bigint;
  };
  info: [number, boolean, bigint]; // [referrerId, isRegistered, directReferrals]
}
