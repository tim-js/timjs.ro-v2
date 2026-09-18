import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fetchCloudinaryPhotos,
  loadCloudinaryPhotos,
  mapPhotosToEvents,
} from "../src/lib/cloudinary-assets.js";
import { cloudinaryImageUrl } from "../src/lib/cloudinary-images.js";

const credentials = { cloudName: "demo", apiKey: "key", apiSecret: "secret" };
const resource = {
  asset_id: "asset-1",
  public_id: "photos/example",
  asset_folder: "tim.js meetup 109",
  width: 1600,
  height: 1200,
  version: 123,
  format: "jpg",
};
const logger = { info() {}, warn() {} };
const response = (resources, next_cursor) =>
  Response.json({ resources, ...(next_cursor ? { next_cursor } : {}) });

async function cacheOptions(t) {
  const directory = await mkdtemp(join(tmpdir(), "timjs-cloudinary-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { ...credentials, logger, cachePath: join(directory, "photos.json") };
}

test("paginates in batches of 500, deduplicates assets, and prefers dynamic folders", async () => {
  const requests = [];
  const photos = await fetchCloudinaryPhotos({
    ...credentials,
    fetchImpl: async (url, options) => {
      requests.push(url);
      assert.equal(url.searchParams.get("max_results"), "500");
      assert.equal(options.headers.Authorization, "Basic a2V5OnNlY3JldA==");
      return requests.length === 1
        ? response([{ ...resource, folder: "old-folder" }], "page-2")
        : response([resource, { ...resource, asset_id: "asset-2" }]);
    },
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].searchParams.get("next_cursor"), "page-2");
  assert.equal(photos.length, 2);
  assert.equal(photos[0].folder, resource.asset_folder);
});

test("supports fixed folders and maps exact folder names to stable event IDs", async () => {
  const photos = await fetchCloudinaryPhotos({
    ...credentials,
    fetchImpl: async () =>
      response([
        { ...resource, asset_folder: undefined, folder: "tim.js meetup 109" },
      ]),
  });
  const entries = mapPhotosToEvents(photos, [
    { id: "event-109", title: "tim.js meetup #109" },
    { id: "event-10", title: "tim.js meetup #10" },
  ]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].eventId, "event-109");
  assert.equal(entries[0].id, "event-109:asset-1");
});

test("keeps a valid cache byte-for-byte after a later pagination request fails", async (t) => {
  const options = await cacheOptions(t);
  const initial = await loadCloudinaryPhotos({
    ...options,
    fetchImpl: async () => response([resource]),
  });
  const previousCache = await readFile(options.cachePath, "utf8");
  let calls = 0;
  const warnings = [];
  const photos = await loadCloudinaryPhotos({
    ...options,
    logger: { ...logger, warn: (message) => warnings.push(message) },
    fetchImpl: async () =>
      ++calls === 1
        ? response([{ ...resource, asset_id: "new-asset" }], "next")
        : new Response(null, { status: 429 }),
  });
  assert.deepEqual(photos, initial);
  assert.equal(calls, 2);
  assert.equal(await readFile(options.cachePath, "utf8"), previousCache);
  assert.match(warnings[0], /stale metadata/);
});

test("production refreshes cached metadata when photos change without event changes", async (t) => {
  const options = await cacheOptions(t);
  await loadCloudinaryPhotos({
    ...options,
    fetchImpl: async () => response([resource]),
  });
  const updated = await loadCloudinaryPhotos({
    ...options,
    fetchImpl: async () =>
      response([resource, { ...resource, asset_id: "new-photo" }]),
  });
  assert.equal(updated.length, 2);
  assert.equal(
    JSON.parse(await readFile(options.cachePath, "utf8")).photos.length,
    2,
  );
});

test("fails a production build without a valid cache and never writes partial data", async (t) => {
  const options = await cacheOptions(t);
  await writeFile(options.cachePath, "corrupt cache");
  await assert.rejects(
    loadCloudinaryPhotos({
      ...options,
      fetchImpl: async () => new Response(null, { status: 401 }),
    }),
    /no valid cache/,
  );
  assert.equal(await readFile(options.cachePath, "utf8"), "corrupt cache");
});

test("never reuses a different Cloudinary account's cache", async (t) => {
  const options = await cacheOptions(t);
  await loadCloudinaryPhotos({
    ...options,
    fetchImpl: async () => response([resource]),
  });
  await assert.rejects(
    loadCloudinaryPhotos({
      ...options,
      cloudName: "another-account",
      fetchImpl: async () => new Response(null, { status: 500 }),
    }),
    /no valid cache/,
  );
});

test("development reuses cache and allows offline preview without writing an empty cache", async (t) => {
  const options = await cacheOptions(t);
  const empty = await loadCloudinaryPhotos({
    ...options,
    development: true,
    apiSecret: undefined,
  });
  assert.deepEqual(empty, []);
  await assert.rejects(readFile(options.cachePath), { code: "ENOENT" });
  await loadCloudinaryPhotos({
    ...options,
    fetchImpl: async () => response([resource]),
  });
  const cached = await loadCloudinaryPhotos({
    ...options,
    development: true,
    fetchImpl: async () => {
      throw new Error("Should not fetch in dev with a valid cache");
    },
  });
  assert.equal(cached.length, 1);
});

test("accepts an empty successful listing but rejects malformed data and cursor loops", async () => {
  assert.deepEqual(
    await fetchCloudinaryPhotos({
      ...credentials,
      fetchImpl: async () => response([]),
    }),
    [],
  );
  for (const body of [
    {},
    { resources: [{ ...resource, width: 0 }] },
    { resources: [], next_cursor: 42 },
  ]) {
    await assert.rejects(
      fetchCloudinaryPhotos({
        ...credentials,
        fetchImpl: async () => Response.json(body),
      }),
      /invalid/,
    );
  }
  await assert.rejects(
    fetchCloudinaryPhotos({
      ...credentials,
      fetchImpl: async () => response([resource], "same"),
    }),
    /repeated/,
  );
});

test("creates responsive transformed URLs and versioned originals without analytics", () => {
  const photo = { publicId: "event folder/image", version: 123, format: "jpg" };
  const thumbnail = cloudinaryImageUrl("demo", photo, 800);
  assert.match(thumbnail, /c_fill,g_auto,h_600,w_800/);
  assert.match(thumbnail, /f_auto\/q_auto\/v123\/event%20folder\/image/);
  assert.equal(new URL(thumbnail).search, "");
  const original = cloudinaryImageUrl("demo", photo);
  assert.equal(
    original,
    "https://res.cloudinary.com/demo/image/upload/v123/event%20folder/image.jpg",
  );
  assert.throws(
    () => cloudinaryImageUrl(undefined, photo),
    /CLOUDINARY_CLOUD_NAME/,
  );
});
