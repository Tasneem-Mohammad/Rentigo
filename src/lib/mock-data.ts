import type { ListingPreview } from "@/types/listing";
import { editorialListings, featuredListing } from "./editorial-data";

// Fictional display data. No owner identities, exact addresses, or availability claims.
export const mockListings: ListingPreview[] = [
  { id: "cordless-drill", title: "A little help for your next project", category: "Tools", area: "Benz Circle", dailyRatePaise: 25000, depositPaise: 150000, condition: "Working well · owner-reported example", description: "Cordless drill with a selection of bits and a carrying case. A practical companion for a weekend of small home projects.", illustration: "drill" },
  { id: "weekend-tent", title: "Room for a weekend outdoors", category: "Outdoor & leisure", area: "Patamata", dailyRatePaise: 40000, depositPaise: 200000, condition: "Working well · owner-reported example", description: "A two-person tent with a groundsheet and pegs. Sample listing for exploring a future local rental experience.", illustration: "tent" },
  { id: "home-projector", title: "Make a night of it", category: "Events", area: "Moghalrajpuram", dailyRatePaise: 65000, depositPaise: 300000, condition: "Working well · owner-reported example", description: "Compact projector with power cable and HDMI lead, ready for a film night at home. Compatibility would be discussed with the owner.", illustration: "projector" },
  featuredListing,
  ...editorialListings,
];
