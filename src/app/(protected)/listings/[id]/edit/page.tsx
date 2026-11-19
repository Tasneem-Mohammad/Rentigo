import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { DraftForm } from "@/components/listings/draft-form";
import { EmptyState } from "@/components/shared/states";
import { getOwnDraft, DraftError } from "@/server/services/drafts";
import { cloudinaryEnabled } from "@/lib/cloudinary";
import "@/app/listing-photos.css";
export default async function EditDraftPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params; const { saved } = await searchParams;
  let draft;
  try { draft = await getOwnDraft(id); }
  catch (error) { if (error instanceof DraftError && error.status === 404) notFound(); return <Container className="py-12"><EmptyState title="We couldn’t load this draft." description="Please try again. No saved details have been changed." href="/listings" action="Back to My Listings"/></Container>; }
  return <Container><div className="page-heading"><p className="eyebrow">A little more possibility</p><h1>Edit your draft</h1><p>Save at your own pace. This item is not public.</p></div><div className="page-content">{saved === "1" && <p role="status" className="auth-feedback">Draft created. You can continue editing below.</p>}<Card><DraftForm key={draft.id} draft={draft} photosEnabled={cloudinaryEnabled()}/></Card></div></Container>;
}
