export type WalletRecord = { availableBalance: string; currency: string };
export type WithdrawalInput = { amount: string; bank_name: string; account_name: string; account_number: string };
export type WithdrawalRecord = { id: string; amount: string; status: string; bankName: string; accountName: string; accountNumber: string; createdAt: string };
