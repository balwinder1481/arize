export interface Pkg {
  amount:      bigint;
  used:        bigint;
  roiUsed:     bigint;
  startTime:   number;
  daysClaimed: number;
  dailyRoi:    number;
  isActive:    boolean;
  packageType: number;
}

export interface IncomeData {
  availableBal:   bigint;
  totalWithdrawn: bigint;
  totalRoi:       bigint;
  totalReferral:  bigint;
  totalLevel:     bigint;
  totalSalary:    bigint;
}

export interface UserInfo {
  userId:       bigint;
  referrerId:   bigint;
  directCount:  bigint;
  totalInvested: bigint;
}

export interface TeamData {
  counts:   number[];
  business: bigint[];
}
