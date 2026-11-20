import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ProductMedia } from "@/components/listings/product-card";
import { PreviewNotice } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mockListings } from "@/lib/mock-data";
import { formatINR } from "@/lib/money";
import { getPublishedListing } from "@/server/services/published-listings";
import { PublishedItem } from "@/components/listings/published-item";

export const dynamic = "force-dynamic";
export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = mockListings.find(item=>item.id === id);
  if (!listing) {
    const published = await getPublishedListing(id);
    if (!published) notFound();
    return <PublishedItem listing={published}/>;
  }
  return <Container><div className="page-heading"><Link className="text-link" href="/explore">← Back to explore</Link></div><div className="page-content"><PreviewNotice/><div className="detail-grid"><div><ProductMedia listing={listing} priority/><div className="details-panel"><h2>A few things to know.</h2><p>{listing.description}</p><p className="text-sm">Condition: {listing.condition}</p><p className="text-sm">Approximate pickup area: {listing.area}, Vijayawada. Exact addresses are never public.</p></div></div><div><p className="eyebrow">{listing.category}</p><h1>{listing.title}</h1><p>Sample owner · No real profile connected</p><Card><h2>{formatINR(listing.dailyRatePaise)} <span className="text-base font-sans">/ day</span></h2><dl><div className="definition-row"><dt>Refundable deposit</dt><dd>{formatINR(listing.depositPaise)}</dd></div><div className="definition-row"><dt>Platform fee</dt><dd>{formatINR(0)}</dd></div><div className="definition-row"><dt>Availability</dt><dd>Not connected</dd></div></dl><p className="text-xs mt-5">Rental totals will be shown after dates and day-counting rules are confirmed. This preview cannot reserve items.</p><div className="detail-actions"><Button disabled>Request rental — coming later</Button><Button disabled variant="secondary">Message owner</Button></div></Card></div></div></div></Container>;
}
