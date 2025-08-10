export interface EventModel {
  id: string;
  title: string;
  description?: string;
  startAt: string;   // ISO datetime
  endAt?: string;
  timezone?: string;
  venue?: {
    id?: string;
    name?: string;
    address1?: string;
    city?: string;
  };
  primaryImage?: string;
  coverImage?: string;
  organizerId?: string;
  organizerName?: string;
  isPublic?: boolean; // default true if unknown
  createdAt?: string;
  updatedAt?: string;
  raw?: any; // original payload (for debugging / future fields)
}
