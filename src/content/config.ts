// 1. Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";
import allEvents from "../data/allEvents.json";
import { getFormattedMeetupName } from "@utils/all";
import fs from "fs";
import path from "path";

// Handle loading Cloudinary data
import { fetchAllGalleries } from "../scripts/cloudinaryLoader.js";
try {
  await fetchAllGalleries();
} catch (error) {
  console.warn("⚠️  Failed to fetch Cloudinary galleries:", error.message);
  console.warn("Build will continue without images.\n");
}

// Load cloudinary cache if it exists
const cachePath = path.join(process.cwd(), "node_modules/.cache/cloudinary-cache.json");
let cloudinaryCache = { galleries: {} };

if (fs.existsSync(cachePath)) {
  cloudinaryCache = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
}

// Load image galleries from cache instead of making API calls
const imageGalleries = {};
for (const event of allEvents) {
  const galleryName = getFormattedMeetupName(event.title);
  imageGalleries[galleryName] = defineCollection({
    loader: () => {
      // Return cached data for this gallery
      return cloudinaryCache.galleries[galleryName] || [];
    }
  });
}

// 2. Define your collection(s)
const blogCollection = defineCollection({
  schema: z.object({
    draft: z.boolean(),
    title: z.string(),
    snippet: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    publishDate: z.string().transform((str) => new Date(str)),
    author: z.string().default("timjscommunity"),
    category: z.string(),
    tags: z.array(z.string()),
  }),
});

const teamCollection = defineCollection({
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      title: z.string(),
      company: z.string(),
      avatar: z.object({
        src: image(),
        alt: z.string(),
      }),
      sort: z.number(),
    }),
});

const speakersCollection = defineCollection({
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      title: z.string(),
      avatar: z.object({
        src: image(),
        alt: z.string(),
      }),
    }),
});

// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
  blog: blogCollection,
  team: teamCollection,
  speakers: speakersCollection,
  ...imageGalleries,
};
