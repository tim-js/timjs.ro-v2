import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { getFormattedMeetupName } from "../utils/all.js";

const CACHE_VERSION = 1;

function validPhoto(photo) {
  return (
    photo &&
    ["id", "publicId", "format"].every(
      (key) => typeof photo[key] === "string" && photo[key].length > 0,
    ) &&
    typeof photo.folder === "string" &&
    ["width", "height", "version"].every(
      (key) => Number.isInteger(photo[key]) && photo[key] > 0,
    )
  );
}

function normalizePhoto(resource) {
  const photo = {
    id: resource.asset_id,
    publicId: resource.public_id,
    folder: resource.asset_folder ?? resource.folder ?? "",
    width: resource.width,
    height: resource.height,
    version: resource.version,
    format: resource.format,
  };
  if (!validPhoto(photo)) {
    throw new Error("Cloudinary returned invalid image metadata.");
  }
  return photo;
}

export async function fetchCloudinaryPhotos({
  cloudName,
  apiKey,
  apiSecret,
  fetchImpl = fetch,
}) {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are missing.");
  }

  const photos = new Map();
  const cursors = new Set();
  let cursor;
  do {
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/image/upload`,
    );
    url.searchParams.set("max_results", "500");
    if (cursor) url.searchParams.set("next_cursor", cursor);

    const response = await fetchImpl(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(
        `Cloudinary image listing failed (HTTP ${response.status}).`,
      );
    }
    const data = await response.json();
    if (!Array.isArray(data.resources)) {
      throw new Error("Cloudinary returned an invalid image listing.");
    }
    for (const resource of data.resources) {
      const photo = normalizePhoto(resource);
      photos.set(photo.id, photo);
    }
    cursor = data.next_cursor;
    if (cursor !== undefined && (typeof cursor !== "string" || !cursor)) {
      throw new Error("Cloudinary returned an invalid pagination cursor.");
    }
    if (cursor && cursors.has(cursor)) {
      throw new Error("Cloudinary returned a repeated pagination cursor.");
    }
    if (cursor) cursors.add(cursor);
  } while (cursor);

  return [...photos.values()];
}

async function readCache(cachePath, cloudName) {
  try {
    const cache = JSON.parse(await readFile(cachePath, "utf8"));
    if (
      cache.version === CACHE_VERSION &&
      cache.cloudName === cloudName &&
      typeof cache.fetchedAt === "string" &&
      Number.isFinite(Date.parse(cache.fetchedAt)) &&
      Array.isArray(cache.photos) &&
      cache.photos.every(validPhoto)
    ) {
      return cache;
    }
  } catch {
    // Missing or corrupt caches must never substitute for a successful fetch.
  }
  return null;
}

async function writeCache(cachePath, cache) {
  await mkdir(dirname(cachePath), { recursive: true });
  const temporaryPath = `${cachePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, JSON.stringify(cache), "utf8");
    await rename(temporaryPath, cachePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function loadCloudinaryPhotos({
  cachePath,
  development = false,
  logger = console,
  ...credentials
}) {
  const cache = await readCache(cachePath, credentials.cloudName);
  if (development && cache) {
    logger.info(
      `Using cached Cloudinary metadata (${cache.photos.length} photos).`,
    );
    return cache.photos;
  }

  let photos;
  try {
    photos = await fetchCloudinaryPhotos(credentials);
  } catch (error) {
    if (cache) {
      logger.warn(
        `Cloudinary refresh failed: ${error.message} Using stale metadata from ${cache.fetchedAt} (${cache.photos.length} photos).`,
      );
      return cache.photos;
    }
    if (development) {
      logger.warn(
        `Cloudinary unavailable: ${error.message} No photos in local preview.`,
      );
      return [];
    }
    throw new Error(
      "Cloudinary refresh failed and no valid cache is available.",
      {
        cause: error,
      },
    );
  }

  await writeCache(cachePath, {
    version: CACHE_VERSION,
    cloudName: credentials.cloudName,
    fetchedAt: new Date().toISOString(),
    photos,
  });
  logger.info(`Refreshed Cloudinary metadata (${photos.length} photos).`);
  return photos;
}

export function mapPhotosToEvents(photos, events) {
  const eventsByFolder = new Map();
  for (const event of events) {
    const folder = getFormattedMeetupName(event.title);
    const eventIds = eventsByFolder.get(folder) ?? [];
    eventIds.push(String(event.id));
    eventsByFolder.set(folder, eventIds);
  }
  return photos.flatMap((photo, order) =>
    (eventsByFolder.get(photo.folder) ?? []).map((eventId) => ({
      ...photo,
      id: `${eventId}:${photo.id}`,
      eventId,
      // Collection iteration order can change across Astro versions.
      order,
    })),
  );
}
