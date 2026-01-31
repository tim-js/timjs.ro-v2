import eventsData from "../data/allEvents.json";

export const posterImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/meetups/*.{jpeg,jpg,png,gif}",
  { eager: true },
);

type EventType = {
  id: string;
  title: string;
  dateTime: string;
  eventUrl: string;
  description: string;
  talks: string[];
  slides?: (string | null)[];
  imageUrl: any;
};

const isMeetupEvent = (event) => event.title.toLowerCase().includes("meetup");

export function getEvents() {
  const allEvents: EventType[] = eventsData.map(
    (event) => ({
      ...event,
      imageUrl: posterImages[`/src/assets/meetups/${event.featuredEventPhoto?.standardUrl}`]?.default || "",
    })
  );

  return allEvents.filter(isMeetupEvent)
}

export function getPastEvents() {
  return getEvents().filter((event) => new Date(event.dateTime) < new Date());
}

export function getUpcomingEvents() {
  return getEvents().filter((event) => new Date(event.dateTime) >= new Date());
}