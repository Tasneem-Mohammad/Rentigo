export interface ListingPreview {
  id: string;
  title: string;
  category: string;
  area: string;
  dailyRatePaise: number;
  depositPaise: number;
  condition: string;
  description: string;
  illustration: "drill" | "tent" | "projector";
  image?: { src: string; alt: string };
  editorialLabel?: string;
}
