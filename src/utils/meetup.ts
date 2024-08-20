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

export async function getPastEvents() {
  const response = await fetch(MEETUP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: pastEventsQuery,
      variables: { urlname: COMMUNITY_URLNAME },
    }),
  });

  let events: any[] = [];
  try {
    const { data } = await response.json();
    events = data.groupByUrlname.pastEvents.edges.map((edge) => edge.node);
  } catch (error) {
    console.error(error);
  }
  return events;
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
