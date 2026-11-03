import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatMinSec } from "@/lib/leads-format";
import { cn } from "@/lib/utils";
import type { ApiCall } from "@/types/calls";
import { outcomeLabel } from "../call-format";

export function DirectionBadge({ direction }: { direction: ApiCall["direction"] }) {
  const inbound = direction === "inbound";
  const Icon = inbound ? PhoneIncoming : PhoneOutgoing;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1",
        inbound
          ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      )}
    >
      <Icon className="size-3" />
      {inbound ? "Inbound" : "Outbound"}
    </Badge>
  );
}

/** Header button that sorts by one field; the arrow shows the current direction. */
function SortHeader({
  label,
  field,
  sort,
  onSort,
  className,
}: {
  label: string;
  field: string;
  sort: string;
  onSort: (field: string) => void;
  className?: string;
}) {
  let Icon = ArrowUpDown;
  let ariaSort: "ascending" | "descending" | "none" = "none";
  if (sort === field) {
    Icon = ArrowUp;
    ariaSort = "ascending";
  } else if (sort === `-${field}`) {
    Icon = ArrowDown;
    ariaSort = "descending";
  }

  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        type="button"
        className="hover:text-foreground inline-flex items-center gap-1"
        onClick={() => onSort(field)}
      >
        {label}
        <Icon className={cn("size-3.5", ariaSort === "none" && "opacity-40")} />
      </button>
    </TableHead>
  );
}

interface Props {
  calls: ApiCall[];
  sort: string;
  onSort: (field: string) => void;
  onOpen: (call: ApiCall) => void;
}

export function CallsTable({ calls, sort, onSort, onOpen }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader label="When" field="call_timestamp" sort={sort} onSort={onSort} />
          <TableHead>Direction</TableHead>
          <TableHead>Lead</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Logged by</TableHead>
          <SortHeader
            label="Duration"
            field="duration_seconds"
            sort={sort}
            onSort={onSort}
            className="text-right"
          />
          <TableHead>Outcome</TableHead>
          <TableHead>Recording</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map((call) => (
          <TableRow key={call.id} className="cursor-pointer" onClick={() => onOpen(call)}>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {formatDateTime(call.call_timestamp)}
            </TableCell>
            <TableCell>
              <DirectionBadge direction={call.direction} />
            </TableCell>
            <TableCell>
              {/* Stop the click so it opens the lead, not the side panel. */}
              <Link
                to={`/leads/${call.lead}`}
                className="hover:text-brand font-semibold whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                {call.lead_name}
              </Link>
              <p className="text-muted-foreground font-mono text-xs">{call.lead_reference_number}</p>
            </TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">{call.phone_number || "—"}</TableCell>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {call.created_by_name || "—"}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatMinSec(call.duration_seconds)}
            </TableCell>
            <TableCell className="whitespace-nowrap">{outcomeLabel(call.outcome)}</TableCell>
            <TableCell>
              {call.recording_url ? (
                <a
                  href={call.recording_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="size-3.5" /> Listen
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
