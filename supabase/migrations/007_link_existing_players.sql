-- =============================================
-- Link existing players to their auth accounts
-- =============================================
-- This one-time migration links players to auth.users by matching email.
-- Only links players who:
--   1. Have an email address
--   2. Don't already have a user_id set
--   3. Have a matching user in auth.users

UPDATE public.players p
SET user_id = u.id
FROM auth.users u
WHERE
    p.user_id IS NULL
    AND p.email IS NOT NULL
    AND LOWER(p.email) = LOWER(u.email);

-- Report how many were linked
DO $$
DECLARE
    linked_count INTEGER;
    still_null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO linked_count FROM public.players WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO still_null_count FROM public.players WHERE user_id IS NULL;
    RAISE NOTICE 'Players linked: %, Players still unlinked: %', linked_count, still_null_count;
END $$;
