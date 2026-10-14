export type PaymentRecord = {
  id: number | string; reference: string; status: string; gateway: string;
  amount: number; email: string; description: string | null;
  created_at: string | null; updated_at: string | null;
};
