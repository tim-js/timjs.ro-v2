// Luma calendar helpers.
// The calendar is embedded on the homepage via an iframe, but we only want to
// show it when there are upcoming events. We query Luma's public calendar API
// at build time to decide whether to render the embed.

const LUMA_CALENDAR_API_ID = "cal-GoD8QYxAkeWv3zb";

export type LumaEvent = {
  apiId: string;
  name: string;
  startAt: string;
  endAt: string;
  coverUrl?: string;
  eventUrl?: string;
};

type LumaEntry = {
  api_id: string;
  event: {
    api_id: string;
    name: string;
    url: string;
    start_at: string;
    end_at: string;
    cover_url?: string;
  };
};

type LumaResponse = {
  entries?: LumaEntry[];
  has_more?: boolean;
};

// Luma returns event URLs as a short path (e.g. "ky8p..."); prefix to get the full URL.
const toEventUrl = (url?: string) => (url ? `https://lu.ma/${url}` : undefined);

/**
 * Fetch upcoming events from the Luma calendar at build time.
 *
 * Returns `null` when the fetch fails so callers can fail open (show the embed)
 * rather than silently hiding real events due to a transient API issue. An
 * empty array means Luma confirmed there are no upcoming events.
 */
export async function getUpcomingLumaEvents(): Promise<LumaEvent[] | null> {
  try {
    const res = await fetch(
      `https://api.lu.ma/calendar/get-items?calendar_api_id=${LUMA_CALENDAR_API_ID}&period=future`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as LumaResponse;
    return (data.entries ?? []).map((entry) => ({
      apiId: entry.event.api_id,
      name: entry.event.name,
      startAt: entry.event.start_at,
      endAt: entry.event.end_at,
      coverUrl: entry.event.cover_url,
      eventUrl: toEventUrl(entry.event.url),
    }));
  } catch {
    return null;
  }
}