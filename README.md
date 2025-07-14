# ⚡ Zaplog — Habit & Daily Tracker (PWA)

**Zaplog** is a minimalist, privacy-focused Progressive Web App (PWA) that helps you build habits, track your progress, and stay accountable — all without distractions.


ps this is my [buymeacoffee](https://buymeacoffee.com/gnaaruag) link. ;)
---

## Features

-  **Daily Habit Logging**  
  Mark habits as completed, skipped (rest day), or left incomplete each day.

-  **Per-Habit Calendar View**  
  Visualize your consistency over time with habit-specific calendars.

-  **Accountability Notes**  
  Write small reflections each day about what you did. Browse past entries too.

-  **Shareable Tracker Summary**  
  Generate an image of your day’s progress (completion %, habit status) — perfect for social sharing or keeping yourself in check.

-  **Confetti Reward**  
  Hit over 80% completion in a day? You’re rewarded with confetti!

-  **PWA (Progressive Web App)**  
  Install Zaplog directly to your home screen. No App Store needed. Works offline after install.

---

##  Installation Guide (PWA)

###  Android (Chrome)

1. Open the Zaplog URL in **Google Chrome**.
2. Tap the **three-dot menu** in the top-right corner.
3. Tap **“Add to Home screen”**.
4. Confirm by tapping **“Install”** or **“Add”**.

You’ll now have a Zaplog icon on your home screen, just like a native app.

---

###  iOS (Safari)

1. Open the Zaplog URL in **Safari**.
2. Tap the **Share** button at the bottom (square with arrow).
3. Scroll down and tap **“Add to Home Screen”**.
4. Tap **“Add”** in the top-right corner.

Zaplog will now appear as a standalone app on your iPhone home screen.

⚠️ **Note:** Due to iOS limitations, some features like "Copy to Clipboard" for images may not work. Use the **Download Image** option instead and long-press to save.

## 🛠 Setup Guide

### 1️. Create Supabase Project

- Go to [supabase.com](https://supabase.com/) → New Project
- Set up DB password and region.

### 2️. Enable Google Auth

- Go to `Authentication > Providers > Google`
- Paste your OAuth **Client ID** and **Secret** (get them from [Google Cloud Console](https://console.cloud.google.com/))
- Don’t forget to whitelist the domain (e.g. `http://localhost:3000` and `https://your-vercel-url.vercel.app`)

### 3. Create Tables

Run the following SQL under **Supabase → SQL Editor**:

```sql
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  color text not null,
  created_at timestamp default now(),
  archived boolean default false
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  date date not null,
  status text check (status in ('active', 'rest')),
  unique (habit_id, date)
);

create table public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  content text,
  unique (user_id, date)
);
```

### 4. Configure RLS
Enable RLS on all three tables and apply this policy:

```sql
-- For habits, habit_logs, and daily_notes:
create policy "Users can only access their own data"
on [TABLE_NAME]
for all
using (auth.uid() = user_id);
```
Replace [TABLE_NAME] with `habits`, `daily_notes`.

For `habit_logs`, use:

```sql
create policy "User can read/write logs tied to their habits"
on habit_logs
for all
using (
  auth.uid() = (
    select user_id from habits where habits.id = habit_logs.habit_id
  )
);
```

### 5. Environment

Create a `.env.local` file at the root of your project:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 6. Deploy to Vercel

1. Push your code to GitHub.
2. Go to vercel.com → New Project → Import GitHub Repo.
3. In Environment Variables, add environment variables shown before:
4. Click Deploy.
5. Done 


---

## Tech Stack

- [Next.js 15 (App Router)]
- Supabase (Auth + Database)
- TailwindCSS
- TypeScript
- html-to-image + Clipboard API
- canvas-confetti

---

Made with hate because i hate habit trackers.
