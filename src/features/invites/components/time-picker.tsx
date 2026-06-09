"use client";

/**
 * AM/PM time picker — renders three selects: hour, minute, period.
 * Value in/out is "HH:MM" 24-hour string (matches <input type="time">).
 */

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value: string;      // "HH:MM" 24-hr or ""
  onChange: (value: string) => void;
  id?: string;
}

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1);   // 1..12
const MINUTES = ["00", "15", "30", "45"];

/** "14:30" → { h12: "2", min: "30", period: "PM" } */
function parse(v: string) {
  if (!v) return { h12: "", min: "", period: "AM" };
  const [hStr, mStr] = v.split(":");
  const h24 = parseInt(hStr ?? "0", 10);
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { h12: String(h12), min: mStr ?? "00", period };
}

/** { h12, min, period } → "HH:MM" 24-hr */
function compose(h12: string, min: string, period: string): string {
  if (!h12 || !min) return "";
  let h = parseInt(h12, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${min}`;
}

export function TimePicker({ value, onChange, id }: TimePickerProps) {
  const { h12, min, period } = parse(value);

  function set(field: "h12" | "min" | "period", v: string) {
    const next = {
      h12: field === "h12" ? v : (h12 || "12"),
      min: field === "min" ? v : (min || "00"),
      period: field === "period" ? v : period,
    };
    onChange(compose(next.h12, next.min, next.period));
  }

  return (
    <div className="flex items-center gap-1.5" id={id}>
      {/* Hour */}
      <Select value={h12} onValueChange={(v) => set("h12", v)}>
        <SelectTrigger className="h-9 w-20 text-sm">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {String(h).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground font-medium">:</span>

      {/* Minute */}
      <Select value={min} onValueChange={(v) => set("min", v)}>
        <SelectTrigger className="h-9 w-20 text-sm">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AM / PM */}
      <Select value={period} onValueChange={(v) => set("period", v)}>
        <SelectTrigger className="h-9 w-20 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
