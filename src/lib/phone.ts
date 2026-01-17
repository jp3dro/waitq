export function normalizePhone(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/[^\d]/g, "");
    return digits ? `+${digits}` : null;
  }
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits || null;
}
