/** */
export const getFormattedDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-us", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

// Characters to remove from meetup titles for cleaner identifiers
const CHARACTERS_TO_REMOVE = ['#', ':', '?', "'"];
export const getFormattedMeetupName = (title) => {
  return CHARACTERS_TO_REMOVE.reduce(
    (formattedTitle, char) => formattedTitle.replaceAll(char, ''),
    title
  );
};