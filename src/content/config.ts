// 1. Import utilities from `astro:content`
import { z, defineCollection } from 'astro:content';

// 2. Define your collection(s)
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

// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
  'team': teamCollection,
};