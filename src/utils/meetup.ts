import type { EventType } from "types/types";

const MEETUP_ENDPOINT = "https://api.meetup.com/gql";
const COMMUNITY_URLNAME = "tim-js";

const pastEventsQuery = `
  query($urlname: String!) {
    groupByUrlname(urlname: $urlname) {
       pastEvents(input: {first: 200 }) {
        edges {
          node {
            id
            title
            dateTime
            eventUrl
            description
            imageUrl
          }
        }
      }
    }
  }
`;

const upcomingEventsQuery = `query($urlname: String!) {
    groupByUrlname(urlname: $urlname) {
       upcomingEvents(input: {first: 200 }) {
        edges {
          node {
            id
            title
            dateTime
            eventUrl
            description
            imageUrl
          }
        }
      }
    }
  }`;

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
    const json = await response.json();
    return json.data;
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
    data.groupByUrlname.upcomingEvents.edges.map((edge) => edge.node);

  return upcomingEvents.filter(isMeetupEvent);
}

export async function getPastEvents() {
  const data = await getEvents(pastEventsQuery);

  if (!data) {
    return [];
  }

  const pastEvents: EventType[] = data.groupByUrlname.pastEvents.edges.map(
    (edge) => edge.node
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
