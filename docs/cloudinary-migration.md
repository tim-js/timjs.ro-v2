# Cloudinary integration migration

## Scope

Replace `astro-cloudinary` while retaining Cloudinary hosting, existing photo
folders, page URLs, thumbnail styling, and PhotoSwipe. Keep Astro at its current
version so the integration change can be reviewed independently of the framework
upgrade. Leave all changes uncommitted in the dedicated worktree.

## Implementation plan

1. Build the unchanged site with existing credentials and preserve its output as
   a baseline for routes, gallery counts, and photo ordering.
2. Replace the manually invoked third-party loader with a build-time Admin API
   fetcher. Paginate with a maximum of 500 resources per request, validate image
   metadata, and reject incomplete responses.
3. Preserve the last successful cache on API failure. Refresh on every production
   build, reuse cached metadata in development, and fail production without a
   usable cache. Save complete results with an atomic rename.
4. Register one typed `eventPhotos` collection. Map exact folder names to stable
   event IDs and update both event pages and galleries to consume it.
5. Replace the two `CldImage` usages with a local responsive image component using
   Cloudinary's URL SDK. Preserve 4:3 automatic crops within the existing 16:9 CSS
   frames and provide untransformed, versioned originals to PhotoSwipe.
6. Test pagination, partial failures, malformed responses, cache scope, offline
   development, and refreshed photos for unchanged events. Compare generated
   gallery counts and ordering with the baseline, then inspect the browser gallery
   and lightbox.

## Deployment considerations

The existing `PUBLIC_CLOUDINARY_API_KEY` environment variable remains accepted;
new setups should use `CLOUDINARY_API_KEY`. No Cloudinary uploads or account
changes are required. The first build must fetch successfully because the unsafe
legacy cache format is not reused. Subsequent successful builds refresh metadata
without clearing the deployment cache.

The cache remains under `node_modules/.cache`; persistence depends on the build
environment. A clean install or cleared deployment cache means an API outage will
fail the build instead of publishing empty galleries. A successful empty API
response is valid and is distinct from an API failure.

This implementation lists uploaded images once per build rather than making one
request per event. The initial baseline contained 1,364 photos in 66 Cloudinary
folders, so a refresh takes three listing requests at the current asset volume.
Exact title-to-folder matching is preserved, including existing unmatched folders;
correcting historical naming mismatches is a separate content change.

Astro's legacy blog/team/speaker configuration is intentionally unchanged. Moving
the content configuration and migrating those collections remains part of the
later Astro upgrade.

## Verification completed

- Clean `npm ci` and production build passed on Node 22.22.3 / Astro 5.18.1.
- The replacement fetched all 1,364 images and generated the same 232 pages as
  the baseline (235 HTML files including redirects).
- Compared every generated HTML route: photo ordering, photo counts, lightbox
  dimensions, and embedded video URLs matched. The 62 populated event galleries
  contain 1,279 photos; the other 85 assets belong to unmatched folders already
  excluded by the old implementation.
- All nine automated Cloudinary tests passed, including preservation of a valid
  cache when a later pagination request fails.
- A production build without credentials or a matching cache failed as intended.
- Browser verification passed for thumbnails, opening originals in PhotoSwipe,
  next-image navigation, and responsive image loading at a 390px viewport.
- Local Prettier checks and `git diff --check` passed.

This verifies the replacement on the current Astro version. Astro 7 and Netlify
deployment verification remain part of the subsequent framework upgrade.
