-- ==============================================================================
-- 001_init.sql: ANVESHA Database Schema & Security Definition
-- ==============================================================================

-- 1. Helper function: is_admin() (SECURITY DEFINER to prevent recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 2. Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

-- Trigger to auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger to protect profile role changes:
-- Allows change when auth.uid() is null (SQL editor / service role) OR caller is admin, otherwise raises.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Permission denied: Only administrators can modify user roles.';
    end if;
  end if;
  return new;
end;
$$;

create trigger on_profile_before_update
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- 3. Courses table
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  thumbnail text not null,
  created_at timestamptz not null default now()
);

-- 4. Videos table
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  bunny_video_id text not null,
  "order" int not null default 1,
  duration int not null default 0,
  created_at timestamptz not null default now()
);

-- Security: Revoke all from anon and authenticated, grant select only on non-sensitive columns
revoke all on public.videos from anon, authenticated;
grant select (id, course_id, title, "order", duration, created_at) on public.videos to authenticated;

-- 5. Student Videos View (security_invoker = true)
create or replace view public.student_videos
with (security_invoker = true)
as
select
  v.id,
  v.course_id,
  v.title,
  v."order",
  v.duration,
  v.created_at
from public.videos v;

-- 6. Enrollments table
create table public.enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- 7. Sessions table (tracks devices and active playback)
create table public.sessions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_id text not null,
  last_active timestamptz not null default now(),
  user_agent text,
  playing_video_id uuid references public.videos(id) on delete set null,
  playback_started_at timestamptz,
  primary key (user_id, device_id)
);

-- 8. Watch progress table
create table public.watch_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  position_seconds int not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

-- 9. Serverless Rate Limits table
create table public.rate_limits (
  key text primary key,
  count int not null default 1,
  reset_at timestamptz not null
);

-- Atomic PostgreSQL function for rate limiting
create or replace function public.increment_rate_limit(
  p_key text,
  p_window_seconds int
)
returns table (
  current_count int,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_new_reset timestamptz := v_now + (p_window_seconds || ' seconds')::interval;
begin
  return query
  insert into public.rate_limits (key, count, reset_at)
  values (p_key, 1, v_new_reset)
  on conflict (key) do update
    set
      count = case
        when public.rate_limits.reset_at <= v_now then 1
        else public.rate_limits.count + 1
      end,
      reset_at = case
        when public.rate_limits.reset_at <= v_now then v_new_reset
        else public.rate_limits.reset_at
      end
  returning public.rate_limits.count, public.rate_limits.reset_at;
end;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.videos enable row level security;
alter table public.enrollments enable row level security;
alter table public.sessions enable row level security;
alter table public.watch_progress enable row level security;
alter table public.rate_limits enable row level security;

-- PROFILES
create policy "Users can read own profile or admin reads all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile name"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- COURSES
create policy "Enrolled students can select courses; admins select all"
  on public.courses for select
  using (
    public.is_admin() or
    exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid() and e.course_id = public.courses.id
    )
  );

create policy "Admins can insert courses"
  on public.courses for insert
  with check (public.is_admin());

create policy "Admins can update courses"
  on public.courses for update
  using (public.is_admin());

create policy "Admins can delete courses"
  on public.courses for delete
  using (public.is_admin());

-- VIDEOS
create policy "Enrolled students can select videos; admins select all"
  on public.videos for select
  using (
    public.is_admin() or
    exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid() and e.course_id = public.videos.course_id
    )
  );

create policy "Admins can insert videos"
  on public.videos for insert
  with check (public.is_admin());

create policy "Admins can update videos"
  on public.videos for update
  using (public.is_admin());

create policy "Admins can delete videos"
  on public.videos for delete
  using (public.is_admin());

-- ENROLLMENTS
create policy "Students can view own enrollments; admins view all"
  on public.enrollments for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can manage enrollments"
  on public.enrollments for all
  using (public.is_admin());

-- SESSIONS
-- Requirement: Students get SELECT only. No student INSERT/UPDATE policy lines.
-- All writes (device registration, heartbeat, reset) go through server routes via service-role client.
create policy "Students can select own sessions; admins select all"
  on public.sessions for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can manage sessions"
  on public.sessions for all
  using (public.is_admin());

-- WATCH PROGRESS
-- Requirement: Verify enrollment in the video's course on INSERT and UPDATE
create policy "Students can read own progress; admins read all"
  on public.watch_progress for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Students can insert own progress if enrolled"
  on public.watch_progress for insert
  with check (
    public.is_admin() or (
      auth.uid() = user_id and
      exists (
        select 1 from public.videos v
        join public.enrollments e on e.course_id = v.course_id
        where v.id = public.watch_progress.video_id and e.user_id = auth.uid()
      )
    )
  );

create policy "Students can update own progress if enrolled"
  on public.watch_progress for update
  using (
    public.is_admin() or (
      auth.uid() = user_id and
      exists (
        select 1 from public.videos v
        join public.enrollments e on e.course_id = v.course_id
        where v.id = public.watch_progress.video_id and e.user_id = auth.uid()
      )
    )
  );

-- RATE LIMITS
create policy "Admins and service role manage rate limits"
  on public.rate_limits for all
  using (public.is_admin());

-- ==============================================================================
-- ADMIN SEED / PROMOTION SNIPPET
-- ==============================================================================
-- Run this in the Supabase SQL editor after signing up your initial admin account:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@domain.com';
