"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/listings/product-card";
import { EmptyState } from "@/components/shared/states";
import { Icon } from "@/components/ui/icon";
import type { ListingPreview } from "@/types/listing";

const categories = ["All collections", "Tools", "Outdoor & leisure", "Home & kitchen", "Events", "Other"];
export function HomeCatalog({ listings }: { listings: ListingPreview[] }) {
  const [category, setCategory] = useState("All collections");
  const [area, setArea] = useState("");
  const [sort, setSort] = useState("editorial");
  const [view, setView] = useState<"grid" | "list">("grid");
  const visible = listings.filter(item => (category === "All collections" || item.category === category) && (!area || item.area === area)).sort((a,b) => sort === "price-low" ? a.dailyRatePaise - b.dailyRatePaise : sort === "price-high" ? b.dailyRatePaise - a.dailyRatePaise : 0);
  return <section className="home-catalog" id="catalog" aria-labelledby="catalog-heading"><Container><div className="catalog-heading"><div><p className="editorial-eyebrow">The neighbourhood collection</p><h2 id="catalog-heading">Good things, closer to home.</h2></div><div className="catalog-controls"><div className="view-switch" role="group" aria-label="Catalog view"><button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Icon name="grid" width="15" height="15"/><span>Editorial grid</span></button><button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}><Icon name="list" width="15" height="15"/><span>List</span></button></div><label className="catalog-sort">Sort by<select value={sort} onChange={event => setSort(event.target.value)}><option value="editorial">Editorial order</option><option value="price-low">Daily rate: low to high</option><option value="price-high">Daily rate: high to low</option></select></label></div></div><div className="category-tabs" role="group" aria-label="Filter examples by category">{categories.map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}{value === "All collections" && <span> ({listings.length})</span>}</button>)}</div><div className="catalog-filter-row"><label><Icon name="pin" width="16" height="16"/><span>Pickup area</span><select value={area} onChange={event => setArea(event.target.value)}><option value="">All sample areas</option><option>Benz Circle</option><option>Patamata</option><option>Moghalrajpuram</option></select></label><p>Illustrative listings · Live availability coming later</p>{(area || category !== "All collections") && <button type="button" className="reset-filters" onClick={() => { setArea(""); setCategory("All collections"); }}>Reset filters</button>}</div><p className="sr-only" role="status">{visible.length} sample listings shown</p>{visible.length ? <div className={`editorial-product-grid ${view === "list" ? "catalog-list-view" : ""}`}>{visible.map(listing => <ProductCard key={listing.id} listing={listing} editorial/>)}</div> : <EmptyState title="A little more room to explore." description="No examples match these filters. Choose another area or reset your selection."/>}<div className="catalog-end"><p>Showing {visible.length} of {listings.length} editorial examples. No live rentals yet.</p><Link href="/explore" className="button button-secondary">Explore all rental examples<Icon name="arrow" width="17" height="17"/></Link></div></Container></section>;
}
