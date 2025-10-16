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

```bash
npm install
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

TailwindCSS is already configured in this repo, so you can start using it without any installation.

## Env variables

See `.env.example` for the required environment variables. You can create a `.env` file in the root of the project and add your own values.
For example if no Youtube API Key is added, meetup videos will not show up locally. Page still loads, but without videos.
