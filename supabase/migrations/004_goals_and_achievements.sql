-- =============================================
-- GOALS AND ACHIEVEMENTS SYSTEM
-- =============================================

-- Player Goals Table
CREATE TABLE IF NOT EXISTS public.player_goals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('wellness', 'performance', 'academic', 'recruitment', 'personal')),
    goal_type TEXT NOT NULL CHECK (goal_type IN ('short_term', 'long_term')), -- short_term = weekly/monthly, long_term = seasonal/yearly
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit TEXT, -- e.g., 'days', 'hours', 'percentage', 'GPA points'
    target_date DATE,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement Badges Table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'wellness_streak_7', 'first_offer', 'academic_honor'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('wellness', 'performance', 'academic', 'recruitment', 'social', 'consistency')),
    icon TEXT, -- emoji or icon identifier
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    points_value INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player Achievement Unlocks Table
CREATE TABLE IF NOT EXISTS public.player_achievements (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, achievement_id)
);

-- Mental Wellness Tracking Table
CREATE TABLE IF NOT EXISTS public.mental_wellness (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    confidence_level INTEGER NOT NULL CHECK (confidence_level >= 1 AND confidence_level <= 10),
    focus_quality INTEGER NOT NULL CHECK (focus_quality >= 1 AND focus_quality <= 10),
    anxiety_level INTEGER NOT NULL CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
    motivation_level INTEGER NOT NULL CHECK (motivation_level >= 1 AND motivation_level <= 10),
    social_connection INTEGER NOT NULL CHECK (social_connection >= 1 AND social_connection <= 10),
    overall_mood TEXT CHECK (overall_mood IN ('excellent', 'good', 'okay', 'struggling', 'poor')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_goals_player_id ON public.player_goals(player_id);
CREATE INDEX IF NOT EXISTS idx_player_goals_status ON public.player_goals(status);
CREATE INDEX IF NOT EXISTS idx_player_goals_category ON public.player_goals(category);
CREATE INDEX IF NOT EXISTS idx_player_achievements_player_id ON public.player_achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_mental_wellness_player_id ON public.mental_wellness(player_id);
CREATE INDEX IF NOT EXISTS idx_mental_wellness_date ON public.mental_wellness(date);

-- Row Level Security
ALTER TABLE public.player_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_wellness ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_goals
CREATE POLICY "Users can view their own goals" ON public.player_goals
    FOR SELECT USING (
        player_id IN (
            SELECT id FROM public.players WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own goals" ON public.player_goals
    FOR INSERT WITH CHECK (
        player_id IN (
            SELECT id FROM public.players WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own goals" ON public.player_goals
    FOR UPDATE USING (
        player_id IN (
            SELECT id FROM public.players WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for achievements (everyone can view)
CREATE POLICY "Everyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

-- RLS Policies for player_achievements
CREATE POLICY "Users can view their own unlocked achievements" ON public.player_achievements
    FOR SELECT USING (
        player_id IN (
            SELECT id FROM public.players WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can unlock achievements" ON public.player_achievements
    FOR INSERT WITH CHECK (
        player_id IN (
            SELECT id FROM public.players WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for mental_wellness
CREATE POLICY "Users can view their own mental wellness" ON public.mental_wellness
    FOR SELECT USING (
        player_id IN (
            SELECT id FROM public.players WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own mental wellness logs" ON public.mental_wellness
    FOR INSERT WITH CHECK (
        player_id IN (
            SELECT id FROM public.players WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own mental wellness logs" ON public.mental_wellness
    FOR UPDATE USING (
        player_id IN (
            SELECT id FROM public.players WHERE user_id = auth.uid()
        )
    );

-- Seed default achievements
INSERT INTO public.achievements (code, name, description, category, icon, rarity, points_value) VALUES
    ('wellness_streak_7', '7-Day Wellness Streak', 'Logged wellness for 7 consecutive days', 'consistency', '🔥', 'common', 50),
    ('wellness_streak_30', '30-Day Wellness Warrior', 'Logged wellness for 30 consecutive days', 'consistency', '💪', 'rare', 200),
    ('first_scholarship_offer', 'First Offer', 'Received your first scholarship offer', 'recruitment', '🎓', 'epic', 500),
    ('academic_honor_roll', 'Honor Roll', 'Achieved 3.5+ GPA', 'academic', '📚', 'rare', 150),
    ('performance_improvement', 'Getting Faster', 'Improved sprint time by 5%+', 'performance', '⚡', 'common', 75),
    ('perfect_week', 'Perfect Week', 'Completed all wellness logs, trainings, and tasks for a week', 'consistency', '✨', 'epic', 300),
    ('team_player', 'Team Player', 'Completed 10 house chores', 'social', '🤝', 'common', 50),
    ('early_riser', 'Early Bird', 'Logged wellness before 7 AM for 5 consecutive days', 'consistency', '🌅', 'rare', 100),
    ('recovery_master', 'Recovery Master', 'Maintained 8+ hours sleep for 7 days', 'wellness', '😴', 'common', 75),
    ('mental_resilience', 'Mental Fortress', 'Logged high confidence (8+) for 5 consecutive days', 'wellness', '🧠', 'rare', 150)
ON CONFLICT (code) DO NOTHING;

-- Comments
COMMENT ON TABLE public.player_goals IS 'Player personal goals - short and long term';
COMMENT ON TABLE public.achievements IS 'Achievement badge definitions';
COMMENT ON TABLE public.player_achievements IS 'Player achievement unlocks';
COMMENT ON TABLE public.mental_wellness IS 'Mental and psychological wellness tracking';
