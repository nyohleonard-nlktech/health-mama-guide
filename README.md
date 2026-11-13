# MamaHealth — Health Mama Guide

A health-information and support web application with separate user journeys for pregnancy and girls' health. The current code includes Supabase authentication, profile-based track selection, and dashboard navigation.

> **Health and safety:** This application is not a substitute for qualified medical care, diagnosis, or emergency services. Clinical content must be reviewed by qualified professionals before public use.

## Technology
React 19, TypeScript, TanStack Start, TanStack Router, Vite, Supabase, Tailwind CSS, and Radix UI.

## Requirements
- Node.js compatible with package.json.
- Bun recommended (Bun lockfile is included).
- Supabase project for authentication and profile data.

## Setup
```bash
git clone https://github.com/nyohleonard-nlktech/health-mama-guide.git
cd health-mama-guide
bun install
```

Configure Supabase using the exact variable names referenced in src/integrations/supabase/client.ts. Apply migrations in supabase/migrations/ to a development project. Never commit credentials.

## Development and quality checks
```bash
bun run dev
bun run build
bun run preview
bun run lint
bun run format
```

## Structure
```text
public/
src/
  components/
  hooks/
  integrations/supabase/
  lib/
  routes/
  router.tsx
  server.ts
  styles.css
supabase/migrations/
package.json
vite.config.ts
```

## Privacy and clinical review
Health-related data is sensitive. Collect only necessary information, obtain informed consent, enforce Row Level Security, protect service-role keys, and define retention/deletion policies. Provide clear emergency escalation guidance. The repository contains a root .env file; rotate any exposed credentials and remove tracked secrets from version control.

## License
No license file is present. All rights reserved unless an explicit license is added.
