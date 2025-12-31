# 🗄️ Database Setup Instructions

Your Supabase project is ready to connect! Follow these steps to set up the database:

## Step 1: Run Migrations in Supabase SQL Editor

Go to: https://app.supabase.com/project/umblyhwumtadlvgccdwg/editor/sql

### Migration 1: Initial Schema (Core Tables)
1. Click "New Query"
2. Copy and paste the content from: `supabase/migrations/001_initial_schema.sql`
3. Click "Run" (or press Cmd/Ctrl + Enter)
4. Wait for "Success. No rows returned" message

### Migration 2: Seed Data (Sample Data)
1. Click "New Query"
2. Copy and paste the content from: `supabase/migrations/002_seed_data.sql`
3. Click "Run"
4. Wait for success message

### Migration 3: Phase 1 Features (Wellness, Pathway, etc.)
1. Click "New Query"
2. Copy and paste the content from: `supabase/migrations/003_phase1_features.sql`
3. Click "Run"
4. Wait for success message

## Step 2: Verify Tables Created

Go to: https://app.supabase.com/project/umblyhwumtadlvgccdwg/editor

You should see these tables in the left sidebar:
- ✅ profiles
- ✅ houses
- ✅ players
- ✅ chores
- ✅ events
- ✅ event_attendees
- ✅ messages
- ✅ activity_log
- ✅ wellness_logs (Phase 1)
- ✅ training_loads (Phase 1)
- ✅ injuries (Phase 1)
- ✅ college_targets (Phase 1)
- ✅ scout_activities (Phase 1)
- ✅ academic_progress (Phase 1)
- ✅ performance_tests (Phase 1)

## Step 3: Test the App

Once migrations are complete, come back here and I'll:
- ✅ Test the database connection
- ✅ Rebuild the app in production mode
- ✅ Verify everything works

---

**Quick Links:**
- SQL Editor: https://app.supabase.com/project/umblyhwumtadlvgccdwg/editor/sql
- Table Editor: https://app.supabase.com/project/umblyhwumtadlvgccdwg/editor
- API Settings: https://app.supabase.com/project/umblyhwumtadlvgccdwg/settings/api

Let me know when you've run all 3 migrations! 🚀
