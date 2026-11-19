export function EmailVerificationStatus({ state }: { state: "verified" | "unverified" | "pending" }) {
  return <span className={`email-verification-status is-${state}`}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/>{state === "verified" ? <path d="m8 12 3 3 5-6"/> : state === "unverified" ? <><path d="M12 7v6"/><circle cx="12" cy="16.5" r=".7" fill="currentColor" stroke="none"/></> : <path d="M12 7v5l3 2"/>}</svg>
    {state === "verified" ? "Email verified" : state === "unverified" ? "Email not verified" : "Email verification pending"}
  </span>;
}
