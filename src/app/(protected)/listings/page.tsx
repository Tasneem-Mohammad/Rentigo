import Link from "next/link";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/states";
import { ButtonLink } from "@/components/ui/button";
import { getOwnDrafts } from "@/server/services/drafts";
export default async function ListingsPage() {
  let drafts;
  try { drafts = await getOwnDrafts(); }
  catch { return <Container><div className="page-heading"><h1>My Listings</h1></div><div className="page-content"><EmptyState title="We couldn’t load your drafts." description="Your saved drafts have not been changed. Please try again." href="/listings" action="Try again"/></div></Container>; }
  return <Container><div className="page-heading"><p className="eyebrow">Your useful things, in progress</p><h1>My Listings</h1><p>Your drafts are private. Nothing here is published or available to rent.</p><ButtonLink href="/listings/new">Create a draft ↗</ButtonLink></div><div className="page-content">{drafts.length ? <><div className="draft-list">{drafts.map(draft => <article className="card draft-list-row" key={draft.id}><div><span className="draft-badge">Private draft</span><h2>{draft.title}</h2><p>{draft.category || "Category not set"} · {draft.areaLabel || "Pickup area not set"}</p><small>Last saved {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(new Date(draft.updatedAt))} IST</small></div><Link className="button button-secondary" href={`/listings/${draft.id}/edit`}>Edit draft</Link></article>)}</div><p className="text-xs mt-5">Showing your most recent {drafts.length} drafts (up to 100).</p></> : <EmptyState title="Good things start with a draft." description="Save an item privately, then come back to finish its details. Choose a category, add a name and condition, then save it privately." href="/listings/new" action="Create your first draft"/>}</div></Container>;
}
