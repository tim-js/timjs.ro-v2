
import { cldAssetsLoader } from 'astro-cloudinary/loaders';
import pastEventsData from '../data/allEvents.json' assert { type: 'json' };
import { getFormattedMeetupName } from '../utils/all.js';
import fs from 'fs';

export async function fetchAllGalleries() {
  const cacheDir = './node_modules/.cache';
  const cachePath = `${cacheDir}/cloudinary-cache.json`;

  // Check if cache exists and is still valid
  let existingCache = null;
  if (fs.existsSync(cachePath)) {
    try {
      existingCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      console.log(`Found existing cache with ${existingCache.eventCount} events`);
    } catch (error) {
      console.log(`Existing cache is invalid, will refetch`);
    }
  }

  // Check if we need to refetch
  const currentEventCount = pastEventsData.length;
  if (existingCache && existingCache.eventCount === currentEventCount) {
    console.log(`Cache is up to date (${currentEventCount} events). Skipping API calls.\n`);
    return;
  }

  if (existingCache) {
    console.log(`Event count changed: ${existingCache.eventCount} -> ${currentEventCount}. Refetching...\n`);
  } else {
    console.log(`No cache found. Fetching from Cloudinary...\n`);
  }

  const cache = {
    lastUpdated: new Date().toISOString(),
    eventCount: currentEventCount,
    galleries: {}
  };

  console.log(`Fetching ALL Cloudinary photos at once with pagination...\n`);

  try {
    // Create the loader WITHOUT specifying a folder - fetches ALL images
    // The loader will automatically handle pagination with max 1000 images per batch
    const loader = cldAssetsLoader({
      limit: 100000, // Set high limit to fetch all images (loader will paginate automatically)
    });

    // Collect all results from the loader
    const allPhotos = [];

    let batchCount = 0;

    // Call loader with mock Astro context
    await loader.load({
      store: {
        set: (entry) => {
          // We store the entire entry as that's what Astro content collections expect
          allPhotos.push(entry);
          // Log progress every 1000 photos
          if (allPhotos.length % 1000 === 0) {
            batchCount++;
            console.log(`Batch ${batchCount}: Fetched ${allPhotos.length} photos so far...`);
          }
        },
        clear: () => {},
        keys: () => [],
      },
      logger: {
        info: (msg) => console.log(`INFO: ${msg}`),
        error: (msg) => console.error(`ERROR: ${msg}`),
        warn: (msg) => console.warn(`WARN: ${msg}`),
      },
      generateDigest: (str) => str,
      meta: {},
      parseData: async (data) => data,
    });

    console.log(`Fetched ${allPhotos.length} total photos`);
    console.log(`Grouping photos by folder...\n`);

    // Group photos by their folder/asset_folder
    const photosByFolder = {};

    for (const photo of allPhotos) {
      // Cloudinary photos have folder information in asset_folder or folder property
      const folder = photo.data.asset_folder || photo.data.folder || 'uncategorized';

      if (!photosByFolder[folder]) {
        photosByFolder[folder] = [];
      }
      photosByFolder[folder].push(photo);
    }

    console.log(`Found ${Object.keys(photosByFolder).length} unique folders`);

    // Map to expected gallery names and validate against pastEvents
    const expectedGalleryNames = new Set(
      pastEventsData.map(event => getFormattedMeetupName(event.title))
    );

    for (const [folder, photos] of Object.entries(photosByFolder)) {
      cache.galleries[folder] = photos;

      const status = expectedGalleryNames.has(folder) ? '[OK]' : '[WARN]';
      console.log(`${status} ${folder}: ${photos.length} photos`);
    }

    // Check for missing galleries
    console.log(`Checking for missing galleries...\n`);
    for (const galleryName of expectedGalleryNames) {
      if (!cache.galleries[galleryName]) {
        console.log(`[WARN] Missing: ${galleryName} (no photos found)`);
        cache.galleries[galleryName] = [];
      }
    }

  } catch (error) {
    console.warn(`⚠️  Failed to fetch from Cloudinary: ${error.message}`);
    console.warn('Images will not be available. Build will continue.\n');

    // Check if we have an existing cache to use
    if (fs.existsSync(cachePath)) {
      console.log('Using existing cache from previous build.\n');
      return;
    }

    // Create empty cache so build doesn't fail
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    fs.writeFileSync(
      cachePath,
      JSON.stringify({
        lastUpdated: new Date().toISOString(),
        eventCount: 0,
        galleries: {}
      }, null, 2)
    );

    console.log('Created empty cache. Build will continue without images.\n');
    return;
  }

  // Save cache
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  fs.writeFileSync(
    cachePath,
    JSON.stringify(cache, null, 2)
  );

  const totalPhotos = Object.values(cache.galleries).reduce((sum, p) => sum + p.length, 0);

  console.log('Cache updated successfully!');
  console.log(`Event count: ${cache.eventCount}`);
  console.log(`Total galleries: ${Object.keys(cache.galleries).length}`);
  console.log(`Total photos: ${totalPhotos}`);
  console.log(`Cache saved to: ${cachePath}\n`);
}
