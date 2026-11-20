import Image from "next/image";
import Link from "next/link";
import { getPublishedListings } from "@/server/services/published-listings";
import { prototypePublishingEnabled } from "@/server/prototype-publishing";
import { formatINR } from "@/lib/money";

export async function PublishedRentals({ q, category, area }: { q: string; category: string; area: string }) {
  if (!prototypePublishingEnabled()) return null;
  let listings;
  try { listings = await getPublishedListings(); }
  catch { return <p role="status">Published listings are temporarily unavailable. Please refresh to try again.</p>; }
  const filtered = listings.filter(item => (!q || `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(q.toLowerCase())) && (!category || item.category === category) && (!area || item.area.toLowerCase().includes(area.trim().toLowerCase())));
  return <section className="details-panel"><h2>Published locally</h2><p>Local prototype · Identity checks and rental requests are not enabled. Showing up to 100 recent listings.</p>{!filtered.length && <p>No published items match these filters yet.</p>}<div className="product-grid">{filtered.map(item => <article className="card" key={item.id}><Link href={`/items/${item.id}`}>{item.photos[0] && <Image src={item.photos[0].url} alt={item.title} width={item.photos[0].width} height={item.photos[0].height} unoptimized style={{ width: "100%", height: 240, objectFit: "cover" }}/>}<p className="eyebrow">{item.category}</p><h3>{item.title}</h3><p>{item.area}</p><p>{formatINR(item.dailyRatePaise)} / day</p></Link></article>)}</div></section>;
}
