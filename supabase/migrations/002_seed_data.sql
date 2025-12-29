-- =============================================
-- SEED DATA FOR DEVELOPMENT/DEMO
-- =============================================

-- Insert Houses
INSERT INTO public.houses (id, name, description, total_points) VALUES
    ('h1', 'Widdersdorf 1', 'First house in the Widdersdorf complex', 0),
    ('h2', 'Widdersdorf 2', 'Second house in the Widdersdorf complex', 0),
    ('h3', 'Widdersdorf 3', 'Third house in the Widdersdorf complex', 0)
ON CONFLICT DO NOTHING;

-- Note: Players will be created through the application
-- This is just sample data structure for reference

-- Insert Sample Events
INSERT INTO public.events (title, description, type, start_time, end_time, location, is_mandatory) VALUES
    (
        'Morning Training',
        'Daily morning training session',
        'training',
        NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
        NOW() + INTERVAL '1 day' + INTERVAL '11 hours',
        'Training Ground A',
        true
    ),
    (
        'Tactical Meeting',
        'Weekly tactical review and planning',
        'meeting',
        NOW() + INTERVAL '1 day' + INTERVAL '14 hours',
        NOW() + INTERVAL '1 day' + INTERVAL '15.5 hours',
        'Conference Room',
        true
    ),
    (
        'Fitness Assessment',
        'Monthly fitness and performance evaluation',
        'assessment',
        NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
        NOW() + INTERVAL '2 days' + INTERVAL '12 hours',
        'Gym',
        true
    )
ON CONFLICT DO NOTHING;
