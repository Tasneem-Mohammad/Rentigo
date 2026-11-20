import "server-only";
export interface Actor {
  userId: string;
  roles: Array<"user" | "admin">;
  identityStatus: string;
  eligibilityStatus: string;
}
// No implementation or pretend session. Choose an established auth library first.
export interface SessionProvider {
  requireActor(): Promise<Actor>;
  requireOperator(): Promise<Actor>;
}
