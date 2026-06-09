"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { FieldDef } from "@/types/invite";
import { cn } from "@/lib/utils/cn";

interface FieldEditorProps {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export function FieldEditor({ field, value, onChange, error }: FieldEditorProps) {
  const id = `field-${field.key}`;
  const strVal = (value ?? "") as string;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}

      {(field.type === "text" || field.type === "url" || field.type === "mapUrl" ||
        field.type === "phone" || field.type === "email" || field.type === "image" ||
        field.type === "audio" || field.type === "color") && (
        <Input
          id={id}
          type={field.type === "email" ? "email" : field.type === "color" ? "color" : "text"}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          maxLength={field.maxLength}
          className={cn(error && "border-destructive", field.type === "color" && "h-10 w-16 p-1 cursor-pointer")}
        />
      )}

      {(field.type === "longtext" || field.type === "richtext") && (
        <Textarea
          id={id}
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ""}
          maxLength={field.maxLength}
          rows={4}
          className={cn(error && "border-destructive")}
        />
      )}

      {field.type === "date" && (
        <Input
          id={id}
          type="date"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-destructive")}
        />
      )}

      {field.type === "time" && (
        <Input
          id={id}
          type="time"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-destructive")}
        />
      )}

      {field.type === "datetime" && (
        <Input
          id={id}
          type="datetime-local"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-destructive")}
        />
      )}

      {field.type === "boolean" && (
        <Switch
          id={id}
          checked={!!value}
          onCheckedChange={onChange}
        />
      )}

      {field.type === "select" && field.options && (
        <Select value={strVal} onValueChange={onChange}>
          <SelectTrigger id={id} className={cn(error && "border-destructive")}>
            <SelectValue placeholder={field.placeholder ?? "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "gallery" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Enter image URLs, one per line</p>
          <Textarea
            id={id}
            value={Array.isArray(value) ? (value as string[]).join("\n") : ""}
            onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))}
            placeholder="https://example.com/photo1.jpg"
            rows={4}
          />
        </div>
      )}

      {field.type === "list" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Enter items, one per line</p>
          <Textarea
            id={id}
            value={Array.isArray(value) ? (value as string[]).join("\n") : ""}
            onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))}
            rows={3}
          />
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
