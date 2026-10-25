-- ==============================================================================
-- 004_catalog_and_requests.sql: Course Pricing and Enrollment Requests
-- ==============================================================================

-- 1. Add pricing and publishing flags to courses table
alter table public.courses
  add column if not exists price_inr int not null default 0,
  add column if not exists is_published boolean not null default true;

-- 2. Allow all authenticated users to view courses (Public Catalog)
drop policy if exists "Enrolled students can select courses; admins select all" on public.courses;
create policy "All authenticated users can view published courses"
  on public.courses for select
  using (is_published = true or public.is_admin());

-- 3. Enrollment Requests table (Manual approval / UPI verification)
create table if not exists public.enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payment_method text not null default 'manual_upi',
  transaction_ref text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.enrollment_requests enable row level security;

-- Policies:
create policy "Users can view own enrollment requests; admins view all"
  on public.enrollment_requests for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can submit own enrollment requests"
  on public.enrollment_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can manage enrollment requests"
  on public.enrollment_requests for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.enrollment_requests to authenticated;
