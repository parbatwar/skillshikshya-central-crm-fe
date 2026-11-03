import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { callsService } from "@/services/calls.service";
import type { CallListParams } from "@/types/calls";

// Both keys start with "calls", so logging a call (useAddCall) refreshes the list and summary.

/** One page of the global call log. */
export function useCalls(params: CallListParams) {
  return useQuery({
    queryKey: ["calls", "list", params],
    queryFn: () => callsService.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Summary cards + charts for the current filters (page and ordering don't matter). */
export function useCallSummary(params: CallListParams) {
  return useQuery({
    queryKey: ["calls", "summary", params],
    queryFn: () => callsService.summary(params),
    placeholderData: keepPreviousData,
  });
}
