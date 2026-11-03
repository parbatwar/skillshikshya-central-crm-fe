import { BarChart3, Clock, PhoneCall, PhoneForwarded, Timer, Users } from "lucide-react";
import { HBarList } from "@/components/charts";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMinSec, formatTalkTime } from "@/lib/leads-format";
import type { CallSummary } from "@/types/calls";
import { addDays } from "../call-filters-state";

/**
 * Fill in the days with no calls so each bar is one day.
 * Runs from the first to the last day that has calls (or the selected range).
 */
function fillDays(
  rows: CallSummary["calls_per_day"],
  rangeFrom?: string,
  rangeTo?: string,
): { date: string; count: number }[] {
  if (rows.length === 0) return [];

  const counts = new Map(rows.map((r) => [r.date, r.count]));
  const first = rangeFrom ?? rows[0].date;
  const last = rangeTo ?? rows[rows.length - 1].date;

  const days = [];
  let day = first;
  // Safety cap so a very long custom range can't draw thousands of bars.
  while (day <= last && days.length < 120) {
    days.push({ date: day, count: counts.get(day) ?? 0 });
    day = addDays(day, 1);
  }
  return days;
}

/**
 * One bar per day. Unlike MiniBars in components/charts.tsx (which gives every
 * bar a minimum height), a day with 0 calls shows no bar, so empty days read as empty.
 */
function DailyBars({ days }: { days: { date: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="flex h-28 items-end gap-1 border-b pt-2" role="img" aria-label="Calls per day">
      {days.map((d) => (
        <div
          key={d.date}
          className="flex h-full flex-1 items-end"
          title={`${formatDate(d.date)}: ${d.count} call${d.count === 1 ? "" : "s"}`}
        >
          <span className="bg-brand w-full rounded-t" style={{ height: `${(d.count / max) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground flex h-28 flex-col items-center justify-center gap-1 text-sm">
      <BarChart3 className="size-6 opacity-40" />
      {text}
    </div>
  );
}

interface Props {
  summary: CallSummary | undefined;
  isLoading: boolean;
  rangeFrom?: string;
  rangeTo?: string;
}

export function CallsSummary({ summary, isLoading, rangeFrom, rangeTo }: Props) {
  if (isLoading || !summary) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    );
  }

  const cards = [
    {
      label: "Total calls",
      value: String(summary.total_calls),
      note: `${summary.inbound_calls} inbound · ${summary.outbound_calls} outbound`,
      icon: PhoneCall,
      tone: "text-brand",
    },
    {
      label: "Talk time",
      value: formatTalkTime(summary.talk_time_seconds),
      note: "Total across all calls",
      icon: Clock,
      tone: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Average duration",
      value: formatMinSec(summary.average_duration_seconds),
      note: "MM:SS per call",
      icon: Timer,
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Connect rate",
      value: `${summary.connect_rate}%`,
      note: `${summary.connected_calls} of ${summary.total_calls} lasted over 0 sec`,
      icon: PhoneForwarded,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const days = fillDays(summary.calls_per_day, rangeFrom, rangeTo);
  const callers = summary.top_callers.map((c) => ({ label: c.name || "Unknown", value: c.calls }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="gap-2 py-5">
            <CardHeader className="flex-row items-center justify-between">
              <CardDescription className="font-mono text-[11px] font-medium tracking-wider uppercase">
                {c.label}
              </CardDescription>
              <c.icon className={`size-4 ${c.tone}`} />
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-headline text-2xl font-semibold tabular-nums">{c.value}</p>
              <p className="text-muted-foreground text-xs">{c.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="gap-3 py-5">
          <CardHeader>
            <CardDescription className="font-mono text-[11px] font-medium tracking-wider uppercase">
              Calls per day (Nepal time)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {days.length === 0 ? (
              <EmptyChart text="No calls in this view." />
            ) : (
              <>
                <DailyBars days={days} />
                <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                  <span>{formatDate(days[0].date)}</span>
                  {days.length > 1 && <span>{formatDate(days[days.length - 1].date)}</span>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="gap-3 py-5">
          <CardHeader className="flex-row items-center justify-between">
            <CardDescription className="font-mono text-[11px] font-medium tracking-wider uppercase">
              Top callers
            </CardDescription>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {callers.length === 0 ? <EmptyChart text="No callers yet." /> : <HBarList data={callers} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
