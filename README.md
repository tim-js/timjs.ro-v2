# tim.js - Timisoara Javascript Community

tim.js started in 2013 as a monthly meetup and grew into a full-fledged community. We are also a registered NGO called Asociatia TIM.JS.

We encourage knowledge sharing through teaching and learning, thus growing the local community of JavaScript professionals as developers and speakers as well.

This is the website repository, based on the Astroship temaplate, built with Astro & TailwindCSS.

## Installation

This will explain how to get the website code locally and setup everthing so you can run it locally and make changes.

### 1. Clone the repo

```bash
git clone https://github.com/tim-js/timjs.ro-v2
```

### 2. Install Dependencies

Use the Node version in `.nvmrc` (22.22.3). Astro requires Node 22.12.0 or
newer, and `.npmrc` enforces package engine requirements.

```bash
npm ci
```

### 3. Start development Server

```bash
npm run dev
```

### Preview & Build

```bash
npm run preview
npm run build
```

## Project Structure

Inside of this Astro project, you'll see the following folders and files:

```
/
├── public/
│   └── ...
├── src/
│   ├── components/
│   │   └── ...
│   ├── layouts/
│   │   └── ...
│   └── pages/
│       └── ...
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

Any static assets, like images, can be placed in the `public/` directory.

## TailwindCSS

Tailwind CSS 4 runs through its Vite plugin. Theme colors, fonts, typography,
and compatibility styles live in `src/styles/global.css`, imported by both
layouts. It targets Safari 16.4+, Chrome 111+, and Firefox 128+.

## Env variables

See `.env.example` for the required environment variables. You can create a `.env` file in the root of the project and add your own values.
For example if no Youtube API Key is added, meetup videos will not show up locally. Page still loads, but without videos.

## Event photos

Cloudinary hosts and transforms event photos. The website reads image metadata at
build time through the Cloudinary Admin API and exposes it as the `eventPhotos`
content collection. PhotoSwipe displays the original images; thumbnails use a
local Astro component and the framework-independent Cloudinary URL SDK.

Set `PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
`CLOUDINARY_API_SECRET` in the build environment. The old
`PUBLIC_CLOUDINARY_API_KEY` name remains supported for existing deployments.
Credentials are used only by the build-time metadata loader.

- Production builds refresh metadata with cursor pagination (500 images per
  request). Adding photos to an existing event is picked up on the next build.
- The cache at `node_modules/.cache/cloudinary-photos-v1.json` is replaced
  atomically only after a complete, validated fetch. It contains image metadata,
  never API credentials, and is scoped to the Cloudinary cloud name.
- If refreshing fails, a valid cache is used with a warning containing its age
  timestamp. Without a valid cache, the production build fails.
- Local development reuses valid cached metadata. With no cache, it attempts a
  fetch; missing credentials or an unavailable API produces an empty local
  gallery and a warning. Delete the cache and restart the dev server to refresh.
- Cloudinary folder names must exactly match event titles after removing `#`,
  `:`, `?`, and `'`. Both dynamic `asset_folder` and legacy `folder` metadata are
  supported. Unmatched folders are not shown; successful empty galleries are valid.

The new cache intentionally does not reuse the previous integration's cache,
which could contain incomplete results. The first production build therefore
requires working Cloudinary credentials and API access.

Run `npm run test:cloudinary` for pagination, cache recovery, event mapping, and
image URL tests. No Cloudinary credentials are needed for these tests.
