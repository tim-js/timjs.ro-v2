import pastEventsData from "../data/pastEvents.json";

type EventType = {
  id: string;
  title: string;
  dateTime: string;
  eventUrl: string;
  description: string;
  imageUrl: string;
};

const MEETUP_ENDPOINT = "https://api.meetup.com/gql-ext";
const COMMUNITY_URLNAME = "tim-js";

const pastEventsQuery = `
query ($urlname: String!) {
  groupByUrlname(urlname: $urlname) {
    id
    name
    urlname
    events(status: PAST, first: 200) {
         edges {
          node {
            id
            title
            dateTime
            eventUrl
            description
            featuredEventPhoto {
              thumbUrl
              standardUrl
            }
          }
        }
    }
  }
}
`;

// It should be PENDING OR PROPOSED
const upcomingEventsQuery = `
query ($urlname: String!) {
  groupByUrlname(urlname: $urlname) {
    id
    name
    urlname
    events(status: PENDING, sort: DESC, first: 2) {
         edges {
          node {
            id
            title
            dateTime
            eventUrl
            description
            featuredEventPhoto {
              thumbUrl
              standardUrl
            }
          }
        }
    }
  }
}
`;

const eventQuery = `
  query($id: ID!) {
    event(id: $id) {
      title
      description
      dateTime
      eventUrl
    }
  }
`;

const isMeetupEvent = (event) => event.title.toLowerCase().includes("meetup");

export function extractBetweenSeparators(text: string, maxLength: number = 200): string {
  // Match *** with optional escaping and newlines
  const matches = text.match(/\\?\*\\?\*\\?\*\n?/g);

  if (!matches || matches.length !== 2) {
    return text;
  }

  // Find the positions of the two separators
  const firstSeparator = text.indexOf(matches[0]);
  const lastSeparator = text.lastIndexOf(matches[1]);

  // Extract content between them
  const startPos = firstSeparator + matches[0].length;
  const extracted = text.substring(startPos, lastSeparator).trim();

  // Split into paragraphs and truncate long ones
  const paragraphs = extracted.split(/\n\n+/);
  const truncatedParagraphs = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim();
    if (trimmed.length > maxLength) {
      return trimmed.substring(0, maxLength) + '...';
    }
    return trimmed;
  });

  return truncatedParagraphs.join('\n\n');
}

export async function getEvents(query: string) {
  const response = await fetch(MEETUP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { urlname: COMMUNITY_URLNAME },
    }),
  });
  if (!response.ok) {
    console.error(response.statusText);
    return null;
  }
  try {
    const result = await response.json();
    return result.data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getUpcomingEvents() {
  const data = await getEvents(upcomingEventsQuery);

  if (!data) {
    return [];
  }

  const upcomingEvents: EventType[] =
    data.groupByUrlname.events.edges.map((edge) => ({
      ...edge.node,
      imageUrl: edge.node.featuredEventPhoto?.standardUrl,
    }));

  return upcomingEvents.filter(isMeetupEvent);
}

export function getPastEvents() {
  const pastEvents: EventType[] = pastEventsData.map(
    (event) => ({
      id: event.id,
      title: event.title,
      dateTime: event.dateTime,
      eventUrl: event.eventUrl,
      description: extractBetweenSeparators(event.description),
      imageUrl: event.featuredEventPhoto?.standardUrl || "",
    })
  );

  return pastEvents.filter(isMeetupEvent);
}

export async function getEvent(id: string) {
  const response = await fetch(MEETUP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: eventQuery,
      variables: { id },
    }),
  });

  const { data } = await response.json();
  return data.event;
}