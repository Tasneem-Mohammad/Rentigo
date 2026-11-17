import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/listings/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PreviewNotice } from "@/components/shared/states";
import { mockListings } from "@/lib/mock-data";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; area?: string }> }) {
  const { q = "", category = "", area = "" } = await searchParams;
  const listings = mockListings.filter(item => (!q || `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(q.toLowerCase())) && (!category || item.category === category) && (!area || item.area === area));
  return <Container><div className="page-heading"><p className="eyebrow">Vijayawada, at your doorstep</p><h1>Find your next possibility.</h1><p>A few useful things, a little closer to home.</p></div><div className="page-content"><PreviewNotice>Search filters fictional examples only. Date availability and distance search are not implemented.</PreviewNotice><form action="/explore" className="search-bar"><Input id="q" label="What would you like to rent?" name="q" defaultValue={q} placeholder="Try tools, a tent, or a projector"/><div className="field"><label htmlFor="area">Pickup area</label><select id="area" name="area" defaultValue={area}><option value="">All sample areas</option>{["Benz Circle","Patamata","Moghalrajpuram"].map(value=><option key={value}>{value}</option>)}</select></div><Button type="submit">Search examples ↗</Button><div className="field"><label htmlFor="category">Category</label><select id="category" name="category" defaultValue={category}><option value="">All categories</option>{["Home & kitchen","Tools","Outdoor & leisure","Events","Other"].map(value=><option key={value}>{value}</option>)}</select></div></form><p className="text-xs mb-6">{listings.length} sample {listings.length === 1 ? "listing" : "listings"}</p>{listings.length ? <div className="product-grid">{listings.map(listing=><ProductCard key={listing.id} listing={listing}/>)}</div> : <EmptyState title="A little more room to explore." description="No sample listings match. Try a different category or area." href="/explore" action="Reset filters"/>}</div></Container>;
}
