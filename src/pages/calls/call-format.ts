import { CALL_OUTCOMES } from "@/data/lead-lookups";

/** "follow_up_required" → "Follow-up Required"; unknown/free-text outcomes are shown as typed. */
export function outcomeLabel(outcome: string | null): string {
  if (!outcome) return "—";
  const known = CALL_OUTCOMES.find((o) => o.value === outcome);
  return known ? known.label : outcome;
}
