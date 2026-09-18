import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import allEvents from "../data/allEvents.json";
import {
  loadCloudinaryPhotos,
  mapPhotosToEvents,
} from "../lib/cloudinary-assets.js";
import { resolve } from "node:path";

const eventPhotos = defineCollection({
  loader: async () => {
    const photos = await loadCloudinaryPhotos({
      cloudName: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey:
        import.meta.env.CLOUDINARY_API_KEY ||
        import.meta.env.PUBLIC_CLOUDINARY_API_KEY,
      apiSecret: import.meta.env.CLOUDINARY_API_SECRET,
      cachePath: resolve("node_modules/.cache/cloudinary-photos-v1.json"),
      development: import.meta.env.DEV,
    });
    return mapPhotosToEvents(photos, allEvents);
  },
  schema: z.object({
    eventId: z.string(),
    publicId: z.string(),
    folder: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    version: z.number().int().positive(),
    format: z.string(),
  }),
});

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
  eventPhotos,
};
