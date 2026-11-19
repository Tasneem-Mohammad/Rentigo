// Technical development limits; publishing policy remains a separate milestone.
export const MAX_LISTING_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_SOURCE_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_FORMATS = ["jpg", "png", "webp"] as const;
export const PHOTO_RESERVATION_MS = 65 * 60 * 1000;
export const MAX_PHOTO_RESERVATIONS = 20;
