export interface DraftPhoto { id: string; url: string; width: number; height: number; }
export interface DraftListing {
  id: string;
  title: string;
  category: string;
  description: string;
  condition: string;
  conditionNote: string;
  dailyRatePaise: number | null;
  approximateValuePaise: number | null;
  depositPaise: number | null;
  areaLabel: string;
  availableFrom: string | null;
  availableUntil: string | null;
  status: "draft" | "active";
  version: number;
  updatedAt: string;
  photos: DraftPhoto[];
  pendingPhotoIds: string[];
}
