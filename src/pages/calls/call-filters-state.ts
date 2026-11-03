/**
 * Calls page filters live in the URL (?q=…&direction=…&page=2) so a reload or a
 * shared link shows exactly the same view. These helpers convert between the
 * URL and the API params.
 */
import type { CallDirection, CallListParams } from "@/types/calls";

export type DatePreset = "all" | "today" | "7d" | "month" | "custom";

export interface CallFilters {
  search: string;
  direction: "all" | CallDirection;
  /** created_by user id, "" = everyone */
  user: string;
  /** branch id (staff only), "" = all branches */
  branch: string;
  range: DatePreset;
  /** Only used when range is "custom" (YYYY-MM-DD) */
  from: string;
  to: string;
  sort: string;
  page: number;
}

export const DEFAULT_SORT = "-call_timestamp";
export const PAGE_SIZE = 20;

/** Every URL key the page owns — "Clear filters" removes all of them. */
export const FILTER_KEYS = ["q", "direction", "user", "branch", "range", "from", "to", "sort", "page"];

export function readFilters(params: URLSearchParams): CallFilters {
  const direction = params.get("direction");
  const range = params.get("range");
  const page = Number(params.get("page"));
  // Ids must be plain numbers; anything else in a hand-edited URL is ignored.
  const user = params.get("user") ?? "";
  const branch = params.get("branch") ?? "";

  return {
    search: params.get("q") ?? "",
    direction: direction === "inbound" || direction === "outbound" ? direction : "all",
    user: /^\d+$/.test(user) ? user : "",
    branch: /^\d+$/.test(branch) ? branch : "",
    range: range === "today" || range === "7d" || range === "month" || range === "custom" ? range : "all",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    sort: params.get("sort") ?? DEFAULT_SORT,
    page: page >= 1 ? Math.floor(page) : 1,
  };
}

/** True when anything narrows the list (used to pick the right empty message). */
export function hasActiveFilters(f: CallFilters): boolean {
  return (
    f.search !== "" || f.direction !== "all" || f.user !== "" || f.branch !== "" || f.range !== "all"
  );
}

/** Today's date in Nepal (YYYY-MM-DD), whatever timezone the browser is in. */
export function nepalToday(): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date());
}

export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The date_from / date_to for a preset. The backend treats both ends as whole Nepal days. */
export function dateRangeFor(f: CallFilters): { from?: string; to?: string } {
  const today = nepalToday();
  if (f.range === "today") return { from: today, to: today };
  if (f.range === "7d") return { from: addDays(today, -6), to: today };
  if (f.range === "month") return { from: `${today.slice(0, 8)}01`, to: today };
  if (f.range === "custom") return { from: f.from || undefined, to: f.to || undefined };
  return {};
}

/** Filters shared by the list, summary and export (no page / page size). */
export function toApiParams(f: CallFilters): CallListParams {
  const { from, to } = dateRangeFor(f);
  return {
    search: f.search || undefined,
    direction: f.direction === "all" ? undefined : f.direction,
    created_by: f.user ? Number(f.user) : undefined,
    branch_id: f.branch ? Number(f.branch) : undefined,
    date_from: from,
    date_to: to,
    ordering: f.sort,
  };
}
