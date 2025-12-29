# Supabase Backend Setup Guide
### 1.FC Köln ITP Player App

This guide will walk you through setting up the complete Supabase backend for the ITP Player App.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Database Schema](#database-schema)
4. [Row Level Security](#row-level-security)
5. [Real-time Features](#real-time-features)
6. [Local Development](#local-development)
7. [Production Deployment](#production-deployment)
8. [API Reference](#api-reference)

---

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Git
- Basic SQL knowledge (optional)

---

## Quick Start

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project:
   - **Name:** `itp-player-app` (or your choice)
   - **Database Password:** Save this securely!
   - **Region:** Choose closest to your users
5. Wait for project to initialize (~2 minutes)

### 2. Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 3. Configure Your Application

```bash
# Copy the environment template
cp .env.example .env.local

# Edit .env.local and add your credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Migrations

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project
2. Click **SQL Editor** in the sidebar
3. Create a new query
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste and click **Run**
6. Repeat for `supabase/migrations/002_seed_data.sql`

#### Option B: Using Supabase CLI (Recommended for teams)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 5. Test the Connection

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Navigate to `http://localhost:5173` and try:
- Creating an account
- Logging in
- Viewing the dashboard

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│   auth.users│ (Supabase Auth)
└──────┬──────┘
       │
       │ 1:1
       │
┌──────▼──────┐
│  profiles   │ (User metadata)
└──────┬──────┘
       │
       │ 1:many
       │
┌──────▼──────┐       ┌──────────┐
│  players    │───────│  houses  │
└──────┬──────┘ many:1└──────────┘
       │
       ├─────────────┐
       │             │
┌──────▼──────┐  ┌───▼──────────┐
│  chores     │  │    events    │
│  (assigned) │  │  (calendar)  │
└─────────────┘  └───┬──────────┘
                     │
                     │ many:many
                     │
              ┌──────▼──────────┐
              │ event_attendees │
              └─────────────────┘

┌──────────────┐
│  messages    │ (Internal messaging)
└──────────────┘

┌──────────────┐
│ activity_log │ (Audit trail)
└──────────────┘
```

### Core Tables

#### 1. `profiles`
Extends Supabase auth.users with additional metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | References auth.users.id |
| email | TEXT | User email |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| role | TEXT | `admin`, `staff`, or `player` |
| avatar_url | TEXT | Profile picture URL |

#### 2. `houses`
Housing units for the ITP program.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| name | TEXT | House name (e.g., "Widdersdorf 1") |
| description | TEXT | House description |
| total_points | INTEGER | Accumulated points (auto-calculated) |

#### 3. `players`
Player profiles and statistics.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| user_id | UUID (FK) | References profiles.id |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| position | TEXT | `STRIKER`, `WINGER`, `MIDFIELDER`, `DEFENDER`, `GOALKEEPER` |
| nationality | TEXT | Player nationality |
| age | INTEGER | Age (16-35) |
| house_id | UUID (FK) | References houses.id |
| status | TEXT | `active`, `training`, `rest`, `injured` |
| points | INTEGER | Individual points |

#### 4. `chores`
Task assignments and tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| title | TEXT | Chore title |
| description | TEXT | Detailed description |
| priority | TEXT | `low`, `medium`, `high` |
| points | INTEGER | Points awarded on completion |
| house_id | UUID (FK) | Assigned house |
| assigned_to | UUID (FK) | Assigned player |
| status | TEXT | `pending`, `in_progress`, `completed`, `cancelled` |
| deadline | TIMESTAMPTZ | Due date |
| completed_at | TIMESTAMPTZ | Completion timestamp |

#### 5. `events`
Calendar events and activities.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| title | TEXT | Event title |
| description | TEXT | Event description |
| type | TEXT | `training`, `meeting`, `match`, `assessment`, `social`, `other` |
| start_time | TIMESTAMPTZ | Start time |
| end_time | TIMESTAMPTZ | End time |
| location | TEXT | Event location |
| is_mandatory | BOOLEAN | Required attendance |

#### 6. `messages`
Internal messaging system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| from_user | UUID (FK) | Sender |
| to_user | UUID (FK) | Recipient |
| subject | TEXT | Message subject |
| content | TEXT | Message body |
| is_read | BOOLEAN | Read status |

### Views

#### `player_stats`
Aggregated player statistics including chores and events.

#### `house_leaderboard`
Houses ranked by total points with player count and chore statistics.

---

## Row Level Security (RLS)

All tables have RLS enabled for data security. Here are the key policies:

### Profiles
- ✅ Everyone can **view** all profiles
- ✅ Users can **update** their own profile
- ✅ Admins can **create** profiles

### Players
- ✅ Everyone can **view** players
- ✅ Staff/Admins can **manage** (create, update, delete)

### Chores
- ✅ Everyone can **view** chores
- ✅ Staff can **create/update** chores
- ✅ Assigned players can **update** their own chores (mark complete)

### Houses
- ✅ Everyone can **view** houses
- ✅ Staff/Admins can **manage** houses

### Events
- ✅ Everyone can **view** events
- ✅ Staff/Admins can **manage** events
- ✅ Players can update their **own attendance**

### Messages
- ✅ Users can **view** their sent/received messages
- ✅ Users can **send** messages
- ✅ Recipients can **mark as read**

---

## Real-time Features

The app supports real-time updates using Supabase Realtime:

### Subscriptions Available

```javascript
import { subscriptions } from './lib/supabase-queries'

// Subscribe to player changes
const playersSub = subscriptions.subscribeToPlayers((payload) => {
    console.log('Player changed:', payload)
})

// Subscribe to chores
const choresSub = subscriptions.subscribeToChores((payload) => {
    console.log('Chore changed:', payload)
})

// Subscribe to new messages
const messagesSub = subscriptions.subscribeToMessages(userId, (payload) => {
    console.log('New message:', payload)
})

// Unsubscribe when done
subscriptions.unsubscribe(playersSub)
```

### Automatic Features
- Live house leaderboard updates
- Real-time chore status changes
- Instant message notifications
- Player status updates

---

## Local Development

### Using Supabase CLI (Optional but Recommended)

```bash
# Install
npm install -g supabase

# Initialize (in project root)
supabase init

# Start local Supabase
supabase start

# This starts:
# - PostgreSQL database (port 54322)
# - Supabase Studio (port 54323)
# - API Gateway (port 54321)
# - Email testing (port 54324)

# Update .env.local for local development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>

# Stop local Supabase
supabase stop
```

### Database Migrations

```bash
# Create new migration
supabase migration new add_new_feature

# Apply migrations
supabase db push

# Reset database (WARNING: deletes all data)
supabase db reset
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All migrations applied
- [ ] Environment variables configured
- [ ] RLS policies tested
- [ ] Backups enabled
- [ ] Rate limiting configured
- [ ] Email templates customized

### Deploy Steps

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting** (Vercel, Netlify, etc.)
   - Add environment variables in hosting dashboard
   - Point to production Supabase project

3. **Enable backups** in Supabase dashboard
   - Go to **Database** → **Backups**
   - Enable Point-in-Time Recovery (PITR)

4. **Monitor performance**
   - Check **Logs** for errors
   - Monitor **Database** usage
   - Review **API** usage

### Security Best Practices

1. **Never commit .env.local** to git
2. **Rotate API keys** if compromised
3. **Enable 2FA** on Supabase account
4. **Review RLS policies** regularly
5. **Monitor** activity logs
6. **Limit** API access by IP (if needed)

---

## API Reference

### Quick Examples

#### Authentication

```javascript
import { supabase } from './lib/supabase'

// Sign up
const { data, error } = await supabase.auth.signUp({
    email: 'player@example.com',
    password: 'SecurePassword123',
    options: {
        data: {
            first_name: 'Max',
            last_name: 'Müller',
            role: 'player'
        }
    }
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
    email: 'player@example.com',
    password: 'SecurePassword123'
})

// Sign out
await supabase.auth.signOut()
```

#### Data Queries

```javascript
import { playerQueries, choreQueries } from './lib/supabase-queries'

// Get all players
const players = await playerQueries.getAllPlayers()

// Create a player
const newPlayer = await playerQueries.createPlayer({
    first_name: 'Max',
    last_name: 'Müller',
    position: 'STRIKER',
    nationality: 'Germany',
    age: 19,
    house_id: 'h1',
    status: 'active'
})

// Get pending chores
const chores = await choreQueries.getChoresByStatus('pending')

// Complete a chore
await choreQueries.completeChore(choreId)
```

---

## Troubleshooting

### Common Issues

**Issue:** "Invalid API key"
- **Solution:** Check .env.local has correct VITE_SUPABASE_ANON_KEY

**Issue:** "Row Level Security policy violation"
- **Solution:** Check RLS policies in Supabase dashboard. User might not have permission.

**Issue:** "relation does not exist"
- **Solution:** Migrations not applied. Run migrations in SQL Editor.

**Issue:** "Demo mode active"
- **Solution:** Missing Supabase credentials. Check .env.local file exists.

### Getting Help

- **Supabase Docs:** https://supabase.com/docs
- **Discord:** https://discord.supabase.com
- **GitHub Issues:** [Your repo]/issues

---

## Next Steps

After setup:

1. ✅ Test authentication flow
2. ✅ Create test players
3. ✅ Assign houses
4. ✅ Create chores
5. ✅ Schedule events
6. ✅ Send messages
7. ✅ Monitor real-time updates

---

## Database Backup

### Manual Backup

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Restore
supabase db reset --linked
psql -h localhost -p 54322 -U postgres -d postgres -f backup.sql
```

### Scheduled Backups

Configure in Supabase Dashboard:
- **Database** → **Backups**
- Enable daily backups
- Set retention period (7-30 days)

---

## Performance Optimization

### Indexes
All foreign keys and commonly queried columns are indexed:
- `players.house_id`
- `players.status`
- `chores.assigned_to`
- `chores.deadline`
- `messages.to_user`

### Caching
Consider implementing:
- React Query for client-side caching
- Redis for server-side caching (if using serverless functions)

---

**Last Updated:** December 28, 2025
**Schema Version:** 1.0.0
**Supabase Version:** Latest
