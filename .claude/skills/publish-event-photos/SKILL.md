---
name: publish-event-photos
description: Publish missing tim.js event photos. Use when Codex needs to compare tim.js photo folders shared in Google Drive against Cloudinary event folders, upload only Drive events whose matching Cloudinary folder does not already exist, and trigger the tim.js Netlify project to deploy with a cleared build cache after uploads.
---

# tim.js Event Photo Publishing

## Overview

Publish completed tim.js meetup photo sets that exist in Drive but are missing from Cloudinary, then refresh the public site deployment. Use connected Google Drive, Cloudinary, and Netlify apps whenever available.

## Workflow

### 1. Confirm Connections

- Check Google Drive access before searching. If the `tim.js` or `Event photos` folders are not found, report that the connected Drive account may not have access and suggest switching to an account where those folders are shared.
- Check Cloudinary with a read-only usage or folder lookup before uploading. If authentication is requested, retry after it is accepted.
- Check Netlify with a read-only user or project lookup before triggering a deploy.

### 2. Find Photo Sets in Drive

1. Search shared folders for the tim.js root folder.
   - Prefer raw Drive filters to avoid Google Drive full-text sorting errors:
     - `sharedWithMe = true and name contains 'tim'`
     - `sharedWithMe = true and name contains 'Tim'`
   - The expected shared folder title is `tim.js`.
2. List the `tim.js` folder and find `Event photos`.
3. List `Event photos` and identify meetup folders named like `tim.js 109`.
4. Build a Drive event index from all matching folders:
   - Drive folder pattern: `tim.js <number>`
   - Cloudinary folder pattern: `tim.js meetup <number>`
   - Store the event number, Drive folder name, Drive folder URL, and image count.
5. If the user asks for a specific event, limit the comparison to that event number. Otherwise compare all Drive event folders.
6. Verify the newest event number and date from a public source when useful for confidence:
   - Prefer Luma event pages/calendar because tim.js moved current events to Luma.
   - Use `timjs.ro/meetups/` only as historical fallback; it may lag behind Luma.
7. List image files in each selected Drive folder. Exclude non-image files such as `.DS_Store`.

### 3. Compare Cloudinary Folders

Use the folder naming convention:

```text
tim.js meetup <number>
```

Example:

```text
tim.js meetup 109
```

List or search Cloudinary folders matching `tim.js meetup`. Compare exact folder names against the Drive event index.

For each Drive event:

- If the exact Cloudinary event folder exists, treat that event as already published and do not upload any photos for it.
- If the exact Cloudinary event folder does not exist, add that event to the missing-events list.

If no Cloudinary folders are missing for the selected Drive events:

- Report that Cloudinary is already up to date.
- Stop before the upload and deploy steps, unless the user explicitly asks to redeploy anyway.

Do not delete, overwrite, rename, or add assets in existing Cloudinary folders unless the user explicitly asks.

### 4. Upload Missing Events to Cloudinary

For each missing event, create the exact Cloudinary folder `tim.js meetup <number>`. Then upload each Drive image for that event:

1. Download the raw Drive file to a local file reference or local temporary path.
2. Upload to Cloudinary with:
   - `resource_type: image`
   - `asset_folder` or `folder`: `tim.js meetup <number>` for the event being uploaded
   - `use_filename: true`
   - `unique_filename: false` when the original filenames should be stable
   - tags such as `tim.js`, `meetup`, and `tim.js-<number>`
3. Preserve original filenames where possible.
4. Upload one missing event at a time and use small batches if the connector or network is slow. Report progress for large folders.
5. After uploading, verify the folder by listing/searching Cloudinary assets in that folder and comparing the image count against Drive.

### 5. Trigger Netlify Deploy Without Cache

Use the strongest available no-cache path:

1. Prefer a Netlify build hook configured for the tim.js project and call it with:

```text
clear_cache=true
```

Use `trigger_title=Published+missing+tim.js+photos` if the hook supports query parameters.

2. If no build hook URL is known, look up the tim.js Netlify project by project name. Do not guess a site ID.
3. If the Netlify connector only exposes a normal `deploy-site` action and no cache-clearing option, tell the user that the connector cannot guarantee a cleared cache. Ask whether to trigger the normal deploy anyway or provide/create a build hook.
4. After triggering, report the deploy identifier or URL if available.

## Reporting

End with:

- Drive events checked, with folder URLs and image counts.
- Cloudinary folders that already existed.
- Missing Cloudinary folders that were created.
- Uploaded/verified counts per uploaded event, or state that uploads were skipped because Cloudinary was already up to date.
- Netlify deploy trigger result and whether cache clearing was confirmed, or state that deploy was skipped because no upload occurred.
- Any skipped files or mismatches.

Do not include raw OAuth tokens, build hook secrets, or other credentials in the final response.
