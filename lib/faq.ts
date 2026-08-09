/**
 * Canonical FAQ content. Lives in code so it stays in sync with `siteConfig`,
 * and so the FAQPage JSON-LD on the home page and the rendered <Faq /> section
 * are always identical (Google penalizes mismatches between visible text and
 * structured data).
 *
 * Keep answers tight (1–2 short sentences), plain-spoken, and reassuring —
 * these sell affordability without sounding "cheap".
 */

export type FaqItem = {
  question: string;
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    question: "How can a professional website be only $49/month?",
    answer:
      "We build on efficient, proven systems and host your site ourselves, so there's no big upfront agency bill. You get a custom, mobile-friendly website for one low monthly price. Larger fully-custom builds are a separate quote.",
  },
  {
    question: "Is a $49 website actually any good?",
    answer:
      "Yes. It's a custom, mobile-friendly design — not a generic template dump — that's fast, secure, and built to win trust. Affordable doesn't mean amateur.",
  },
  {
    question: "What's included for $49/month?",
    answer:
      "Custom design, hosting, SSL security, ongoing updates and maintenance, contact forms, Google setup, basic SEO to get you found, and support from a real person. Everything to go live and stay looked-after.",
  },
  {
    question: "Can customers book appointments on my website?",
    answer:
      "Yes — our Website + Booking plan ($99/month) adds a full online booking and calendar system with automated email and SMS reminders. Want AI to answer questions and handle bookings by chat? That's Omnivo AI, which also works with your existing booking system.",
  },
  {
    question: "Do I own my website?",
    answer:
      "You own your content and your domain. If you ever decide to leave, we help you take what's yours — no hostage situations.",
  },
  {
    question: "How does per-page SEO work?",
    answer:
      "Instead of a big monthly retainer, we optimize your site one page at a time, so you only pay for the pages you want to rank. We'll confirm your page count and the rate on a quick call.",
  },
  {
    question: "Can you build a mobile app, desktop app, or custom software?",
    answer:
      "Yes — those are custom builds, quoted to fit your needs. Many businesses start with a website and add an app or custom software as they grow.",
  },
  {
    question: "Is Omnivo AI part of my website?",
    answer:
      "No — Omnivo AI is a separate product for AI automation (lead capture, answering customer questions, bookings, and follow-ups). You can add it to any website; it lives at omnivoai.ca.",
  },
  {
    question: "How long does it take to launch?",
    answer:
      "Most websites go live within a couple of weeks once we have your content. We keep it simple, with a live preview so there are no surprises.",
  },
  {
    question: "Do you work with businesses outside Ottawa?",
    answer:
      "Yes. We're based in Ottawa, Ontario but work with small businesses across Canada — entirely remotely, over calls, shared previews, and email.",
  },
  {
    question: "Can I cancel?",
    answer:
      "Yes — the $49/month website is month-to-month and you can cancel anytime. No long lock-in.",
  },
];
