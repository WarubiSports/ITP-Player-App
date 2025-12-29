-- ITP Player App - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    first_name text,
    last_name text,
    role text default 'player' check (role in ('player', 'staff', 'admin')),
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, first_name, last_name, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'first_name', ''),
        coalesce(new.raw_user_meta_data->>'last_name', ''),
        coalesce(new.raw_user_meta_data->>'role', 'player')
    );
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ============================================
-- HOUSES TABLE
-- ============================================
create table if not exists public.houses (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    address text,
    total_points integer default 0,
    created_at timestamptz default now()
);

alter table public.houses enable row level security;

create policy "Houses viewable by authenticated users"
    on public.houses for select
    to authenticated
    using (true);

create policy "Staff can modify houses"
    on public.houses for all
    using (
        exists (
            select 1 from public.profiles 
            where id = auth.uid() 
            and role in ('staff', 'admin')
        )
    );

-- ============================================
-- PLAYERS TABLE
-- ============================================
create table if not exists public.players (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id),
    first_name text not null,
    last_name text not null,
    position text,
    nationality text,
    age integer,
    house_id uuid references public.houses(id),
    status text default 'active' check (status in ('active', 'training', 'rest', 'injured')),
    points integer default 0,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.players enable row level security;

create policy "Players viewable by authenticated users"
    on public.players for select
    to authenticated
    using (true);

create policy "Staff can modify players"
    on public.players for all
    using (
        exists (
            select 1 from public.profiles 
            where id = auth.uid() 
            and role in ('staff', 'admin')
        )
    );

-- ============================================
-- CHORES TABLE
-- ============================================
create table if not exists public.chores (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    priority text default 'medium' check (priority in ('low', 'medium', 'high')),
    house_id uuid references public.houses(id),
    assigned_to uuid references public.players(id),
    status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
    points integer default 10,
    deadline date,
    completed_at timestamptz,
    created_at timestamptz default now()
);

alter table public.chores enable row level security;

create policy "Chores viewable by authenticated users"
    on public.chores for select
    to authenticated
    using (true);

create policy "Staff can modify chores"
    on public.chores for all
    using (
        exists (
            select 1 from public.profiles 
            where id = auth.uid() 
            and role in ('staff', 'admin')
        )
    );

create policy "Players can update their assigned chores"
    on public.chores for update
    using (
        exists (
            select 1 from public.players 
            where id = chores.assigned_to 
            and user_id = auth.uid()
        )
    );

-- ============================================
-- EVENTS TABLE
-- ============================================
create table if not exists public.events (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    type text default 'training' check (type in ('training', 'meeting', 'match', 'assessment', 'other')),
    date date not null,
    start_time time,
    end_time time,
    location text,
    created_by uuid references public.profiles(id),
    created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Events viewable by authenticated users"
    on public.events for select
    to authenticated
    using (true);

create policy "Staff can modify events"
    on public.events for all
    using (
        exists (
            select 1 from public.profiles 
            where id = auth.uid() 
            and role in ('staff', 'admin')
        )
    );

-- ============================================
-- MESSAGES TABLE
-- ============================================
create table if not exists public.messages (
    id uuid default uuid_generate_v4() primary key,
    from_user uuid references public.profiles(id) not null,
    to_user uuid references public.profiles(id) not null,
    subject text,
    content text not null,
    is_read boolean default false,
    created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can view their messages"
    on public.messages for select
    using (
        auth.uid() = from_user or auth.uid() = to_user
    );

create policy "Users can send messages"
    on public.messages for insert
    with check (auth.uid() = from_user);

create policy "Recipients can mark as read"
    on public.messages for update
    using (auth.uid() = to_user);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Sample houses
insert into public.houses (id, name, address, total_points) values
    ('11111111-1111-1111-1111-111111111111', 'Widdersdorf 1', 'Widdersdorfer Str. 1, 50859 Köln', 945),
    ('22222222-2222-2222-2222-222222222222', 'Widdersdorf 2', 'Widdersdorfer Str. 2, 50859 Köln', 920),
    ('33333333-3333-3333-3333-333333333333', 'Widdersdorf 3', 'Widdersdorfer Str. 3, 50859 Köln', 885)
on conflict (id) do nothing;

-- Sample players (without user_id - can be linked later)
insert into public.players (first_name, last_name, position, nationality, age, house_id, status, points) values
    ('Max', 'Finkgräfe', 'STRIKER', 'Germany', 19, '11111111-1111-1111-1111-111111111111', 'active', 450),
    ('Tim', 'Lemperle', 'WINGER', 'Germany', 20, '33333333-3333-3333-3333-333333333333', 'active', 380),
    ('Linton', 'Maina', 'WINGER', 'Germany', 21, '22222222-2222-2222-2222-222222222222', 'training', 420),
    ('Florian', 'Kainz', 'MIDFIELDER', 'Austria', 22, '11111111-1111-1111-1111-111111111111', 'rest', 510),
    ('Jan', 'Thielmann', 'WINGER', 'Germany', 21, '22222222-2222-2222-2222-222222222222', 'active', 395),
    ('Dejan', 'Ljubičić', 'MIDFIELDER', 'Austria', 25, '33333333-3333-3333-3333-333333333333', 'active', 440)
on conflict do nothing;

-- Sample events
insert into public.events (title, type, date, start_time, end_time, location) values
    ('Morning Training', 'training', current_date + 1, '09:00', '11:00', 'Training Ground A'),
    ('Tactical Meeting', 'meeting', current_date + 1, '14:00', '15:30', 'Conference Room'),
    ('Fitness Assessment', 'assessment', current_date + 2, '10:00', '12:00', 'Gym')
on conflict do nothing;
