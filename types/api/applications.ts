export type ApplicationRecord = {
  id: string; tenderId: string; title: string; status: string;
  price: number | null; deliveryDays: number | null;
  deliveryTimeline: string; proposal: string; additionalNotes: string;
  vendorName: string; category: string; procurementType: string; maximumBudget: number | null;
  deadline: string; location: string; submittedAt: string;
  itemQuotes: { id: string; item: string; quantity: number | null; unit: string; unitPrice: number | null; totalPrice: number | null }[];
  requirementResponses: { id: string; requirement: string; requiredValue: string; response: string }[];
  responses: Record<string, string>;
  documents: { id: string; name: string; filename: string; url: string | null; format: string; sizeBytes: number | null }[];
};

export type TenderApplicationPayload = {
  item_quotes: { tender_item_id: number; unit_price: number }[];
  requirement_responses: { requirement_id: number; response: string }[];
  delivery_timeline: string;
  proposal: string;
  additional_notes: string;
};
