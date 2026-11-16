import { Container } from "@/components/layout/container";
import { EmptyState, PreviewNotice } from "./states";
export function PlaceholderPage({ eyebrow = "Your neighbourhood, organised", title, description, href = "/explore", action = "Explore sample rentals" }: { eyebrow?: string; title: string; description: string; href?: string; action?: string }) {
  return <Container><div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div><div className="page-content"><PreviewNotice>No authentication or access control is implemented. This is a public preview with no private data.</PreviewNotice><EmptyState title="A space for what’s next." description={description} href={href} action={action}/></div></Container>;
}
