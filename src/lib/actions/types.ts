export type FormState = { ok?: boolean; error?: string; errors?: Record<string, string>; message?: string };

export function zodErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? '_');
    out[k] ??= i.message;
  }
  return out;
}
