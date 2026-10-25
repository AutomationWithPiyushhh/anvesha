-- ==============================================================================
-- 002_resources_and_notes.sql: Lesson Resources and Student Timestamped Notes
-- ==============================================================================

-- 1. Lesson Resources table (Instructor attachments & links)
create table if not exists public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.lesson_resources enable row level security;

-- Policies for lesson_resources:
-- Enrolled students and admins can view resources for lessons
create policy "Allow read access to enrolled students and admins on lesson_resources"
  on public.lesson_resources
  for select
  to authenticated
  using (
    public.is_admin() or
    exists (
      select 1 from public.videos v
      join public.enrollments e on e.course_id = v.course_id
      where v.id = lesson_resources.video_id
      and e.user_id = auth.uid()
    )
  );

-- Admins have full access to manage resources
create policy "Allow full admin access on lesson_resources"
  on public.lesson_resources
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Student Notes table (Personal timestamped notes)
create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  content text not null,
  timestamp_seconds int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.student_notes enable row level security;

-- Policies for student_notes:
-- Students can only read their own notes
create policy "Users can read own notes"
  on public.student_notes
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Students can insert their own notes
create policy "Users can insert own notes"
  on public.student_notes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Students can update their own notes
create policy "Users can update own notes"
  on public.student_notes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Students can delete their own notes
create policy "Users can delete own notes"
  on public.student_notes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Grants
grant select, insert, update, delete on public.lesson_resources to authenticated;
grant select, insert, update, delete on public.student_notes to authenticated;
