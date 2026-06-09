"use client";
import { useState, useEffect, useRef } from "react";
import { Check, X, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/utils/slug";
import { cn } from "@/lib/utils/cn";

type State = "idle" | "checking" | "available" | "taken" | "reserved" | "invalid" | "locked";

interface SlugPickerProps {
  value: string;
  onChange: (slug: string) => void;
}

export function SlugPicker({ value, onChange }: SlugPickerProps) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(raw: string) {
    const slug = slugify(raw);
    onChange(slug);
  }

  useEffect(() => {
    if (!value || value.length < 3) {
      setState("idle");
      setMessage("");
      return;
    }

    setState("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slugs/check?slug=${encodeURIComponent(value)}`);
        const json = await res.json() as { data?: { available: boolean; reason?: string } };
        if (json.data?.available) {
          setState("available");
          setMessage("Available!");
        } else {
          const reason = json.data?.reason ?? "taken";
          setState(reason as State);
          setMessage({
            taken: "Already taken",
            reserved: "Reserved word",
            invalid: "Invalid format",
            locked: "Temporarily locked",
          }[reason] ?? "Not available");
        }
      } catch {
        setState("idle");
        setMessage("");
      }
    }, 400);
  }, [value]);

  const ICON = {
    idle: null,
    checking: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    available: <Check className="h-4 w-4 text-green-600" />,
    taken: <X className="h-4 w-4 text-destructive" />,
    reserved: <AlertCircle className="h-4 w-4 text-destructive" />,
    invalid: <AlertCircle className="h-4 w-4 text-destructive" />,
    locked: <X className="h-4 w-4 text-yellow-600" />,
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="slug-picker">Invite URL slug <span className="text-destructive">*</span></Label>
      <div className="relative">
        <div className="flex items-center border border-border rounded-md overflow-hidden">
          <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-border whitespace-nowrap">
            yourname.shubalekha.com/
          </span>
          <Input
            id="slug-picker"
            value={value}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="rahul-weds-priya"
            className="border-0 rounded-none focus-visible:ring-0 pr-8"
            maxLength={63}
          />
        </div>
        {ICON[state] && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{ICON[state]}</span>
        )}
      </div>
      {message && (
        <p className={cn(
          "text-xs",
          state === "available" ? "text-green-600" : "text-destructive",
        )}>
          {message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Letters, numbers, hyphens only. Min 3 characters.
      </p>
    </div>
  );
}
