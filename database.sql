-- ============================================================
-- FLOG CALCUTTA — Complete Database Setup
-- Paste this ENTIRE file into Supabase SQL Editor → Run
-- ============================================================

-- Clean slate (safe to re-run)
drop table if exists tournament_teams cascade;
drop table if exists auction_items cascade;

-- ============================================================
-- TABLES
-- ============================================================

create table auction_items (
  id            serial primary key,
  auction_order int  not null unique,
  display_name  text not null,
  is_block      boolean default false,
  owner         text,           -- null until sold
  bid_amount    int             -- null until sold
);

create table tournament_teams (
  id              serial primary key,
  name            text not null,
  seed            int  not null,
  region          text not null,
  auction_item_id int  references auction_items(id),
  wins            int  default 0   not null,
  eliminated      boolean default false not null,
  loss_margin     int  default 0   not null  -- margin of the game they lost (for largest-loss prize)
);

-- ============================================================
-- REAL-TIME (all phones update instantly when admin enters data)
-- ============================================================
alter publication supabase_realtime add table auction_items;
alter publication supabase_realtime add table tournament_teams;

-- ============================================================
-- SECURITY (allow the app to read/write without a user login)
-- ============================================================
alter table auction_items    enable row level security;
alter table tournament_teams enable row level security;
create policy "public_all" on auction_items    for all using (true) with check (true);
create policy "public_all" on tournament_teams for all using (true) with check (true);

-- ============================================================
-- AUCTION ITEMS (53 items — inserted in auction order so IDs = 1-53)
--
-- ORDER:
--   1-40  : Seeds 2-11, alphabetical
--   41    : The 12-14 Seed Block (one bid, 12 teams)
--   42-49 : Seeds 15-16, alphabetical
--   50-53 : Seeds 1, alphabetical
--
-- ⚠️  Items marked "TBD" — update the display_name once bracket is set:
--     update auction_items set display_name = 'Actual Team Name' where id = X;
-- ============================================================

insert into auction_items (auction_order, display_name) values
  -- Seeds 2-11 alphabetical (IDs 1-40)
  ( 1, 'Alabama'),
  ( 2, 'Arkansas'),
  ( 3, 'BYU'),
  ( 4, 'Clemson'),
  ( 5, 'Georgia'),
  ( 6, 'Gonzaga'),
  ( 7, 'Houston'),
  ( 8, 'Illinois'),
  ( 9, 'Iowa'),
  (10, 'Iowa State'),
  (11, 'Kansas'),
  (12, 'Kentucky'),
  (13, 'Louisville'),
  (14, 'Miami'),
  (15, 'Miami (Ohio)/SMU'),
  (16, 'Michigan State'),
  (17, 'Missouri'),
  (18, 'Nebraska'),
  (19, 'North Carolina'),
  (20, 'Ohio State'),
  (21, 'Purdue'),
  (22, 'Saint Louis'),
  (23, 'Saint Mary''s'),
  (24, 'Santa Clara'),
  (25, 'South Florida'),
  (26, 'St. John''s'),
  (27, 'TCU'),
  (28, 'Tennessee'),
  (29, 'Texas A&M'),
  (30, 'Texas Tech'),
  (31, 'Texas/NC State'),
  (32, 'UCF'),
  (33, 'UCLA'),
  (34, 'UConn'),
  (35, 'Utah State'),
  (36, 'Vanderbilt'),
  (37, 'Villanova'),
  (38, 'Virginia'),
  (39, 'Wisconsin'),
  (40, 'East 11 Seed TBD');  -- ⚠️ Update with actual team

-- Block (ID 41)
insert into auction_items (auction_order, display_name, is_block) values
  (41, '12-14 Seed Block', true);

-- Seeds 15-16 alphabetical (IDs 42-49)
insert into auction_items (auction_order, display_name) values
  (42, 'East 15 TBD'),           -- ⚠️ Update
  (43, 'East 16 TBD'),           -- ⚠️ Update
  (44, 'LIU'),
  (45, 'Prairie View A&M/Lehigh'),
  (46, 'Queens'),
  (47, 'South 15 TBD'),          -- ⚠️ Update
  (48, 'Tennessee State'),
  (49, 'UMBC/Howard');

-- Seeds 1 alphabetical (IDs 50-53)
insert into auction_items (auction_order, display_name) values
  (50, 'Arizona'),
  (51, 'Duke'),
  (52, 'Florida'),
  (53, 'Michigan');

