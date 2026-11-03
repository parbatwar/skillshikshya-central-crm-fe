import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import { useUsers } from "@/hooks/use-users";
import type { CallFilters, DatePreset } from "../call-filters-state";

interface Props {
  filters: CallFilters;
  /** Set one or more URL keys ("" removes the key). Always goes back to page 1. */
  onChange: (changes: Record<string, string>) => void;
  onClear: () => void;
  isStaff: boolean;
}

export function CallFiltersBar({ filters, onChange, onClear, isStaff }: Props) {
  const usersQ = useUsers(1, 100);
  const branchesQ = useBranches(1, 100, "", isStaff);

  const userOptions = [
    { value: "", label: "Everyone" },
    ...(usersQ.data?.results ?? []).map((u) => ({ value: String(u.id), label: u.name })),
  ];

  function changeRange(range: DatePreset) {
    if (range === "custom") {
      onChange({ range });
    } else {
      // Presets don't need their own dates in the URL.
      onChange({ range: range === "all" ? "" : range, from: "", to: "" });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[13rem] flex-1 sm:max-w-sm">
        <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
        <Input
          placeholder="Search lead, phone, caller or notes"
          aria-label="Search calls"
          className="rounded-full pl-9"
          value={filters.search}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>

      <Select
        value={filters.direction}
        onValueChange={(v) => onChange({ direction: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-36" aria-label="Direction">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All directions</SelectItem>
          <SelectItem value="outbound">Outbound</SelectItem>
          <SelectItem value="inbound">Inbound</SelectItem>
        </SelectContent>
      </Select>

      <Combobox
        className="w-44"
        value={filters.user}
        onChange={(v) => onChange({ user: v })}
        options={userOptions}
        placeholder="Logged by"
        searchPlaceholder="Search users…"
        loading={usersQ.isLoading}
        selectedLabel={filters.user ? `User #${filters.user}` : undefined}
      />

      <Select value={filters.range} onValueChange={(v) => changeRange(v as DatePreset)}>
        <SelectTrigger className="w-36" aria-label="Date range">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="month">This month</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {filters.range === "custom" && (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="From date"
            className="w-36"
            max={filters.to || undefined}
            value={filters.from}
            onChange={(e) => onChange({ from: e.target.value })}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            aria-label="To date"
            className="w-36"
            min={filters.from || undefined}
            value={filters.to}
            onChange={(e) => onChange({ to: e.target.value })}
          />
        </div>
      )}

      {isStaff && (
        <Select
          value={filters.branch || "all"}
          onValueChange={(v) => onChange({ branch: v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-40" aria-label="Branch">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {(branchesQ.data?.results ?? []).map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button variant="ghost" size="sm" onClick={onClear}>
        <X /> Clear filters
      </Button>
    </div>
  );
}
