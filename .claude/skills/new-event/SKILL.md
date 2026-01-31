---
name: new-event
description: Add a new event to the events json by extracting information from a given Luma URL.
allowedTools:
  - Read
  - Edit
  - Glob
  - Write
  - Grep
---

## General info
Look at `src/data/allEvents.json`. I need to add a new event to this file. Use chrome to navigate to this link and extract all the information needed to create a new event entry in the JSON file. No commits or PRs, I will do it manually.

Fetch the event poster image from the same link. Use highest quality available. Save it to `src/assets/meetups/` with the filename being the event title in lowercase with hyphens instead of spaces, and the appropriate image file extension. Use the same filename (with extension) in the `featuredEventPhoto` field of the event JSON.

## Instructions
- use a random guid for the id of the event