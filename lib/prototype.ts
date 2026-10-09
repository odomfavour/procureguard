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
  items: { name: string; quantity: number; unit: string }[];
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
export const seed: DB = {
  accounts: [
    {
      id: 'buyer-demo',
      name: 'Ada Okafor',
      email: 'buyer@demo.com',
      role: 'buyer',
      organization: 'Apex Holdings',
      documents: {},
      categories: [],
      onboarded: true,
    },
    {
      id: 'vendor-demo',
      name: 'Tunde Bello',
      email: 'vendor@demo.com',
      role: 'vendor',
      organization: 'Prime Supply Nigeria',
      documents: {
        'CAC Certificate': 'cac-certificate.pdf',
        'CAC Status Report': 'cac-status.pdf',
        'Tax Registration Evidence': 'tax-evidence.pdf',
        'Company Profile': 'company-profile.pdf',
        'Product / Service Catalogue': 'catalogue.pdf',
      },
      categories: ['Office supplies', 'IT equipment'],
      onboarded: true,
    },
  ],
  tenders: [
    {
      id: 'TND-1001',
      buyerId: 'buyer-demo',
      title: 'Office furniture and workstation supply',
      description: 'Supply quality office furniture to our Lagos office.',
      category: 'Office furniture',
      type: 'Goods',
      budget: 25000000,
      deadline: '2026-12-20',
      location: 'Lagos',
      items: [
        { name: 'Ergonomic office chairs', quantity: 50, unit: 'units' },
        { name: 'Office desks', quantity: 20, unit: 'units' },
      ],
      requirements: [{ id: 'r1', label: 'Warranty', value: 'Minimum 2 years' }],
      documents: [
        'CAC Certificate',
        'Quotation',
        'Product / Service Catalogue',
      ],
      status: 'open',
    },
    {
      id: 'TND-1002',
      buyerId: 'buyer-demo',
      title: 'Supply of construction materials',
      description: 'Cement, steel and roofing materials for a new facility.',
      category: 'Construction',
      type: 'Goods',
      budget: 60000000,
      deadline: '2026-12-30',
      location: 'Abuja',
      items: [{ name: 'Cement bags', quantity: 500, unit: 'bags' }],
      requirements: [{ id: 'r2', label: 'Cement grade', value: '42.5R' }],
      documents: ['Quotation', 'Tax Registration Evidence'],
      status: 'open',
    },
  ],
  applications: [],
  orders: [],
  notifications: [],
};
const KEY = 'procureguard-prototype-v2';
const SESSION = 'procureguard-session-v2';
export const uid = () =>
  `PG-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
export function readDB(): DB {
  if (typeof window === 'undefined') return seed;
  try {
    const v = localStorage.getItem(KEY);
    return v ? (JSON.parse(v) as DB) : structuredClone(seed);
  } catch {
    return structuredClone(seed);
  }
}
export function saveDB(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event('pg-updated'));
}
export function session() {
  return typeof window === 'undefined' ? null : localStorage.getItem(SESSION);
}
export function login(id: string) {
  localStorage.setItem(SESSION, id);
  window.dispatchEvent(new Event('pg-updated'));
}
export function logout() {
  localStorage.removeItem(SESSION);
  window.dispatchEvent(new Event('pg-updated'));
}
export function notify(db: DB, id: string, message: string) {
  db.notifications.unshift({ id: uid(), accountId: id, message, read: false });
}
export function money(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}
export function analyze(
  a: Application,
  t: Tender
): NonNullable<Application['analysis']> {
  const missing = t.documents.filter((d) => !a.documents[d]);
  const over = a.price > t.budget;
  const unanswered = t.requirements.filter((r) => !a.responses[r.id]);
  const findings = [
    ...missing.map((d) => `Missing required document: ${d}`),
    ...unanswered.map((r) => `Missing requirement response: ${r.label}`),
    ...(over
      ? [`Bid exceeds stated budget by ${money(a.price - t.budget)}`]
      : []),
  ];
  const compliance = Math.round(
    (100 *
      (t.documents.length -
        missing.length +
        t.requirements.length -
        unanswered.length +
        (over ? 0 : 1))) /
      (t.documents.length + t.requirements.length + 1)
  );
  const score = Math.max(15, Math.min(98, Math.round(compliance * 0.85 + 13)));
  return {
    score,
    compliance,
    risk: score >= 80 ? 'Low' : score >= 60 ? 'Medium' : 'High',
    findings: findings.length
      ? findings
      : [
          'No obvious completeness or budget issues in submitted information. This is a simulated assessment, not independent document verification.',
        ],
  };
}

export function snapshot(): string | null {
  return JSON.stringify([
    localStorage.getItem(KEY),
    localStorage.getItem(SESSION),
  ]);
}
