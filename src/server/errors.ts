import "server-only";
export class ApplicationError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "FORBIDDEN" | "INVALID_INPUT", public readonly publicMessage: string) {
    super(publicMessage);
    this.name = "ApplicationError";
  }
}
export function publicErrorMessage(error: unknown): string {
  return error instanceof ApplicationError ? error.publicMessage : "Something went wrong. Please try again.";
}
