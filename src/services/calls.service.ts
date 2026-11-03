import { api } from "@/lib/api";
import type { Paginated } from "@/types";
import type { ApiCall, CallListParams, CallSummary } from "@/types/calls";

export const callsService = {
  /** Paginated call log across all leads (branch-scoped by the backend). */
  async list(params: CallListParams = {}) {
    const { data } = await api.get<Paginated<ApiCall>>("/calls/", { params });
    return data;
  },

  /** Totals, calls per day and top callers for the same filters as the list. */
  async summary(params: CallListParams = {}) {
    const { data } = await api.get<CallSummary>("/calls/summary/", { params });
    return data;
  },

  /** Downloads every call matching the filters (all pages) as calls-YYYY-MM-DD.csv. */
  async exportCsv(params: Omit<CallListParams, "page" | "page_size"> = {}) {
    const response = await api.get<Blob>("/calls/export_csv/", {
      params,
      responseType: "blob",
    });
    // Use the backend's filename (dated in Nepal time); fall back to a generic one.
    const disposition = String(response.headers["content-disposition"] ?? "");
    const match = disposition.match(/filename="(.+)"/);
    const filename = match ? match[1] : "calls.csv";

    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
