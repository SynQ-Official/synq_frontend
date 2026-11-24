# SynQ Patient App

The patient-facing web application of the SynQ platform: onboarding, the guided orientation with Mira, and a calm daily space for check-ins, journaling, reading and progress.

![Next.js](https://img.shields.io/badge/Next.js-16-000000)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

> SynQ supports care and does not replace qualified mental-health professionals or emergency services. AI responses are presented as support, never as a diagnosis.

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology stack](#technology-stack)
4. [Getting started](#getting-started)
5. [Configuration](#configuration)
6. [Architecture and safety boundaries](#architecture-and-safety-boundaries)
7. [Project structure](#project-structure)
8. [Scripts](#scripts)
9. [Deployment](#deployment)
10. [Privacy and security](#privacy-and-security)
11. [Contributing](#contributing)

## Overview

The app is a responsive, multilingual Next.js application. It presents conversations, assessments, loading and error states and progress, while the SynQ API owns authentication, authorisation, clinical decisions, AI orchestration, validation and every access to protected data.

## Features

| Area | Description |
|---|---|
| Authentication | Sign-in, registration, password reset |
| Orientation | Guided conversation with Mira (streamed answers) and the orientation result |
| Dashboard | Daily check-in, journal, mood, progress, reports, library, Spark task planning, appointments, resources and settings |
| Lumina and tracks | Adaptive support experience and guided audio and calm tracks |
| Support and trust | Help pages and information on privacy and safety |
| Live updates | A single server-sent-events stream for alerts and notifications |
| Internationalisation | Multilingual interface with language-aware layout and theme switching |

## Technology stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, Radix UI primitives
- Framer Motion, GSAP and Lenis for motion
- Recharts for charts
- Socket.IO client
- ESLint

## Getting started

**Prerequisites:** Node.js 20+, npm (or pnpm / yarn), a modern browser, and a running SynQ API.

```bash
cd synq_frontend
npm install
cp .env.local.example .env.local      # then adjust NEXT_PUBLIC_API_URL
npm run dev
```

Open `http://localhost:3000`.

### Local ports used in this documentation

| Application | Port |
|---|---|
| SynQ API | `5000` |
| Patient app (this project) | `3000` |
| Psychologist app | `3005` |
| Back-office | `3002` |

The three values that must agree are the API `PORT`, this app's `NEXT_PUBLIC_API_URL` and the API's `CORS_ORIGINS`. The sample `.env.example` shows another valid split (API on `3000`, this app on `3001` with `npm run dev -- -p 3001`).

## Configuration

Create `.env.local` from `.env.local.example`. Use placeholders only and never commit real secrets.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the SynQ API, without a trailing slash and without `/api/v1`. Baked in at build time |
| `API_SERVICE_URL` | Optional, server-side only: internal URL used by the Next.js server (same-origin proxy) |
| `NEXT_PUBLIC_SITE_URL` | Public origin of the site, used for canonical URLs, `sitemap.xml`, `robots.txt` and `og:image` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional Search Console verification value |
| `ELEVENLABS_*`, `AI_SERVICE_URL`, `NEXT_PUBLIC_CHATBOT_URL` | Optional or legacy services; see `.env.example` |

The browser calls the API directly, including the live connections, which never pass through a Next.js rewrite or route handler:

- `GET /api/v1/events`: one stream for the whole patient shell
- `POST /api/v1/mira/session/:id/message/stream`, `/api/v1/me/lumina/chat/stream` and `/api/v1/me/spark/chat/stream`

Consequently the API's `CORS_ORIGINS` must list this app's origin, and changing `NEXT_PUBLIC_API_URL` requires a rebuild. Test streaming and live updates with a production build (`npm run build && npm run start`), because the development server buffers differently from production hosting.

## Architecture and safety boundaries

```text
Browser ──► SynQ API (REST + SSE) ──► PostgreSQL, AI engines (Mira, Journal, Check-in, Spark)
```

- The frontend must not execute privileged tools or reach protected data sources directly.
- Tokens are issued and refreshed by the API; the app only presents the session.
- Every user-visible AI response is framed as support, with its uncertainty acknowledged.

## Project structure

```text
synq_frontend/
├── app/                 App Router: auth, dashboard, orientation, mira, lumina, tracks,
│                        support, trust, welcome, password reset, SEO (sitemap, robots, og)
├── components/          UI grouped by domain (auth, dashboard, diagnostic, home, layout,
│                        patient, providers, shared, support, tracks, trust, ui)
├── contexts/            Language, theme and audio providers
├── features/            Feature modules (diagnostic)
├── hooks/               Session, event stream, media and patient-data hooks
├── lib/                 api, config, i18n, patient, socket, storage and utilities
├── public/              Static assets
├── doc/                 Design documentation
├── next.config.ts
└── package.json
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

Run `npm run lint` and `npm run build` before opening a pull request.

## Deployment

Build with `npm run build` and deploy to a platform such as Vercel, or in a container. Manage environment variables in the platform's secret store, never in the repository. Set `NEXT_PUBLIC_API_URL` to the production API URL before building, and add the production origin to the API's `CORS_ORIGINS`.

## Privacy and security

- Do not commit real user records, credentials, tokens or private identifiers.
- Do not use real patient data in development, tests or screenshots.
- Keep environment and deployment settings in secure secret stores.
- Report security issues privately to the maintainers.

## Contributing

1. Create a focused feature branch.
2. Follow the existing folder and component conventions.
3. Run linting and a production build before requesting review.
4. Make sure no sensitive or personal data is added.

## License

Proprietary. No public license is declared; do not reproduce or distribute the code without the owners' permission.
