/** Global call log — GET /api/calls/ (see lead_app_calls_api_guide.md). */

export type CallDirection = "inbound" | "outbound";

export interface ApiCall {
  id: number;
  lead: number;
  lead_name: string;
  lead_reference_number: string;
  call_timestamp: string;
  direction: CallDirection;
  caller: string;
  phone_number: string;
  duration_seconds: number;
  outcome: string | null;
  notes: string | null;
  recording_url: string | null;
  next_followup_at: string | null;
  next_action: string | null;
  branch: number | null;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
}

/** Query params shared by the list, summary and export endpoints. */
export interface CallListParams {
  page?: number;
  page_size?: number;
  search?: string;
  direction?: CallDirection;
  created_by?: number;
  /** Whole days in Nepal time, YYYY-MM-DD. */
  date_from?: string;
  date_to?: string;
  /** Staff only — non-staff are always locked to their own branch. */
  branch_id?: number;
  /** e.g. "-call_timestamp" (newest first) or "duration_seconds". */
  ordering?: string;
}

/** GET /api/calls/summary/ */
export interface CallSummary {
  total_calls: number;
  inbound_calls: number;
  outbound_calls: number;
  connected_calls: number;
  talk_time_seconds: number;
  average_duration_seconds: number;
  connect_rate: number;
  calls_per_day: { date: string; count: number }[];
  top_callers: { user_id: number; name: string; calls: number; talk_time_seconds: number }[];
}
