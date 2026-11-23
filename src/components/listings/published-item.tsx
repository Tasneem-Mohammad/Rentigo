import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/money";
import type { getPublishedListing } from "@/server/services/published-listings";

export function PublishedItem({ listing }: { listing: NonNullable<Awaited<ReturnType<typeof getPublishedListing>>> }) {
  return <Container><div className="page-heading"><Link className="text-link" href="/explore">← Explore rentals</Link><p className="auth-feedback">Published in the local prototype. Identity checks are deferred; rentals and payments are not enabled.</p></div><div className="page-content detail-grid"><div>{listing.photos.map((photo, index) => <Image key={photo.id} src={photo.url} alt={`${listing.title} — photo ${index + 1}`} width={photo.width} height={photo.height} unoptimized style={{ width: "100%", height: "auto", marginBottom: 16 }}/>) }<div className="details-panel"><h2>A few things to know.</h2><p>{listing.description}</p><p>Owner-reported condition: {listing.condition === "has_issues" ? "Has some issues" : "Working well"}</p>{listing.condition === "has_issues" && <p>{listing.conditionNote}</p>}<p>Approximate pickup area: {listing.area}, Vijayawada.</p></div></div><div><p className="eyebrow">{listing.category}</p><h1>{listing.title}</h1><Card><h2>{formatINR(listing.dailyRatePaise)} <span className="text-base font-sans">/ day</span></h2><dl><div className="definition-row"><dt>Refundable deposit</dt><dd>{formatINR(listing.depositPaise)}</dd></div><div className="definition-row"><dt>Available dates</dt><dd>{listing.availableFrom && listing.availableUntil ? `${listing.availableFrom} – ${listing.availableUntil}` : "Usually available"}</dd></div></dl><p>Availability is owner-reported. This prototype does not reserve items.</p><div className="detail-actions"><Button disabled>Rental requests — coming later</Button></div></Card><Link className="text-link" href="/listings">Manage my listings →</Link></div></div></Container>;
}
