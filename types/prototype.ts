export type Role = 'buyer' | 'vendor';

export type Account = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization: string;
  documents: Record<string, string>;
  categories: string[];
  onboarded: boolean;
};

export type Requirement = { id: string; label: string; value: string };

export type Tender = {
  id: string;
  buyerId: string;
  title: string;
  description: string;
  category: string;
  type: string;
  budget: number;
  deadline: string;
  location: string;
  items: { id?: string; name: string; quantity: number; unit: string }[];
  requirements: Requirement[];
  documents: string[];
  status: 'open' | 'awarded' | 'completed';
  winnerId?: string;
};

export type Application = {
  id: string;
  tenderId: string;
  vendorId: string;
  price: number;
  deliveryDays: number;
  documents: Record<string, string>;
  responses: Record<string, string>;
  status: 'submitted' | 'selected' | 'not_selected';
  analysis?: {
    score: number;
    compliance: number;
    risk: 'Low' | 'Medium' | 'High';
    findings: string[];
  };
};

export type Order = {
  id: string;
  tenderId: string;
  applicationId: string;
  status:
    | 'awaiting_payment'
    | 'funded'
    | 'shipped'
    | 'release_pending'
    | 'completed'
    | 'issue_reported';
  tracking?: string;
  carrier?: string;
};

export type DB = {
  accounts: Account[];
  tenders: Tender[];
  applications: Application[];
  orders: Order[];
  notifications: {
    id: string;
    accountId: string;
    message: string;
    read: boolean;
  }[];
};
