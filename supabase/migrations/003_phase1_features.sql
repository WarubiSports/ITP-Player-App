-- =============================================
-- 1.FC KÖLN ITP - PHASE 1 FEATURES
-- Wellness, Performance, Pathway & Recruitment
-- =============================================

-- =============================================
-- WELLNESS LOGS TABLE
-- =============================================
CREATE TABLE public.wellness_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    sleep_hours DECIMAL(3,1) NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
    muscle_soreness INTEGER NOT NULL CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10),
    stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 10),
    mood TEXT NOT NULL CHECK (mood IN ('excellent', 'good', 'okay', 'tired', 'poor')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, date)
);

-- Create indexes
CREATE INDEX wellness_logs_player_id_idx ON public.wellness_logs(player_id);
CREATE INDEX wellness_logs_date_idx ON public.wellness_logs(date DESC);

-- Enable RLS
ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;

-- Wellness logs policies
CREATE POLICY "Anyone can view wellness logs"
    ON public.wellness_logs FOR SELECT
    USING (true);

CREATE POLICY "Players can create their own wellness logs"
    ON public.wellness_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Players can update their own wellness logs"
    ON public.wellness_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage all wellness logs"
    ON public.wellness_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- TRAINING LOADS TABLE
-- =============================================
CREATE TABLE public.training_loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('training', 'match', 'gym', 'recovery', 'other')),
    duration INTEGER NOT NULL CHECK (duration > 0),
    rpe INTEGER NOT NULL CHECK (rpe >= 1 AND rpe <= 10),
    load_score INTEGER GENERATED ALWAYS AS (duration * rpe) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX training_loads_player_id_idx ON public.training_loads(player_id);
CREATE INDEX training_loads_date_idx ON public.training_loads(date DESC);

-- Enable RLS
ALTER TABLE public.training_loads ENABLE ROW LEVEL SECURITY;

-- Training loads policies
CREATE POLICY "Anyone can view training loads"
    ON public.training_loads FOR SELECT
    USING (true);

CREATE POLICY "Players can create their own training loads"
    ON public.training_loads FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage all training loads"
    ON public.training_loads FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- INJURIES TABLE
-- =============================================
CREATE TABLE public.injuries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    injury_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
    date_occurred DATE NOT NULL,
    expected_return DATE,
    actual_return DATE,
    status TEXT NOT NULL DEFAULT 'recovering' CHECK (status IN ('recovering', 'cleared', 'setback')),
    treatment_plan TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX injuries_player_id_idx ON public.injuries(player_id);
CREATE INDEX injuries_status_idx ON public.injuries(status);

-- Enable RLS
ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;

-- Injuries policies
CREATE POLICY "Anyone can view injuries"
    ON public.injuries FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage injuries"
    ON public.injuries FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- COLLEGE TARGETS TABLE
-- =============================================
CREATE TABLE public.college_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    college_name TEXT NOT NULL,
    division TEXT CHECK (division IN ('D1', 'D2', 'D3', 'NAIA', 'NJCAA')),
    conference TEXT,
    location TEXT,
    interest_level TEXT NOT NULL DEFAULT 'cold' CHECK (interest_level IN ('hot', 'warm', 'cold')),
    status TEXT NOT NULL DEFAULT 'researching' CHECK (status IN ('researching', 'in_contact', 'offer_received', 'committed', 'declined')),
    scholarship_amount DECIMAL(5,2) CHECK (scholarship_amount >= 0 AND scholarship_amount <= 100),
    contact_name TEXT,
    contact_email TEXT,
    last_contact DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX college_targets_player_id_idx ON public.college_targets(player_id);
CREATE INDEX college_targets_status_idx ON public.college_targets(status);
CREATE INDEX college_targets_interest_level_idx ON public.college_targets(interest_level);

-- Enable RLS
ALTER TABLE public.college_targets ENABLE ROW LEVEL SECURITY;

-- College targets policies
CREATE POLICY "Players can view their own targets"
    ON public.college_targets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all targets"
    ON public.college_targets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Players can manage their own targets"
    ON public.college_targets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage all targets"
    ON public.college_targets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- SCOUT ACTIVITIES TABLE
-- =============================================
CREATE TABLE public.scout_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    scout_type TEXT NOT NULL CHECK (scout_type IN ('college', 'professional', 'agent', 'national_team')),
    organization TEXT NOT NULL,
    scout_name TEXT,
    date DATE NOT NULL,
    event TEXT NOT NULL,
    notes TEXT,
    rating TEXT CHECK (rating IN ('very_positive', 'positive', 'neutral', 'negative')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX scout_activities_player_id_idx ON public.scout_activities(player_id);
CREATE INDEX scout_activities_date_idx ON public.scout_activities(date DESC);
CREATE INDEX scout_activities_scout_type_idx ON public.scout_activities(scout_type);

-- Enable RLS
ALTER TABLE public.scout_activities ENABLE ROW LEVEL SECURITY;

-- Scout activities policies
CREATE POLICY "Players can view their own scout activities"
    ON public.scout_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all scout activities"
    ON public.scout_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Players can manage their own scout activities"
    ON public.scout_activities FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage all scout activities"
    ON public.scout_activities FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- ACADEMIC PROGRESS TABLE
-- =============================================
CREATE TABLE public.academic_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('high_school', 'college', 'language', 'certification', 'other')),
    course_name TEXT NOT NULL,
    grade TEXT,
    credits DECIMAL(4,2),
    semester TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'dropped', 'failed')),
    transferable BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX academic_progress_player_id_idx ON public.academic_progress(player_id);
