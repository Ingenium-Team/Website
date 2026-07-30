-- Safe migration for committee-aware interview slots.
-- This keeps existing rows usable and only constrains the new committee values.

ALTER TABLE public.interview_slots
  ADD COLUMN IF NOT EXISTS committee TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'interview_slots_committee_check'
  ) THEN
    ALTER TABLE public.interview_slots
      ADD CONSTRAINT interview_slots_committee_check
      CHECK (
        committee IS NULL OR committee IN ('mechanical', 'software', 'hardware', 'robotics')
      );
  END IF;
END $$;

-- Add interview type support while preserving existing rows.
ALTER TABLE public.interview_slots
  ADD COLUMN IF NOT EXISTS interview_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'interview_slots_interview_type_check'
  ) THEN
    ALTER TABLE public.interview_slots
      ADD CONSTRAINT interview_slots_interview_type_check
      CHECK (
        interview_type IS NULL OR interview_type IN ('online', 'offline')
      );
  END IF;
END $$;

-- Keep existing interview slots readable and safe.
-- Any older rows will simply remain nullable until an admin sets their interview type.
