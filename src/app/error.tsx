"use client";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Container className="error-page"><h1>Something needs a moment.</h1><p>Please try again. No sensitive error details are shown here.</p><Button onClick={reset}>Try again</Button></Container>;
}
