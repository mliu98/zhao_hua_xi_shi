-- 朝花夕拾 Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/yaztlwwibcspgqnhdssa/sql

create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat float not null,
  lng float not null,
  created_at timestamptz default now()
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade,
  type text not null check (type in ('photo', 'note', 'book')),
  date date not null,
  created_at timestamptz default now()
);

create table memory_photos (
  memory_id uuid primary key references memories(id) on delete cascade,
  image_url text not null,
  caption text
);

create table memory_notes (
  memory_id uuid primary key references memories(id) on delete cascade,
  note_type text not null check (note_type in ('handwritten', 'text')),
  image_url text,
  content text
);

create table memory_books (
  memory_id uuid primary key references memories(id) on delete cascade,
  title text not null,
  author text not null,
  cover_url text,
  reading_notes text
);

create table book_quotes (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references memories(id) on delete cascade,
  content text not null,
  "order" int not null default 0
);

-- Storage: go to Supabase Dashboard → Storage → New bucket
-- Name: memory-images
-- Public bucket: true

-- Migration: hierarchical locations
-- Run in Supabase SQL Editor to add parent_id support:
--
-- ALTER TABLE locations
--   ADD COLUMN parent_id uuid REFERENCES locations(id) ON DELETE SET NULL;
