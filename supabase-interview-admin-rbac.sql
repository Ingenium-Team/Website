-- Apply this migration in the Supabase SQL Editor.
-- Purpose: secure interview slot and booking access for the existing admin-role system.
-- This migration only defines policies and does not create or rename tables.

-- 1) Ensure the interview tables are protected by RLS.
ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_bookings ENABLE ROW LEVEL SECURITY;

-- 2) Public visibility for interview booking page:
--    applicants should only see slots that are publicly bookable.
DROP POLICY IF EXISTS "public can view available interview slots" ON public.interview_slots;
CREATE POLICY "public can view available interview slots"
ON public.interview_slots
FOR SELECT
USING (status = 'available');

-- 3) Admin-only CRUD for interview slots.
--    Reuse the same admin role pattern already used by the dashboard guard.
DROP POLICY IF EXISTS "admins can manage interview slots" ON public.interview_slots;
CREATE POLICY "admins can manage interview slots"
ON public.interview_slots
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(p.role)) IN (
        'team leader',
        'vice team leader',
        'technical head',
        'hr head',
        'pr head',
        'board'
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(p.role)) IN (
        'team leader',
        'vice team leader',
        'technical head',
        'hr head',
        'pr head',
        'board'
      )
  )
);

-- 4) Admin-only read/update for interview bookings.
--    Admins must be able to view bookings and update status without exposing bookings publicly.
DROP POLICY IF EXISTS "admins can view interview bookings" ON public.interview_bookings;
CREATE POLICY "admins can view interview bookings"
ON public.interview_bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(p.role)) IN (
        'team leader',
        'vice team leader',
        'technical head',
        'hr head',
        'pr head',
        'board'
      )
  )
);

DROP POLICY IF EXISTS "admins can update interview booking status" ON public.interview_bookings;
CREATE POLICY "admins can update interview booking status"
ON public.interview_bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(p.role)) IN (
        'team leader',
        'vice team leader',
        'technical head',
        'hr head',
        'pr head',
        'board'
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(p.role)) IN (
        'team leader',
        'vice team leader',
        'technical head',
        'hr head',
        'pr head',
        'board'
      )
  )
);

-- 5) Keep the current profile access pattern intact for the dashboard auth guard.
--    The admin guard already reads the signed-in user's own profile row via auth.uid().
--    If the profiles table has RLS, self-select should be allowed.
DROP POLICY IF EXISTS "authenticated users can read own profile" ON public.profiles;
CREATE POLICY "authenticated users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);
