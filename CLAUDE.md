# ITP Player App

## Quick Reference

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build (outputs to /dist)
npm run preview  # Preview production build
```

## Test Accounts
- Demo mode works without credentials (localStorage fallback)
- SSO from Staff App (no password needed)

---

## Project Overview
Player-facing dashboard for FC Köln International Talent Program. Players track wellness, view schedules, complete chores, and order groceries.

## Tech Stack
- **Frontend:** Vite + React 18 (JavaScript/JSX)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Styling:** Custom CSS with glassmorphism design
- **Deploy:** Vercel
- **Live URL:** https://itp-player-app.vercel.app

## Key Directories
- `/src/pages` - Page components (Dashboard, Wellness, Calendar, etc.)
- `/src/components` - Reusable components organized by feature
- `/src/contexts` - AuthContext, RealtimeContext, NotificationContext
- `/src/hooks` - Custom hooks (useRealtimeChores, useRealtimeWellness, etc.)
- `/src/lib` - Supabase client, queries, data service
- `/supabase/migrations` - Database schema

## Related Projects
- **ITP Staff App:** `~/projects/ITP-Staff-App` - Staff operations hub (shares same Supabase)
- **Scout Platform:** `~/projects/-WARUBI-Scout-Platform` - Scout CRM

## Authentication
- Email/password sign-in
- Magic link sign-in (primary for players)
- SSO from Staff App (receives tokens via URL params)
- Password setup modal for magic link users

## Key Features
- **Dashboard:** Readiness gauge, daily check-in, next objective guidance
- **Wellness:** Daily logging (sleep, energy, soreness, stress, mood)
- **Housing:** House-based gamification with XP points
- **Chores:** Task completion with points
- **Grocery:** €35 budget ordering, twice weekly delivery
- **Calendar:** Training sessions, matches, events
- **Pathway:** College recruitment tracking

## Demo Mode
When Supabase not configured, app falls back to localStorage-based demo mode with sample data. Same API interface, transparent to components.

## Database Tables (Shared with Staff App)
- `profiles` - User accounts & roles
- `players` - Player profiles & stats
- `houses` - Housing units
- `chores` - Task assignments
- `events` - Calendar events
- `wellness_logs` - Daily check-ins
- `training_loads` - Training sessions
- `grocery_orders` / `grocery_items` - Food ordering

## Supabase Project
- ID: `umblyhwumtadlvgccdwg`
- Shared with ITP Staff App
