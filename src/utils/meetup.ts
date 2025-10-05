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
    events(status: PENDING, first: 1) {
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

export async function getPastEvents() {
  const data = await getEvents(pastEventsQuery);

  if (!data) {
    return [];
  }

  const pastEvents: EventType[] = data.groupByUrlname.events.edges.map(
    (edge) => ({
      ...edge.node,
      imageUrl: edge.node.featuredEventPhoto?.standardUrl,
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