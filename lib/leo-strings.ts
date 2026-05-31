export type Locale = "en" | "fr";

type Strings = {
  launcherLabel: string;
  greeting: string;
  inputPlaceholder: string;
  sendLabel: string;
  closeLabel: string;
  errorGeneric: string;
  rateLimited: string;
  leadFormPrompt: string;
  leadFormNamePlaceholder: string;
  leadFormEmailPlaceholder: string;
  leadFormSubmit: string;
  leadFormSubmitting: string;
  leadFormSuccess: string;
  leadFormSkip: string;
  poweredBy: string;
  booking: {
    prompt: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    consent: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    join: string;
    choosePrompt: string;
    error: string;
    manage: string;
  };
  suggestions: { label: string; kind: "send" | "book"; text?: string }[];
};

const dict: Record<Locale, Strings> = {
  en: {
    launcherLabel: "Ask Leo",
    greeting:
      "Hi, I'm Leo 👋 Ask me anything about LA Digital's plans, services, or how it all works.",
    inputPlaceholder: "Ask about plans, pricing, add-ons…",
    sendLabel: "Send",
    closeLabel: "Close",
    errorGeneric: "Something went wrong. Please try again in a moment.",
    rateLimited: "You're sending messages a little too fast. Try again in a few minutes.",
    leadFormPrompt:
      "Want a quick follow-up from the team? Drop your details and we'll be in touch.",
    leadFormNamePlaceholder: "Your name (optional)",
    leadFormEmailPlaceholder: "Email address",
    leadFormSubmit: "Send to team",
    leadFormSubmitting: "Sending…",
    leadFormSuccess: "Thanks — the team will reach out within one business day.",
    leadFormSkip: "No thanks, keep chatting",
    poweredBy: "Powered by Claude",
    booking: {
      prompt: "Pick a time that works for you:",
      namePlaceholder: "Your name",
      emailPlaceholder: "Email address",
      consent: "I agree to be contacted about this call.",
      submit: "Confirm booking",
      submitting: "Booking…",
      successTitle: "You're booked! 🎉",
      successBody: "A confirmation email is on its way.",
      join: "Join Google Meet",
      choosePrompt: "Choose a time above to continue.",
      error: "Couldn't book that slot. Please try another time.",
      manage: "Reschedule or cancel",
    },
    suggestions: [
      { label: "📅 Book a call", kind: "book" },
      { label: "See plans & pricing", kind: "send", text: "What plans and pricing do you offer?" },
      { label: "What's included?", kind: "send", text: "What's included in each plan?" },
      { label: "How does it work?", kind: "send", text: "How does your process work?" },
    ],
  },
  fr: {
    launcherLabel: "Parler à Leo",
    greeting:
      "Bonjour, je suis Leo 👋 Posez-moi vos questions sur les forfaits, services et fonctionnement de LA Digital.",
    inputPlaceholder: "Posez une question sur les forfaits, prix, modules…",
    sendLabel: "Envoyer",
    closeLabel: "Fermer",
    errorGeneric: "Une erreur s'est produite. Veuillez réessayer dans un instant.",
    rateLimited: "Vous envoyez des messages un peu trop vite. Réessayez dans quelques minutes.",
    leadFormPrompt:
      "Voulez-vous un suivi rapide par l'équipe? Laissez vos coordonnées et nous vous contacterons.",
    leadFormNamePlaceholder: "Votre nom (facultatif)",
    leadFormEmailPlaceholder: "Adresse courriel",
    leadFormSubmit: "Envoyer à l'équipe",
    leadFormSubmitting: "Envoi…",
    leadFormSuccess: "Merci — l'équipe vous contactera d'ici un jour ouvrable.",
    leadFormSkip: "Non merci, continuer la conversation",
    poweredBy: "Propulsé par Claude",
    booking: {
      prompt: "Choisissez un moment qui vous convient :",
      namePlaceholder: "Votre nom",
      emailPlaceholder: "Adresse courriel",
      consent: "J'accepte d'être contacté au sujet de cet appel.",
      submit: "Confirmer",
      submitting: "Réservation…",
      successTitle: "C'est réservé! 🎉",
      successBody: "Un courriel de confirmation arrive.",
      join: "Rejoindre Google Meet",
      choosePrompt: "Choisissez un moment ci-dessus pour continuer.",
      error: "Réservation impossible. Veuillez choisir un autre moment.",
      manage: "Reporter ou annuler",
    },
    suggestions: [
      { label: "📅 Réserver un appel", kind: "book" },
      { label: "Forfaits et prix", kind: "send", text: "Quels forfaits et prix proposez-vous?" },
      { label: "Qu'est-ce qui est inclus?", kind: "send", text: "Qu'est-ce qui est inclus dans chaque forfait?" },
      { label: "Comment ça marche?", kind: "send", text: "Comment fonctionne votre processus?" },
    ],
  },
};

export function leoStrings(locale: Locale): Strings {
  return dict[locale] ?? dict.en;
}

/** Reads `navigator.language` and returns "fr" if it starts with fr, else "en". */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() ?? "";
  return lang.startsWith("fr") ? "fr" : "en";
}
