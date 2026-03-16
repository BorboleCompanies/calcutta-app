# FLOG Calcutta App — Setup Guide

Follow these steps exactly. Each one should take about 5 minutes.
Total setup time: ~30 minutes.

---

## What you'll need
- Your GitHub account (you already have this)
- A Supabase account (free — you'll create this in Step 1)
- A Vercel account (free — you'll create this in Step 2)

---

## STEP 1: Set up Supabase (your database)

**1a.** Go to https://supabase.com and click **Start your project**
- Sign up with GitHub (easiest — uses your existing account)

**1b.** Click **New Project**
- Organization: your name
- Project name: `calcutta-app`
- Database password: make a strong one and save it somewhere (you won't need it often)
- Region: pick the closest to you (US East or US West)
- Click **Create new project** — wait ~60 seconds

**1c.** Set up the database:
- In the left sidebar, click **SQL Editor**
- Click **New query**
- Open the file `database.sql` from this project folder
- Copy everything in that file and paste it into the SQL Editor
- Click **Run** (green button, top right)
- You should see "Success. No rows returned" — that means it worked ✓

**1d.** Get your API keys:
- In the left sidebar, click **Project Settings** (gear icon at the bottom)
- Click **API**
- You'll need two values. Copy them somewhere:
  - **Project URL** — looks like `https://abcdefgh.supabase.co`
  - **anon public** key — a long string starting with `eyJ...`

---

## STEP 2: Put the app files on GitHub

**2a.** Go to https://github.com and sign in

**2b.** Click the **+** icon (top right) → **New repository**
- Repository name: `calcutta-app`
- Leave everything else as default
- Click **Create repository**

**2c.** Upload the files:
- On the new empty repo page, click **uploading an existing file** (the link in the middle of the page)
- Open the `calcutta-app` folder on your computer
- Drag ALL the files and folders into the GitHub upload area
  - You need to upload: `index.html`, `package.json`, `vite.config.js`, `.env.example`, and the entire `src/` folder
  - **Important:** GitHub can't upload folders directly in the web UI. For the `src` folder, you may need to drag files from inside it one level at a time, or use the steps below.
- Commit message: `Initial commit`
- Click **Commit changes**

> **Note on the src/ folder:** GitHub web upload supports nested folders if you drag the entire `src` folder at once. If it doesn't work, try using https://github.com and the drag-drop upload — it should handle subfolders automatically.

---

## STEP 3: Deploy on Vercel

**3a.** Go to https://vercel.com
- Click **Sign up** → **Continue with GitHub**
- Authorize Vercel to access your GitHub

**3b.** Import your project:
- Click **Add New** → **Project**
- You'll see your GitHub repos — click **Import** next to `calcutta-app`
- Vercel will auto-detect it as a Vite project ✓

**3c.** Add your environment variables (THIS IS CRITICAL):
- Before clicking Deploy, look for **Environment Variables** section
- Add these three variables one at a time:

  | Name | Value |
  |------|-------|
  | `VITE_SUPABASE_URL` | Your Supabase Project URL from Step 1d |
  | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key from Step 1d |
  | `VITE_ADMIN_PASSWORD` | Whatever password you want for the Admin screen |

- Click **Deploy**
- Wait ~2 minutes for the build to complete

**3d.** Your app is live! Vercel gives you a URL like `calcutta-app-xyz.vercel.app`
- Share this URL with your group for the Auction Board and Leaderboard
- Bookmark it yourself — you'll use the Admin tab to enter bids and results

---

## STEP 4: Update "TBD" team names

The database was seeded with placeholder names for teams I couldn't confirm from the spreadsheet.
Before the auction, update any "TBD" entries:

- Go to your Supabase project → **SQL Editor** → **New query**
- Run commands like:
  ```sql
  -- Update the East 11 seed (replace with actual team)
  update auction_items    set display_name = 'Actual Team Name' where display_name = 'East 11 Seed TBD';
  update tournament_teams set name = 'Actual Team Name'         where name = 'East 11 TBD';

  -- Update South 13 seed (in the block)
  update tournament_teams set name = 'Actual Team Name' where name = 'South 13 TBD';
  ```

---

## Checklist: Teams to verify before auction night

The following team slots have placeholder "TBD" names — confirm against your bracket:

- [ ] East 11 seed (auction_items row 40)
- [ ] East 12, 13, 14 seeds (tournament_teams — part of block)
- [ ] East 15 seed (auction_items row 42)
- [ ] East 16 seed (auction_items row 43)
- [ ] South 13 seed (tournament_teams — part of block)
- [ ] South 14 seed (tournament_teams — part of block)
- [ ] South 15 seed (auction_items row 47)

---

## How to use the app

### Auction night (you)
1. Open the app on your phone
2. Tap **Admin** → enter your password
3. Tap **Enter Bids** tab
4. The current team "up for auction" shows automatically
5. Tap the winner's name, enter the bid amount, tap Confirm
6. Repeat for all 53 items
7. Everyone else watching on their phones sees the **Board** tab update in real time

### Tournament weekends (you)
1. Open Admin → **Results** tab
2. Tap a team after each game
3. Tap **+ WIN** or **Eliminated**
4. If Eliminated, enter the loss margin (the point difference they lost by) — this determines the largest-loss bonus
5. Leaderboard and payouts update instantly for everyone

### For everyone else
- Open the app URL on their phone
- **Board** tab: watch the auction live
- **Standings** tab: leaderboard during the tournament
- **My Teams** tab: tap their name to see their teams
- **Payouts** tab: prize ladder and historic seed ROI

---

## Troubleshooting

**App shows "Loading..." forever:**
Check that your Supabase URL and anon key are correct in Vercel's environment variables.
Go to Vercel → your project → Settings → Environment Variables.

**"Error saving" when entering bids:**
Go to Supabase → SQL Editor and re-run just the Row Level Security part of database.sql.

**Need to fix a bid you entered wrong:**
Admin → Bid Log → tap ✕ next to the entry. Then re-enter it correctly from the Enter Bids tab.
Note: you'll need to manually navigate to that team since it re-queues at the end.

**Want to reset everything and start over:**
Go to Supabase → SQL Editor → run the full database.sql file again (it has `drop table if exists` at the top).

---

## Every year
1. Go to Supabase SQL Editor
2. Re-run `database.sql` (clears last year's data)
3. Update TBD team names for the new bracket
4. Done — same URL works every year
