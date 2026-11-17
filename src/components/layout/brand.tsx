import Link from "next/link";
export function Brand() {
  return <Link href="/" className="brand" aria-label="Rentigo home"><svg width="27" height="30" viewBox="0 0 30 32" fill="none" aria-hidden="true"><path d="M7 25V7h9a6 6 0 0 1 0 12H7m9 0 7 7" stroke="currentColor" strokeWidth="1.5"/><path d="m3 10 4-4 4 4M27 22l-4 5-5-3" stroke="currentColor" strokeWidth="1.5"/></svg><span>Rentigo</span></Link>;
}
