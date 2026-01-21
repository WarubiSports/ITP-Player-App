-- Fix college_targets constraints to allow Professional division and signed status
-- This fixes the "Failed to save" error when players add club recruitment opportunities

-- Drop old constraints if they exist
ALTER TABLE public.college_targets DROP CONSTRAINT IF EXISTS college_targets_division_check;
ALTER TABLE public.college_targets DROP CONSTRAINT IF EXISTS college_targets_status_check;

-- Add updated constraints with additional values
-- Division: Added 'Professional' and 'Amateur' for club opportunities
ALTER TABLE public.college_targets ADD CONSTRAINT college_targets_division_check
  CHECK (division IN ('D1', 'D2', 'D3', 'NAIA', 'NJCAA', 'Professional', 'Amateur'));

-- Status: Added 'signed' status option
ALTER TABLE public.college_targets ADD CONSTRAINT college_targets_status_check
  CHECK (status IN ('researching', 'in_contact', 'offer_received', 'committed', 'declined', 'signed'));
