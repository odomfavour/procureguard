export type OrderRecord = {
  id: string; title: string; buyer: string; vendor: string; amount: number | null;
  status: string; escrowStatus: string; tracking: string; note: string; createdAt: string;
};
