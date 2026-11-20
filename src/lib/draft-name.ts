export function draftName(value: string) { return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase(); }
