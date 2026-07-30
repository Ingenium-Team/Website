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

-- Optional: keep all existing rows valid and readable while admins assign committee values.
-- New admin UI will require a committee on create/edit.
