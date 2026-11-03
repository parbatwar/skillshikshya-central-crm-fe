import { ChevronLeft, ChevronRight, Download, Loader2, PhoneCall, RotateCw, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth";
import { useCallSummary, useCalls } from "@/hooks/use-calls";
import { apiErrorMessage } from "@/lib/api";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { callsService } from "@/services/calls.service";
import type { ApiCall } from "@/types/calls";
import {
  DEFAULT_SORT,
  FILTER_KEYS,
  PAGE_SIZE,
  dateRangeFor,
  hasActiveFilters,
  readFilters,
  toApiParams,
} from "./call-filters-state";
import { CallDetailSheet } from "./components/call-detail-sheet";
import { CallFiltersBar } from "./components/call-filters";
import { CallsSummary } from "./components/calls-summary";
import { CallsTable } from "./components/calls-table";

export default function CallsPage() {
  const { user } = useAuth();
  const isStaff = !!user && (user.is_staff || user.is_superuser);

  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  // The search box writes to the URL on every key; wait for a pause before asking the API.
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);
  const apiParams = useMemo(
    () => toApiParams({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const callsQ = useCalls({ ...apiParams, page: filters.page, page_size: PAGE_SIZE });
  const summaryQ = useCallSummary(apiParams);

  const [openCall, setOpenCall] = useState<ApiCall | null>(null);
  const [exporting, setExporting] = useState(false);

  /** Write filter changes to the URL. Any filter change goes back to page 1. */
  function updateFilters(changes: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams);
    FILTER_KEYS.forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(searchParams);
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    setSearchParams(next);
  }

  /** First click sorts descending; clicking the same column again flips it. */
  function changeSort(field: string) {
    let nextSort = `-${field}`;
    if (filters.sort === `-${field}`) nextSort = field;
    updateFilters({ sort: nextSort === DEFAULT_SORT ? "" : nextSort });
  }

  async function handleExport() {
    setExporting(true);
    try {
      await callsService.exportCsv(apiParams);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Export failed"));
    } finally {
      setExporting(false);
    }
  }

  const calls = callsQ.data?.results ?? [];
  const count = callsQ.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  const firstRow = (currentPage - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(currentPage * PAGE_SIZE, count);
  const filtered = hasActiveFilters(filters);
  const { from: rangeFrom, to: rangeTo } = dateRangeFor(filters);

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-brand font-mono text-[11px] font-bold tracking-wider uppercase">CRM Workspace</p>
          <h1 className="font-headline mt-1 text-3xl font-semibold tracking-tight">Calls</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Every call your team logged{isStaff ? " across branches" : " in your branch"}.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting || count === 0}>
          {exporting ? <Loader2 className="animate-spin" /> : <Download />}
          {exporting ? "Preparing…" : "Export CSV"}
        </Button>
      </div>

      <CallsSummary
        summary={summaryQ.data}
        isLoading={summaryQ.isLoading}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
      />

      <div className="bg-card overflow-hidden rounded-2xl border shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)]">
        <div className="border-b p-4">
          <CallFiltersBar
            filters={filters}
            onChange={updateFilters}
            onClear={clearFilters}
            isStaff={isStaff}
          />
        </div>

        {callsQ.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : callsQ.isError && filters.page > 1 ? (
          // An old link can point past the last page (the backend answers 404 "Invalid page").
          <div className="py-14 text-center">
            <p className="text-muted-foreground text-sm">This page of results doesn't exist any more.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => goToPage(1)}>
              Go to first page
            </Button>
          </div>
        ) : callsQ.isError ? (
          <div className="py-14 text-center">
            <p className="text-destructive text-sm font-medium">Couldn't load calls.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Check your connection and try again.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => callsQ.refetch()}>
              <RotateCw /> Retry
            </Button>
          </div>
        ) : calls.length === 0 ? (
          <div className="py-14 text-center">
            {filtered ? (
              <>
                <SearchX className="text-muted-foreground mx-auto size-8 opacity-40" />
                <p className="text-muted-foreground mt-2 text-sm">No calls match these filters.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <PhoneCall className="text-muted-foreground mx-auto size-8 opacity-40" />
                <p className="text-muted-foreground mt-2 text-sm">
                  No calls yet. Calls logged on a lead will show up here.
                </p>
              </>
            )}
          </div>
        ) : (
          // The table scrolls inside this box on small screens, not the whole page.
          <div className="overflow-x-auto">
            <CallsTable calls={calls} sort={filters.sort} onSort={changeSort} onOpen={setOpenCall} />
          </div>
        )}

        {count > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <span className="text-muted-foreground text-sm">
              Showing {firstRow}–{lastRow} of {count}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                <ChevronLeft /> Previous
              </Button>
              <span className="text-muted-foreground px-3 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                Next <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>

      <CallDetailSheet call={openCall} onClose={() => setOpenCall(null)} />
    </div>
  );
}
