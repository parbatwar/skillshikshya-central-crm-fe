import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateTime, formatDuration, formatMinSec } from "@/lib/leads-format";
import type { ApiCall } from "@/types/calls";
import { outcomeLabel } from "../call-format";
import { DirectionBadge } from "./calls-table";

const FULL_DATETIME = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

/** Always rendered, with "—" when empty, so the layout is the same for every call. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="text-sm break-words">{children || "—"}</div>
    </div>
  );
}

/** Full details of one call. The list stays mounted underneath, so filters and scroll are kept. */
export function CallDetailSheet({ call, onClose }: { call: ApiCall | null; onClose: () => void }) {
  return (
    <Sheet open={call != null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg">
        {call && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                Call with {call.lead_name}
                <DirectionBadge direction={call.direction} />
              </SheetTitle>
              <SheetDescription>{FULL_DATETIME.format(new Date(call.call_timestamp))}</SheetDescription>
            </SheetHeader>

            <SheetBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-xl border p-4">
                <Field label="Lead">
                  <Link to={`/leads/${call.lead}`} className="text-brand font-medium hover:underline">
                    {call.lead_name}
                  </Link>
                  <p className="text-muted-foreground font-mono text-xs">{call.lead_reference_number}</p>
                </Field>
                <Field label="Phone">{call.phone_number}</Field>
                <Field label="Caller">{call.caller}</Field>
                <Field label="Logged by">{call.created_by_name}</Field>
                <Field label="Duration">
                  {formatMinSec(call.duration_seconds)}
                  {call.duration_seconds > 0 && (
                    <span className="text-muted-foreground"> ({formatDuration(call.duration_seconds)})</span>
                  )}
                </Field>
                <Field label="Outcome">{call.outcome ? outcomeLabel(call.outcome) : null}</Field>
              </div>

              <div className="grid gap-4 rounded-xl border p-4">
                <Field label="Notes">
                  {call.notes ? <p className="whitespace-pre-wrap">{call.notes}</p> : null}
                </Field>
                <Field label="Next action">{call.next_action}</Field>
                <Field label="Next follow-up">
                  {call.next_followup_at ? formatDateTime(call.next_followup_at) : null}
                </Field>
                <Field label="Recording">
                  {call.recording_url ? (
                    <a
                      href={call.recording_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand inline-flex items-center gap-1 font-medium hover:underline"
                    >
                      <ExternalLink className="size-3.5" /> Open recording
                    </a>
                  ) : null}
                </Field>
              </div>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