CREATE INDEX academic_progress_category_idx ON public.academic_progress(category);
CREATE INDEX academic_progress_status_idx ON public.academic_progress(status);

-- Enable RLS
ALTER TABLE public.academic_progress ENABLE ROW LEVEL SECURITY;

-- Academic progress policies
CREATE POLICY "Players can view their own academic progress"
    ON public.academic_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all academic progress"
    ON public.academic_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Players can manage their own academic progress"
    ON public.academic_progress FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can manage all academic progress"
    ON public.academic_progress FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- PERFORMANCE TESTS TABLE
-- =============================================
CREATE TABLE public.performance_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    test_date DATE NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('sprint_10m', 'sprint_30m', 'sprint_40m', 'vertical_jump', 'broad_jump', 'yo_yo_test', 'cooper_test', 'agility_t_test', 'other')),
    result DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    percentile INTEGER CHECK (percentile >= 0 AND percentile <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX performance_tests_player_id_idx ON public.performance_tests(player_id);
CREATE INDEX performance_tests_test_date_idx ON public.performance_tests(test_date DESC);
CREATE INDEX performance_tests_test_type_idx ON public.performance_tests(test_type);

-- Enable RLS
ALTER TABLE public.performance_tests ENABLE ROW LEVEL SECURITY;

-- Performance tests policies
CREATE POLICY "Players can view their own performance tests"
    ON public.performance_tests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.players
            WHERE id = player_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all performance tests"
    ON public.performance_tests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Staff can manage all performance tests"
    ON public.performance_tests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
    );

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_wellness_logs_updated_at BEFORE UPDATE ON public.wellness_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_loads_updated_at BEFORE UPDATE ON public.training_loads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_injuries_updated_at BEFORE UPDATE ON public.injuries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_college_targets_updated_at BEFORE UPDATE ON public.college_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scout_activities_updated_at BEFORE UPDATE ON public.scout_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_progress_updated_at BEFORE UPDATE ON public.academic_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_tests_updated_at BEFORE UPDATE ON public.performance_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS
-- =============================================

-- View for player wellness summary (7-day average)
CREATE OR REPLACE VIEW player_wellness_summary AS
SELECT
    wl.player_id,
    COUNT(*) as total_logs,
    AVG(wl.sleep_hours) as avg_sleep_hours,
    AVG(wl.sleep_quality) as avg_sleep_quality,
    AVG(wl.energy_level) as avg_energy_level,
    AVG(wl.muscle_soreness) as avg_muscle_soreness,
    AVG(wl.stress_level) as avg_stress_level,
    MAX(wl.date) as last_log_date
FROM public.wellness_logs wl
WHERE wl.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY wl.player_id;

-- View for player readiness score
CREATE OR REPLACE VIEW player_readiness AS
SELECT
    p.id as player_id,
    p.first_name,
    p.last_name,
    COALESCE(
        ROUND(
            (
                (ws.avg_sleep_quality * 20) +
                (ws.avg_energy_level * 10) +
                ((10 - ws.avg_muscle_soreness) * 5) +
                ((10 - ws.avg_stress_level) * 5)
            )::NUMERIC,
            0
        ),
        50
    ) as readiness_score,
    ws.avg_sleep_hours,
    ws.avg_energy_level,
    ws.last_log_date
FROM public.players p
LEFT JOIN player_wellness_summary ws ON ws.player_id = p.id;

-- View for college recruitment pipeline
CREATE OR REPLACE VIEW recruitment_pipeline AS
SELECT
    ct.player_id,
    COUNT(*) FILTER (WHERE ct.status = 'researching') as researching_count,
    COUNT(*) FILTER (WHERE ct.status = 'in_contact') as in_contact_count,
    COUNT(*) FILTER (WHERE ct.status = 'offer_received') as offers_count,
    COUNT(*) FILTER (WHERE ct.status = 'committed') as committed_count,
    MAX(ct.scholarship_amount) as best_offer_percent
FROM public.college_targets ct
GROUP BY ct.player_id;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.wellness_logs IS 'Daily wellness check-ins for players';
COMMENT ON TABLE public.training_loads IS 'Training load and RPE tracking';
COMMENT ON TABLE public.injuries IS 'Injury tracking and recovery plans';
COMMENT ON TABLE public.college_targets IS 'College recruitment targets and contacts';
COMMENT ON TABLE public.scout_activities IS 'Scout visits and player evaluations';
COMMENT ON TABLE public.academic_progress IS 'Academic coursework and progress tracking';
COMMENT ON TABLE public.performance_tests IS 'Physical performance test results';
