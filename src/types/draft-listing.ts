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
  status: "draft";
  version: number;
  updatedAt: string;
}
