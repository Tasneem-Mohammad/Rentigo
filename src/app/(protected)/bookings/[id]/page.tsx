import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PreviewNotice } from "@/components/shared/states";
import { ButtonLink } from "@/components/ui/button";
export const dynamicParams = false;
export function generateStaticParams() { return [{ id: "preview" }]; }
export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  if ((await params).id !== "preview") notFound();
  return <Container><div className="page-heading"><p className="eyebrow">Booking layout</p><h1>Every detail, in one place.</h1></div><div className="page-content"><PreviewNotice>No booking exists. No reservation, pickup confirmation, or payment is performed.</PreviewNotice><div className="detail-grid"><Card><h2>Agreed terms</h2><p>Item, participants, rental dates, return deadline, rental subtotal, deposit, and zero platform fee will be shown once real requests are implemented.</p><p>Final terms must be agreed by both parties and preserved independently of later listing edits.</p></Card><Card><h2>Journey & updates</h2><p>No status recorded. Pickup and return will require confirmation from both people.</p><div className="detail-actions"><Button disabled>Confirm pickup</Button><Button disabled variant="secondary">Confirm return</Button><Button disabled variant="secondary">Report an issue</Button></div></Card></div><div className="mt-8"><ButtonLink href="/bookings">Back to bookings</ButtonLink></div></div></Container>;
}
