export type TenderSummary = {
  id: string;
  title: string;
  category: string;
  type: string;
  location: string;
  budget: number;
  deadline: string;
  status: string;
};

export type TenderPage = { tenders: TenderSummary[]; total?: number };

export type CreateTenderPayload = {
  title: string;
  category: string;
  procurement_type: string;
  maximum_budget: number;
  submission_deadline: string;
  delivery_location: string;
  optional_description: string;
  items: { item: string; quantity: number; unit: string }[];
  product_requirements: { requirement_name: string; value: string }[];
  required_documents: { name: string; description: string }[];
  optional_notes: string;
};
