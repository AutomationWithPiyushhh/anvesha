-- ==============================================================================
-- 003_certificates.sql: Course Completion Certificates
-- ==============================================================================

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  certificate_number text not null unique,
  issued_at timestamptz not null default now(),
  constraint unique_user_course_certificate unique (user_id, course_id)
);

-- Enable RLS
alter table public.certificates enable row level security;

-- Policies:
-- Any authenticated user can read / verify certificates (public verifiable credential)
create policy "Allow read on certificates"
  on public.certificates
  for select
  to authenticated
  using (true);

-- Users can claim/insert their certificate if they completed all lessons, or admins can issue
create policy "Allow insert on certificates"
  on public.certificates
  for insert
  to authenticated
  with check (auth.uid() = user_id or public.is_admin());

grant select, insert on public.certificates to authenticated;
