"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  status: z.enum(["attending", "not_attending", "maybe"]),
  partySize: z.number().int().min(1).max(50),
  meal: z.enum(["veg", "non_veg", "vegan", "jain", "none"]),
  message: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface RsvpFormProps {
  inviteId: string;
  guestName?: string;
  guestLinkToken?: string;
}

export function RsvpForm({ inviteId, guestName, guestLinkToken }: RsvpFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [editToken, setEditToken] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: guestName ?? "", status: "attending", partySize: 1, meal: "none" },
  });

  const statusValue = watch("status");

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          inviteId,
          email: data.email || null,
          phone: data.phone || null,
          guestLinkToken,
        }),
      });
      const json = await res.json() as { data?: { editToken?: string }; error?: { code: string } };
      if (!res.ok) {
        if (json.error?.code === "ALREADY_RSVPED") {
          toast.error("You've already responded. Use your edit link to change your response.");
        } else {
          toast.error("Could not submit. Please try again.");
        }
        return;
      }
      setEditToken(json.data?.editToken ?? null);
      setSubmitted(true);
    } catch {
      toast.error("Network error. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-3">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="font-semibold text-lg">
          {statusValue === "attending" ? "See you there!" : "Thank you for responding!"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Your response has been recorded.
        </p>
        {editToken && (
          <p className="text-xs text-muted-foreground">
            Need to change your response?{" "}
            <a href={`/rsvp/${editToken}`} className="underline">Edit your RSVP</a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="rsvp-name">Your name *</Label>
        <Input id="rsvp-name" {...register("name")} placeholder="Full name" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Response *</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: "attending", label: "Attending" },
            { val: "not_attending", label: "Not attending" },
            { val: "maybe", label: "Maybe" },
          ].map(({ val, label }) => (
            <button
              key={val}
              type="button"
              onClick={() => setValue("status", val as FormData["status"])}
              className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                statusValue === val
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {statusValue === "attending" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rsvp-party">Party size</Label>
              <Input id="rsvp-party" type="number" min={1} max={50} {...register("partySize")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rsvp-meal">Meal preference</Label>
              <Select defaultValue="none" onValueChange={(v) => setValue("meal", v as FormData["meal"])}>
                <SelectTrigger id="rsvp-meal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No preference</SelectItem>
                  <SelectItem value="veg">Vegetarian</SelectItem>
                  <SelectItem value="non_veg">Non-vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="jain">Jain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rsvp-email">Email (optional)</Label>
          <Input id="rsvp-email" type="email" {...register("email")} placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rsvp-phone">Phone (optional)</Label>
          <Input id="rsvp-phone" {...register("phone")} placeholder="+91 98765 43210" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rsvp-msg">Message for the couple (optional)</Label>
        <Textarea id="rsvp-msg" {...register("message")} placeholder="Share your wishes..." rows={3} maxLength={500} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send RSVP"}
      </Button>
    </form>
  );
}
