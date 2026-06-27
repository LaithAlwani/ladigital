// Social platforms the admin can choose from. Icons for these render in
// SocialIcons; any other value falls back to a generic globe icon.
export const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x", label: "X (Twitter)" },
] as const;

export type SocialLink = { platform: string; url: string; handle?: string; enabled?: boolean };

/** Resolve the social links to display: admin list (or static fallback), with
 *  any toggled-off (enabled === false) or URL-less entries removed. */
export function resolveSocials(
  override: SocialLink[] | null | undefined,
  fallback: { platform: string; url: string; handle?: string }[],
): SocialLink[] {
  const all = (override ?? fallback) as SocialLink[];
  return all.filter((s) => s.enabled !== false && Boolean(s.url));
}
