import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { DraftForm } from "@/components/listings/draft-form";
export default function CreateListingPage() {
  return <Container><div className="page-heading"><p className="eyebrow">Give useful things a second moment</p><h1>What will you share?</h1><p>Start with a category. We’ll guide you through the rest.</p></div><div className="page-content"><Card><DraftForm/></Card></div></Container>;
}
