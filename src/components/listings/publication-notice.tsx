"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PublicationNotice({ id }: { id: string }) {
  const router = useRouter();
  return <aside className="publication-notice" aria-label="Publication confirmation"><div role="status">✓ Your listing has been published.</div><div className="publication-notice-actions"><Link href={`/items/${id}`} className="text-link">View listing →</Link><button type="button" onClick={() => router.replace("/", { scroll: false })} aria-label="Dismiss publication confirmation">Close ×</button></div></aside>;
}
