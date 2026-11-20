import Link from "next/link";
import { Container } from "@/components/layout/container";
import { EditorialHero } from "@/components/home/editorial-hero";
import { HomeCatalog } from "@/components/home/home-catalog";
import { HowItWorks } from "@/components/home/how-it-works";
import { Icon } from "@/components/ui/icon";
import { editorialListings } from "@/lib/editorial-data";
import { PublicationNotice } from "@/components/listings/publication-notice";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ published?: string }> }) {
  const { published } = await searchParams;
  const confirmation = typeof published === "string" && /^[a-f\d]{24}$/i.test(published) ? <PublicationNotice id={published}/> : null;
  return <div className="editorial-home">{confirmation}<div className="neighbourhood-strip"><Container><span><span className="status-dot"/>The Vijayawada edition<span className="strip-divider">/</span><span className="strip-description">A neighbourhood of practical possibilities.</span></span><span className="strip-preview">Design preview · Fictional listings</span></Container></div><EditorialHero/><HomeCatalog listings={editorialListings}/><HowItWorks/><Container><section className="editorial-listing-cta"><div><p className="editorial-eyebrow">Useful things deserve to be used</p><h2>Something sitting idle?<br/>Let it become someone’s possibility.</h2><p>From the tools in your cupboard to the kit for a special occasion. Make a little more of what you already own.</p></div><div className="listing-cta-actions"><Link href="/listings/new" className="button button-primary">List your item<Icon name="arrow" width="17" height="17"/></Link><Link href="/explore" className="text-link">Explore the collection</Link></div></section></Container></div>;
}
