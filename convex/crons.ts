import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Keep the cached free/busy window fresh so the slot query reflects events
// created directly on the owner's calendar (outside the booking flow).
// No-ops cheaply when Google isn't connected.
const crons = cronJobs();

crons.interval("sync google free/busy", { minutes: 10 }, internal.google.syncBusy, {});

export default crons;
