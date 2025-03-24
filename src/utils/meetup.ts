import type { EventType } from "types/types";
import pastMeetups from "../data/oldMeetups";

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
            photoAlbum {
            id
            title
            photoCount
            photoSample(amount: 10) { 
              id
              baseUrl
              }
          }
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
            photoAlbum {
            id
            title
            photoCount
            photoSample(amount: 10) { 
              id
              baseUrl
            }
          }
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
       photoAlbum {
            id
            title
            photoCount
            photoSample(amount: 50) { 
              id
              baseUrl
            }
          }
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

function addShortDescription(event: EventType): EventType {
  const pastEvent = pastMeetups.find((e) => e.id === event.id);

  return {
    ...event,
    shortDescription:
      pastEvent?.shortDescription || event.description.split("***")?.[0] || "",
  };
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

  return pastEvents.filter(isMeetupEvent).map(addShortDescription);
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

// export async function getEventPhotos(eventId: string) {
//   // const url = `https://api.meetup.com/${COMMUNITY_URLNAME}/events/${eventId}/photos`;
//   // const response = await fetch(url, {
//   //   method: "GET",
//   //   headers: {
//   //     "Content-Type": "application/json",
//   //     Accept: "application/json",
//   //   },
//   // });

//   const response = await fetch(MEETUP_ENDPOINT, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       query: photosQuery,
//       variables: { eventId },
//     }),
//   });

//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(
//       "Error fetching event photos:",
//       response.status,
//       response.statusText,
//       errorText
//     );
//     return [];
//   }

//   const photos = await response.json();
//   if (!photos.length) {
//     console.log("No gallery photos found");
//     return [];
//   }
//   return photos;
// }
