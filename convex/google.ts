"use node";

import { v } from "convex/values";
import { google } from "googleapis";
import { internalAction, type ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";

// ----------------------------------------------------------------------------
// Google Calendar side-effects. Runs in the Node runtime; the OAuth client
// secret + tokens live only in Convex env / the googleTokens table and never
// reach the Next bundle. Every action degrades gracefully (no-op) when the
// calendar isn't connected yet, so bookings still succeed without Google.
// ----------------------------------------------------------------------------

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function clientConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

function makeOAuth() {
  const cfg = clientConfig();
  if (!cfg) return null;
  return new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
}

/** Build an authed calendar client, refreshing the access token if near expiry. */
async function authedCalendar(ctx: ActionCtx) {
  const oauth = makeOAuth();
  if (!oauth) return null;
  const tokens = await ctx.runQuery(internal.googleTokens.get, {});
  if (!tokens) return null;

  oauth.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
  });

  if (Date.now() > tokens.expiryDate - 60_000) {
    const res = await oauth.getAccessToken(); // auto-refreshes using refresh_token
    const creds = oauth.credentials;
    if (creds.access_token && creds.expiry_date) {
      await ctx.runMutation(internal.googleTokens.updateAccess, {
        accessToken: creds.access_token,
        expiryDate: creds.expiry_date,
      });
    }
    void res;
  }

  const calendar = google.calendar({ version: "v3", auth: oauth });
  return { calendar, calendarId: tokens.calendarId };
}

/** Exchange an OAuth code for tokens and store them (called from the HTTP callback). */
export const exchangeAndStore = internalAction({
  args: { code: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; error?: string }> => {
    const oauth = makeOAuth();
    if (!oauth) return { ok: false, error: "Google OAuth env not configured." };
    try {
      const { tokens } = await oauth.getToken(args.code);
      if (!tokens.access_token || !tokens.refresh_token) {
        return {
          ok: false,
          error:
            "Google did not return a refresh token. Revoke prior access and reconnect with consent.",
        };
      }
      await ctx.runMutation(internal.googleTokens.save, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date ?? Date.now() + 3_600_000,
        scope: tokens.scope,
        calendarId: "primary",
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});

/** Insert the calendar event (with a Meet link) and patch it back onto the booking. */
export const insertEvent = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (
    ctx,
    args,
  ): Promise<{ connected: boolean; meetLink?: string; eventId?: string }> => {
    const booking = await ctx.runQuery(internal.bookings.getById, { bookingId: args.bookingId });
    if (!booking) return { connected: false };
    const authed = await authedCalendar(ctx);
    if (!authed) return { connected: false };

    const rules = await ctx.runQuery(api.availability.getRules, {});
    try {
      const res = await authed.calendar.events.insert({
        calendarId: authed.calendarId,
        conferenceDataVersion: 1,
        sendUpdates: "all",
        requestBody: {
          summary: rules.meetingTitle,
          description: `Discovery call booked via the website.\n\nName: ${booking.name}\nEmail: ${booking.email}${booking.phone ? `\nPhone: ${booking.phone}` : ""}${booking.company ? `\nCompany: ${booking.company}` : ""}${booking.notes ? `\n\nNotes:\n${booking.notes}` : ""}`,
          start: { dateTime: new Date(booking.startUtc).toISOString() },
          end: { dateTime: new Date(booking.endUtc).toISOString() },
          attendees: [{ email: booking.email, displayName: booking.name }],
          conferenceData: {
            createRequest: {
              requestId: args.bookingId,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        },
      });
      const eventId = res.data.id ?? undefined;
      const meetLink =
        res.data.hangoutLink ??
        res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
        undefined;
      await ctx.runMutation(internal.bookings.setGoogleEvent, {
        bookingId: args.bookingId,
        googleEventId: eventId,
        meetLink,
      });
      return { connected: true, meetLink, eventId };
    } catch (err) {
      console.error("[google.insertEvent] failed", err);
      return { connected: true };
    }
  },
});

/** Move an existing event to the booking's new time. */
export const patchEvent = internalAction({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const booking = await ctx.runQuery(internal.bookings.getById, { bookingId: args.bookingId });
    if (!booking?.googleEventId) return { ok: false };
    const authed = await authedCalendar(ctx);
    if (!authed) return { ok: false };
    try {
      await authed.calendar.events.patch({
        calendarId: authed.calendarId,
        eventId: booking.googleEventId,
        sendUpdates: "all",
        requestBody: {
          start: { dateTime: new Date(booking.startUtc).toISOString() },
          end: { dateTime: new Date(booking.endUtc).toISOString() },
        },
      });
      return { ok: true };
    } catch (err) {
      console.error("[google.patchEvent] failed", err);
      return { ok: false };
    }
  },
});

/** Delete an event (booking cancelled). */
export const deleteEvent = internalAction({
  args: { googleEventId: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const authed = await authedCalendar(ctx);
    if (!authed) return { ok: false };
    try {
      await authed.calendar.events.delete({
        calendarId: authed.calendarId,
        eventId: args.googleEventId,
        sendUpdates: "all",
      });
      return { ok: true };
    } catch (err) {
      console.error("[google.deleteEvent] failed", err);
      return { ok: false };
    }
  },
});

/** Cron — refresh the cached free/busy window from the owner's calendar. */
export const syncBusy = internalAction({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean; count?: number }> => {
    const authed = await authedCalendar(ctx);
    if (!authed) return { ok: false };
    const rules = await ctx.runQuery(api.availability.getRules, {});
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + (rules.maxAdvanceDays + 2) * 86_400_000).toISOString();
    try {
      const res = await authed.calendar.freebusy.query({
        requestBody: { timeMin, timeMax, items: [{ id: authed.calendarId }] },
      });
      const busy = res.data.calendars?.[authed.calendarId]?.busy ?? [];
      const intervals = busy
        .filter((b) => b.start && b.end)
        .map((b) => ({ startUtc: Date.parse(b.start!), endUtc: Date.parse(b.end!) }));
      await ctx.runMutation(internal.googleBusy.replaceAll, {
        intervals,
        syncedAt: Date.now(),
      });
      return { ok: true, count: intervals.length };
    } catch (err) {
      console.error("[google.syncBusy] failed", err);
      return { ok: false };
    }
  },
});
