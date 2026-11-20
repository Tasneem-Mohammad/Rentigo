import { z } from "zod";
export function availabilityError(from: string | null, until: string | null): string {
  if (!from && !until) return "";
  if (!from || !until) return "Choose both an available-from and an available-until date, or clear both.";
  if (!z.iso.date().safeParse(from).success || !z.iso.date().safeParse(until).success) return "Enter valid calendar dates.";
  return from > until ? "Available until must be on or after available from." : "";
}
export function displayAvailabilityDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
