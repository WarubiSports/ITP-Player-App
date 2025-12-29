-- =============================================
-- 1.FC KÖLN ITP - SUPABASE DATABASE SCHEMA
-- Initial Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'staff', 'player')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================
-- HOUSES TABLE
-- =============================================
CREATE TABLE public.houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    total_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Houses policies
CREATE POLICY "Anyone can view houses"
    ON public.houses FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage houses"
    ON public.houses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- PLAYERS TABLE
-- =============================================
CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('STRIKER', 'WINGER', 'MIDFIELDER', 'DEFENDER', 'GOALKEEPER')),
    nationality TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    house_id UUID REFERENCES public.houses(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'training', 'rest', 'injured')),
    points INTEGER NOT NULL DEFAULT 0,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX players_house_id_idx ON public.players(house_id);
CREATE INDEX players_status_idx ON public.players(status);
CREATE INDEX players_position_idx ON public.players(position);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Players policies
CREATE POLICY "Anyone can view players"
    ON public.players FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage players"
    ON public.players FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- CHORES TABLE
-- =============================================
CREATE TABLE public.chores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    points INTEGER NOT NULL DEFAULT 10,
    house_id UUID REFERENCES public.houses(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.players(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    deadline TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX chores_house_id_idx ON public.chores(house_id);
CREATE INDEX chores_assigned_to_idx ON public.chores(assigned_to);
CREATE INDEX chores_status_idx ON public.chores(status);
CREATE INDEX chores_deadline_idx ON public.chores(deadline);

-- Enable RLS
ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;

-- Chores policies
CREATE POLICY "Anyone can view chores"
    ON public.chores FOR SELECT
    USING (true);

CREATE POLICY "Staff can create chores"
    ON public.chores FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Staff can update chores"
    ON public.chores FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Assigned players can update their chores"
    ON public.chores FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = assigned_to AND user_id = auth.uid()
        )
    );

-- =============================================
-- EVENTS TABLE (Calendar)
-- =============================================
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('training', 'meeting', 'match', 'assessment', 'social', 'other')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indexes
CREATE INDEX events_start_time_idx ON public.events(start_time);
CREATE INDEX events_type_idx ON public.events(type);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Anyone can view events"
    ON public.events FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage events"
    ON public.events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- EVENT ATTENDEES TABLE
-- =============================================
CREATE TABLE public.event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, player_id)
);

-- Create indexes
CREATE INDEX event_attendees_event_id_idx ON public.event_attendees(event_id);
CREATE INDEX event_attendees_player_id_idx ON public.event_attendees(player_id);

-- Enable RLS
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Event attendees policies
CREATE POLICY "Anyone can view attendees"
    ON public.event_attendees FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage attendees"
    ON public.event_attendees FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Players can update their own attendance"
    ON public.event_attendees FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    to_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX messages_from_user_idx ON public.messages(from_user);
CREATE INDEX messages_to_user_idx ON public.messages(to_user);
CREATE INDEX messages_is_read_idx ON public.messages(is_read);
CREATE INDEX messages_created_at_idx ON public.messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view their own messages"
    ON public.messages FOR SELECT
    USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (from_user = auth.uid());

CREATE POLICY "Users can update their received messages"
    ON public.messages FOR UPDATE
    USING (to_user = auth.uid());

-- =============================================
-- ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX activity_log_user_id_idx ON public.activity_log(user_id);
CREATE INDEX activity_log_created_at_idx ON public.activity_log(created_at DESC);
CREATE INDEX activity_log_entity_idx ON public.activity_log(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Activity log policies
CREATE POLICY "Admins can view all activity"
    ON public.activity_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view their own activity"
    ON public.activity_log FOR SELECT
    USING (user_id = auth.uid());

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_houses_updated_at BEFORE UPDATE ON public.houses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON public.chores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_attendees_updated_at BEFORE UPDATE ON public.event_attendees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update house points
CREATE OR REPLACE FUNCTION update_house_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate house total points
    UPDATE public.houses
    SET total_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM public.players
        WHERE house_id = NEW.house_id
    )
    WHERE id = NEW.house_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update house points when player points change
CREATE TRIGGER update_house_points_trigger
    AFTER INSERT OR UPDATE OF points ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION update_house_points();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'player')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, metadata)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VIEWS
-- =============================================

-- View for player statistics
CREATE OR REPLACE VIEW player_stats AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.position,
    p.house_id,
    h.name as house_name,
    p.points,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as completed_chores,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'pending') as pending_chores,
    COUNT(DISTINCT ea.id) FILTER (WHERE ea.status = 'accepted') as events_attended
FROM public.players p
LEFT JOIN public.houses h ON p.house_id = h.id
LEFT JOIN public.chores c ON c.assigned_to = p.id
LEFT JOIN public.event_attendees ea ON ea.player_id = p.id
GROUP BY p.id, p.first_name, p.last_name, p.position, p.house_id, h.name, p.points;

-- View for house leaderboard
CREATE OR REPLACE VIEW house_leaderboard AS
SELECT
    h.id,
    h.name,
    h.total_points,
    COUNT(DISTINCT p.id) as player_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as completed_chores,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'pending') as pending_chores,
    RANK() OVER (ORDER BY h.total_points DESC) as rank
FROM public.houses h
LEFT JOIN public.players p ON p.house_id = h.id
LEFT JOIN public.chores c ON c.house_id = h.id
GROUP BY h.id, h.name, h.total_points
ORDER BY h.total_points DESC;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE public.houses IS 'Housing units for the ITP program';
COMMENT ON TABLE public.players IS 'Player information and statistics';
COMMENT ON TABLE public.chores IS 'Chore assignments and tracking';
COMMENT ON TABLE public.events IS 'Calendar events and activities';
COMMENT ON TABLE public.event_attendees IS 'Event attendance tracking';
COMMENT ON TABLE public.messages IS 'Internal messaging system';
COMMENT ON TABLE public.activity_log IS 'System activity audit log';
