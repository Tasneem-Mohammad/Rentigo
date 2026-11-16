import "server-only";
import type { Actor } from "@/server/auth/contracts";
import type { ListingPreview } from "@/types/listing";

// Proposed boundaries, not implemented functionality. Private data uses separate DTOs.
export interface UsersService { getOwnProfile(actor: Actor): Promise<{ id: string; displayName: string }> }
export interface ListingsService { getPublicListing(id: string): Promise<ListingPreview | null> }
export interface CategoriesService { list(): Promise<Array<{ id: string; name: string }>> }
export interface SearchService { search(input: { keyword?: string; categoryId?: string; area?: string; cursor?: string }): Promise<{ items: ListingPreview[]; nextCursor?: string }> }
export interface MessagingService { listConversations(actor: Actor): Promise<Array<{ id: string; listingId: string }>> }
export interface RentalRequestsService { listIncoming(actor: Actor): Promise<Array<{ id: string; listingId: string }>> }
export interface BookingsService { listForActor(actor: Actor): Promise<Array<{ id: string; listingId: string }>> }
export interface IssueReportsService { listOwn(actor: Actor): Promise<Array<{ id: string; bookingId: string }>> }
export interface AdministrationService { getOverview(operator: Actor): Promise<{ pendingReportCount: number }> }
