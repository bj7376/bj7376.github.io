# Byoungjae Kim — Portfolio & Birding Archive

Source for [byoungjaekim.com](https://byoungjaekim.com).

This repository contains two related but separate content systems:

- **Portfolio** content is managed with **Sanity**.
- **Birding** data is stored in **Supabase** and read directly by the Next.js app.
- **Birding is not connected to Sanity.**

The site is built with Next.js App Router and deployed on Vercel from the `main` branch.

## Stack

- Next.js 16 / React 19
- Vercel
- Sanity — portfolio CMS
- Supabase — birding database and import backend
- Space Mono — English UI
- D2Coding — Korean bird names and Korean text

## Main routes

- `/` — Bio / Home
- `/work` — Work index
- `/work/[slug]` — Project pages
- `/birding` — Personal bird guide
- `/birding/species/[code]` — Species detail
- `/birding/photographs` — Photograph archive
- `/admin` — hidden birding CSV uploader; marked `noindex`

## Repository structure

### Portfolio / Sanity

Portfolio data is queried from Sanity in:

- `lib/sanity.ts`
- `lib/projects.ts`
- `components/SanityContent.tsx`
- `app/page.tsx`
- `app/work/**`

Sanity project:

- Project ID: `v7yxu61r`
- Dataset: `production`

The Sanity Studio lives in `studio/`. Its schemas are in `studio/schemaTypes/`.

Current document types include:

- Bio
- project
- publication
- award
- exhibition
- siteSettings
- journal post

Journal-related code exists but is currently not part of the active public site.

Published portfolio content is read through the Sanity Data API. Editing content or accessing non-public Sanity resources still requires access to the Sanity project.

### Birding / Supabase

Birding is independent from Sanity.

The main data assembly code is in:

- `lib/birding.ts`
- `lib/birding-status.ts`
- `app/birding/**`
- `components/BirdSearch.tsx`
- `components/BirdOrderIndex.tsx`
- `components/BirdingLanguageToggle.tsx`
- `components/PhotoArchive.tsx`
- `components/AdminBirdingUploader.tsx`

Supabase project:

- Project: `Byoungjae Kim Birding`
- Project ref: `ifqrvugxfmeclaqadqbd`

The public site currently reads birding data from Supabase REST endpoints using the public anon role.

Important database resources used by the frontend include:

- `taxa`
- `media`
- `checklists`
- `locations`
- `public_species_locations`
- `birding_update_status`

Private bookkeeping and admin authentication data should remain inaccessible to the public anon role.

The species pages separate media explicitly into photo, video, and audio. Photo-only logic must be preserved when choosing representative images.

## Updating birding data

Birding data is currently maintained by **manual CSV import** through `/admin`.

Do not assume that Macaulay Library or eBird are automatically synchronized with this site.

The current admin page accepts two complete CSV exports:

1. **eBird — Checklists**
   - Download the **My eBird Data CSV directly from the eBird account**.
   - The site does not fetch this CSV from eBird automatically.
   - Uploading this file updates checklist data and also runs the observation-location import.

2. **Macaulay Library — All media**
   - Download a combined Macaulay Library CSV export containing Photo, Video, and Audio records.
   - Upload the complete export rather than a hand-edited partial file.

The admin uploader sends these files to Supabase Edge Functions:

- `admin-birding-import` — Macaulay Library media import and admin status
- `admin-ebird-import` — eBird checklist import
- `admin-ebird-observations` — observation-location import from the eBird CSV

Existing Macaulay assets and eBird checklists are updated by their IDs.

A practical update sequence is:

1. Download a fresh **My eBird Data CSV from eBird**.
2. Download a fresh combined **Macaulay Library All media CSV**.
3. Open `/admin`.
4. Unlock the uploader with the birding admin key.
5. Upload the eBird CSV.
6. Upload the Macaulay CSV.
7. Reload the public Birding pages to see the latest database state.

The admin key is intentionally not stored in plaintext in this repository. If the key is unavailable, rotate or inspect the corresponding private Supabase-side configuration rather than adding the key to source control.

## Birding behavior to preserve

The Birding section is intended as a personal field guide / archive rather than a statistics dashboard.

Current behavior includes:

- English / Korean common-name toggle; English by default
- scientific names remain unchanged by the language toggle
- simultaneous English, Korean, and scientific-name search
- taxonomy organized as Order → Family → Species
- recent photographs based on recency, not rating
- separate photograph archive
- Macaulay Library source links for media
- eBird checklist links for related checklists
- last CSV update date shown on the Birding page

Avoid exposing unnecessary observation counts, ratings, or dashboard-style statistics unless the design direction explicitly changes.

Before changing representative-photo behavior, inspect `getHeroPhoto()` in `lib/birding.ts`; do not assume whether the current implementation is recency- or rating-based.

## Admin and security notes

- `/admin` is hidden from normal navigation and marked `noindex`.
- The admin key must never be committed in plaintext.
- Never expose a Supabase service-role key in frontend code or this repository.
- The Supabase anon key is a public client credential; access control must be enforced by database permissions / RLS.
- `.env*` files are ignored by Git.
- Sanity editing permissions, Supabase project administration, and Vercel project administration are separate from GitHub repository access.

A developer with only the repository can understand most of the application architecture and public data flow, but cannot administer Sanity, Supabase, or Vercel without separate account access.

## Local development

Install dependencies at the repository root:

```bash
npm install
npm run dev
```

The Next.js site will run with the public Sanity and Supabase configuration already referenced by the code, subject to the corresponding backends' public permissions.

For the Sanity Studio:

```bash
cd studio
npm install
npm run dev
```

Using the Studio for actual content editing requires authorization to the Sanity project.

## Deployment

Production hosting is on Vercel.

Normal frontend workflow:

1. Read the latest `main` branch before making changes.
2. Make the change.
3. Commit to `main`.
4. Confirm the GitHub commit status reported by Vercel is successful.

Do not rely on old local copies or previous conversation state as the source of truth for current code.

## Domain

- Domain: `byoungjaekim.com`
- Registrar / DNS: Gabia
- Hosting: Vercel
- Apex and `www` are connected to Vercel

For DNS problems, distinguish authoritative/public DNS state from local or institutional DNS caching before changing application code.

## Design direction

The site intentionally uses a minimal editorial layout:

- white background
- black / gray UI
- full-color photography
- approximately 1000 px global content width
- minimal labels and chrome
- content-first presentation
- responsive layouts for desktop and mobile

Avoid generic SaaS/dashboard styling or large redesigns unless explicitly intended.
