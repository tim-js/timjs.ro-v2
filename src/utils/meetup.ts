import pastEventsData from "../data/pastEvents.json";

type EventType = {
  id: string;
  title: string;
  dateTime: string;
  eventUrl: string;
  description: string;
  talks: string[];
  imageUrl: string;
};

const MEETUP_ENDPOINT = "https://api.meetup.com/gql-ext";
const COMMUNITY_URLNAME = "tim-js";

const upcomingEventsQuery = `
query ($urlname: String!) {
  groupByUrlname(urlname: $urlname) {
    id
    name
    urlname
    events(status: ACTIVE, sort: DESC, first: 2) {
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
              highResUrl
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
      imageUrl: edge.node.featuredEventPhoto?.highResUrl,
    }));

  return upcomingEvents.filter(isMeetupEvent);
}

export function getPastEvents() {
  const pastEvents: EventType[] = pastEventsData.map(
    (event) => ({
      ...event,
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