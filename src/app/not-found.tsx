import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/shared/states";
export default function NotFound() { return <Container className="error-page"><EmptyState title="This little corner is empty." description="We couldn’t find that page or sample item." href="/explore" action="Explore rentals"/></Container>; }
