import "server-only";
import type { ListingPreview } from "@/types/listing";

// Repositories own persistence; they never decide authorization or booking rules.
export interface ListingsRepository { findPublicById(id: string): Promise<ListingPreview | null> }
export interface UsersRepository { findProfileById(id: string): Promise<{ id: string; displayName: string } | null> }
export interface BookingsRepository { listByParticipant(userId: string): Promise<Array<{ id: string; listingId: string }>> }
// Add mutation contracts only alongside approved schemas, atomicity, and policies.
