-- =============================================
-- FIX: Allow players to link their auth account
-- =============================================
-- Problem: When a player logs in via magic link, the app tries to link
-- their auth user_id to their player record by matching email.
-- But there's no RLS policy allowing this update, so it silently fails.
-- Result: player.user_id stays NULL, breaking all subsequent inserts
-- to wellness_logs, college_targets, academic_progress, etc.

-- Solution: Allow authenticated users to update the user_id column
-- on player records where the email matches their auth email,
-- but ONLY if user_id is currently null (first-time linking)

CREATE POLICY "Players can link their account by email match"
    ON public.players FOR UPDATE
    USING (
        -- Can only update if user_id is not yet set (prevents hijacking)
        user_id IS NULL
        -- And the player's email matches the authenticated user's email
        AND LOWER(email) = LOWER(auth.email())
    )
    WITH CHECK (
        -- The update must set user_id to the current authenticated user
        user_id = auth.uid()
    );

-- Also add a policy allowing players to view/update their own linked record
-- (for profile updates, photo changes, etc. in the future)
CREATE POLICY "Players can update their own record"
    ON public.players FOR UPDATE
    USING (
        user_id = auth.uid()
    );

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON POLICY "Players can link their account by email match" ON public.players IS
    'Allows first-time account linking when player email matches auth email';
COMMENT ON POLICY "Players can update their own record" ON public.players IS
    'Allows players to update their own player record after linking';
