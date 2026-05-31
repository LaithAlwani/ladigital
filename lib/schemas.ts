import { z } from "zod";

export const BUDGET_VALUES = [
  "<$200/mo",
  "$200–$500/mo",
  "$500–$1,000/mo",
  "$1,000+/mo",
] as const;

// ----------------------------------------------------------------------------
// Leo — AI chat concierge.
// ----------------------------------------------------------------------------

const leoRole = z.enum(["user", "assistant"]);

const leoTurn = z.object({
  role: leoRole,
  // 8000 chars ≈ 2000 tokens — comfortably above the route's max_tokens=1024
  // so a long assistant reply can be replayed back as history next turn.
  content: z.string().min(1).max(8000),
});

export const leoMessageSchema = z.object({
  // Full conversation history. The client trims to the most recent ~12 turns
  // before sending — the server enforces a hard cap to bound abuse.
  messages: z.array(leoTurn).min(1).max(20),
  // Honeypot — bots fill this, humans don't.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type LeoMessageInput = z.infer<typeof leoMessageSchema>;
export type LeoTurn = z.infer<typeof leoTurn>;

export const leoLeadSchema = z.object({
  email: z.string().email("Enter a valid email"),
  name: z.string().max(80).optional().or(z.literal("")),
  language: z.enum(["en", "fr"]).optional(),
  // Final transcript so the team has context. Capped to bound the email size.
  conversation: z.array(leoTurn).max(40),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type LeoLeadInput = z.infer<typeof leoLeadSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  service: z.string().max(60).optional().or(z.literal("")),
  budget: z.enum(BUDGET_VALUES).optional().or(z.literal("")),
  message: z.string().min(10, "Tell us a little about your project").max(2000),
  // honeypot — bots fill this, humans don't
  website: z.string().max(0).optional().or(z.literal("")),
  consent: z
    .boolean()
    .refine((v) => v === true, { message: "Please agree to be contacted" }),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactFieldErrors = Partial<Record<keyof ContactInput, string[]>>;

export type ContactActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: ContactFieldErrors };

export const INITIAL_CONTACT_STATE: ContactActionState = { status: "idle" };

// ----------------------------------------------------------------------------
// Booking — discovery-call scheduling.
// ----------------------------------------------------------------------------

export const bookingSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  // Chosen slot start, epoch ms. Coerced because it arrives as a hidden field.
  startUtc: z.coerce.number().int().positive("Please pick a time"),
  // honeypot
  website: z.string().max(0).optional().or(z.literal("")),
  consent: z
    .boolean()
    .refine((v) => v === true, { message: "Please agree to be contacted" }),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export type BookingFieldErrors = Partial<Record<keyof BookingInput, string[]>>;

/** Details surfaced on the confirmation step. */
export type BookingConfirmation = {
  startUtc: number;
  endUtc: number;
  timezone: string;
  manageToken: string;
  meetLink?: string;
  calendarConnected: boolean;
};

export type BookingActionState =
  | { status: "idle" }
  | { status: "success"; message: string; booking: BookingConfirmation }
  | { status: "error"; message: string; fieldErrors?: BookingFieldErrors };

export const INITIAL_BOOKING_STATE: BookingActionState = { status: "idle" };
