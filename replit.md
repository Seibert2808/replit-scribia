# Scribia

A Portuguese-language event and lecture management platform for organizers, speakers, and participants, backed by Supabase.

## Run & Operate

- `pnpm --filter @workspace/scribia run dev` — run the Scribia web app (port 18777)
- `pnpm --filter @workspace/scribia-site run dev` — run the public landing site (port 18778)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- Required secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, wouter v3 (routing)
- Auth & DB: Supabase (`@supabase/supabase-js`)
- Icons: lucide-react

## Where things live

- `artifacts/scribia/src/App.tsx` — root router with auth guards and role-based redirects
- `artifacts/scribia/src/lib/supabase.ts` — Supabase browser client
- `artifacts/scribia/src/hooks/use-auth.ts` — useAuth hook
- `artifacts/scribia/src/pages/` — all pages (auth, dashboard, admin, speaker, portal)
- `artifacts/scribia/src/components/` — UI + layout components
- `artifacts/scribia/src/index.css` — Tailwind v4 design tokens (colors, fonts)
- `artifacts/scribia-site/` — public landing site (Vite + React 18 + react-router + Tailwind v3); deployed at scribia-site.vercel.app from github.com/Seibert2808/scribia-site

## Architecture decisions

- Wouter v3 is used instead of Next.js router — `useNavigate` does not exist; use `useLocation()` which returns `[path, navigate]`
- Supabase secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are injected into the Vite bundle via `define` in `vite.config.ts` since Replit secrets are not auto-exposed to `import.meta.env`
- Role-based access: `super_admin` → `/admin`, `organizer` → `/dashboard`, `speaker` → `/speaker/dashboard`, participant → `/portal`
- Auth guards are `ProtectedDashboard` and `ProtectedAdmin` wrapper components in App.tsx

## Product

- **Organizer dashboard**: manage events, lectures, speakers, participants, materials, reports, AI prompts
- **Admin panel**: manage organizers, events, invitations, AI settings
- **Speaker portal**: view assigned lectures, manage profile
- **Participant portal**: view events and content

## User preferences

- Portuguese (Brazilian) language throughout the UI
- Purple brand color (`#7C5CBF`) with Tailwind v4 custom tokens

## Gotchas

- Wouter v3: always use `useLocation()` not `useNavigate()` — the latter doesn't exist
- Supabase env vars must be injected via Vite `define` — Replit secrets aren't auto-exposed as `import.meta.env.VITE_*`
- The `VITE_SUPABASE_URL` must start with `https://` (e.g. `https://xxxx.supabase.co`)
- `scribia-site` uses React 18 + @types/react@18; the workspace catalog is on React 19. The two coexist (each app has its own `react` resolved by pnpm), but `scribia-site` does NOT have a `typecheck` script because tsc gets confused by hoisted React 19 types from other workspace packages. Upgrading `scribia-site` to React 19 is a future task for the dev team.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