-- ============================================================
-- TOURNAMENT TEAMS (all 64 bracket slots)
-- auction_item_id links each slot to who bought it.
-- IDs match the insertion order above (Alabama=1, block=41, etc.)
-- ============================================================

insert into tournament_teams (name, seed, region, auction_item_id) values
  -- MIDWEST
  ('Michigan',         1,  'Midwest', 53),
  ('Iowa State',       2,  'Midwest', 10),
  ('Virginia',         3,  'Midwest', 38),
  ('Alabama',          4,  'Midwest',  1),
  ('Texas Tech',       5,  'Midwest', 30),
  ('Tennessee',        6,  'Midwest', 28),
  ('Kentucky',         7,  'Midwest', 12),
  ('Georgia',          8,  'Midwest',  5),
  ('Saint Louis',      9,  'Midwest', 22),
  ('Santa Clara',      10, 'Midwest', 24),
  ('Miami (Ohio)/SMU', 11, 'Midwest', 15),
  ('Akron',            12, 'Midwest', 41),   -- block
  ('Hofstra',          13, 'Midwest', 41),   -- block
  ('Wright State',     14, 'Midwest', 41),   -- block
  ('Tennessee State',  15, 'Midwest', 48),
  ('UMBC/Howard',      16, 'Midwest', 49),

  -- WEST
  ('Arizona',          1,  'West',    50),
  ('Purdue',           2,  'West',    21),
  ('Gonzaga',          3,  'West',     6),
  ('Arkansas',         4,  'West',     2),
  ('Wisconsin',        5,  'West',    39),
  ('BYU',              6,  'West',     3),
  ('Miami',            7,  'West',    14),
  ('Villanova',        8,  'West',    37),
  ('Utah State',       9,  'West',    35),
  ('Missouri',         10, 'West',    17),
  ('Texas/NC State',   11, 'West',    31),
  ('High Point',       12, 'West',    41),   -- block
  ('Hawaii',           13, 'West',    41),   -- block
  ('Kennesaw State',   14, 'West',    41),   -- block
  ('Queens',           15, 'West',    46),
  ('LIU',              16, 'West',    44),

  -- SOUTH
  ('Florida',          1,  'South',   52),
  ('Houston',          2,  'South',    7),
  ('Illinois',         3,  'South',    8),
  ('Nebraska',         4,  'South',   18),
  ('Vanderbilt',       5,  'South',   36),
  ('Louisville',       6,  'South',   13),
  ('Saint Mary''s',    7,  'South',   23),
  ('Clemson',          8,  'South',    4),
  ('Iowa',             9,  'South',    9),
  ('Texas A&M',        10, 'South',   29),
  ('South Florida',    11, 'South',   25),
  ('McNeese',          12, 'South',   41),   -- block
  ('South 13 TBD',     13, 'South',   41),   -- block ⚠️ Update name
  ('South 14 TBD',     14, 'South',   41),   -- block ⚠️ Update name
  ('South 15 TBD',     15, 'South',   47),   -- ⚠️ Update name
  ('Prairie View A&M/Lehigh', 16, 'South', 45),

  -- EAST
  ('Duke',             1,  'East',    51),
  ('UConn',            2,  'East',    34),
  ('Michigan State',   3,  'East',    16),
  ('Kansas',           4,  'East',    11),
  ('St. John''s',      5,  'East',    26),
  ('North Carolina',   6,  'East',    19),
  ('UCLA',             7,  'East',    33),
  ('Ohio State',       8,  'East',    20),
  ('TCU',              9,  'East',    27),
  ('UCF',              10, 'East',    32),
  ('East 11 TBD',      11, 'East',    40),   -- ⚠️ Update name
  ('East 12 TBD',      12, 'East',    41),   -- block ⚠️ Update name
  ('East 13 TBD',      13, 'East',    41),   -- block ⚠️ Update name
  ('East 14 TBD',      14, 'East',    41),   -- block ⚠️ Update name
  ('East 15 TBD',      15, 'East',    42),   -- ⚠️ Update name
  ('East 16 TBD',      16, 'East',    43);   -- ⚠️ Update name

-- ============================================================
-- DONE. To update any "TBD" team names after bracket is set:
--   update tournament_teams set name = 'Real Team' where name = 'South 13 TBD';
--   update auction_items set display_name = 'Real Team' where display_name = 'East 11 Seed TBD';
-- ============================================================
