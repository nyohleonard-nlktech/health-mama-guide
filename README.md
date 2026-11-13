# MamaHealth — Health Mama Guide

**A health-information and support web application with separate user journeys for pregnancy and girls' health.**

The landing page identifies two user tracks (`pregnant` and `girls`), Supabase authentication, profile-based track selection, and a dashboard route for signed-in users. The application is built with React, TypeScript, TanStack Start, and Supabase.

> **Health and safety:** This software is an informational/support product, not a substitute for qualified medical care, diagnosis, or emergency services. Do not use it to make urgent clinical decisions.

## Application overview

- Public landing page and feature information.
- Sign-in and authenticated user experience.
- User profile lookup and track selection.
- Separate pregnancy and girls' health journeys.
- Dashboard-oriented navigation.
- Supabase integration and database migrations.

The exact health content and workflows should be reviewed by qualified local health professionals before public use.

## Technology

React 19, TypeScript, TanStack Start, TanStack Router, Vite, Supabase, Tailwind CSS, and Radix UI.

## Requirements

- Node.js compatible with the versions in `package.json`
- Bun recommended (the repository includes a Bun lockfile)
- Supabase project for authentication and profile data

## Installation

```bash
git clone https://github.com/nyohleonard-nlktech/health-mama-guide.git
cd health-mama-guide
bun install
```

Configure the Supabase URL and public client key using the exact variable names referenced in `src/integrations/supabase/client.ts`. Create a local environment file; never commit secrets.

Apply the SQL migrations in `supabase/migrations/` to a development Supabase project and verify Row Level Security policies.

## Development

```bash
bun run dev
```

## Build and checks

```bash
bun run build
bun run preview
bun run lint
bun run format
```

## Project structure

```text
.
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── integrations/supabase/
│   ├── lib/
│   ├── routes/
│   ├── router.tsx
│   ├── server.ts
│   └── styles.css
├── supabase/
│   └── migrations/
├── package.json
└── vite.config.ts
```

## Privacy, security, and clinical review

Health-related data is sensitive. Before handling real users' information:
- Collect only data necessary for a clearly stated purpose.
- Obtain informed consent and document retention/deletion practices.
- Enforce least-privilege access and Row Level Security.
- Never expose service-role keys in browser code.
- Have health content reviewed by qualified professionals and localized for the intended population.
- Provide clear escalation guidance for emergencies and high-risk symptoms.

A root `.env` file is present in the repository. Treat any credentials that may have been committed as exposed and rotate them.

## License

No license file is currently present. All rights reserved unless an explicit license is added.
