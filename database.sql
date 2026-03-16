-- ============================================================
-- FLOG CALCUTTA 2026 — Complete Database Setup
-- Paste this ENTIRE file into Supabase SQL Editor → Run
-- ============================================================

-- ============================================================
-- ⚠️  PLAY-IN GAMES — update these once winners are known:
--
-- update auction_items    set display_name = 'UMBC'           where display_name = 'UMBC/Howard';
-- update tournament_teams set name         = 'UMBC'           where name         = 'UMBC/Howard';
--
-- update auction_items    set display_name = 'Prairie View'   where display_name = 'Prairie View A&M/Lehigh';
-- update tournament_teams set name         = 'Prairie View'   where name         = 'Prairie View A&M/Lehigh';
--
-- update auction_items    set display_name = 'Texas'          where display_name = 'Texas/NC State';
-- update tournament_teams set name         = 'Texas'          where name         = 'Texas/NC State';
-- ============================================================

drop table if exists tournament_teams cascade;
drop table if exists auction_items cascade;

create table auction_items (
  id            serial primary key,
  auction_order int  not null unique,
  display_name  text not null,
  is_block      boolean default false,
  owner         text,
  bid_amount    int
);

create table tournament_teams (
  id              serial primary key,
  name            text not null,
  seed            int  not null,
  region          text not null,
  auction_item_id int  references auction_items(id),
  wins            int  default 0   not null,
  eliminated      boolean default false not null,
  loss_margin     int  default 0   not null
);

alter publication supabase_realtime add table auction_items;
alter publication supabase_realtime add table tournament_teams;

alter table auction_items    enable row level security;
alter table tournament_teams enable row level security;
create policy "public_all" on auction_items    for all using (true) with check (true);
create policy "public_all" on tournament_teams for all using (true) with check (true);

-- ============================================================
-- AUCTION ITEMS
-- Seeds 2-11: all 40 teams alphabetical (auction_order 1-40)
-- Block 12-14: one item (auction_order 41)
-- Seeds 15-16: 8 teams alphabetical (auction_order 42-49)
-- Seeds 1: 4 teams alphabetical (auction_order 50-53)
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
  (37, 'VCU'),
  (38, 'Virginia'),
  (39, 'Villanova'),
  (40, 'Wisconsin');

-- Block (ID 41)
insert into auction_items (auction_order, display_name, is_block) values
  (41, '12-14 Seed Block', true);

-- Seeds 15-16 alphabetical (IDs 42-49)
insert into auction_items (auction_order, display_name) values
  (42, 'Furman'),
  (43, 'Idaho'),
  (44, 'Long Island'),
  (45, 'Prairie View A&M/Lehigh'),
  (46, 'Queens'),
  (47, 'Siena'),
  (48, 'Tennessee State'),
  (49, 'UMBC/Howard');

-- Seeds 1 alphabetical (IDs 50-53)
insert into auction_items (auction_order, display_name) values
  (50, 'Arizona'),
  (51, 'Duke'),
  (52, 'Florida'),
  (53, 'Michigan');

-- ============================================================
-- TOURNAMENT TEAMS — all 64 bracket slots
-- ============================================================

insert into tournament_teams (name, seed, region, auction_item_id) values
  -- MIDWEST
  ('Michigan',          1,  'Midwest', 53),
  ('UMBC/Howard',       16, 'Midwest', 49),
  ('Georgia',           8,  'Midwest',  5),
  ('Saint Louis',       9,  'Midwest', 22),
  ('Texas Tech',        5,  'Midwest', 30),
  ('Akron',             12, 'Midwest', 41),
  ('Alabama',           4,  'Midwest',  1),
  ('Hofstra',           13, 'Midwest', 41),
  ('Tennessee',         6,  'Midwest', 28),
  ('Miami (Ohio)/SMU',  11, 'Midwest', 15),
  ('Virginia',          3,  'Midwest', 38),
  ('Wright State',      14, 'Midwest', 41),
  ('Kentucky',          7,  'Midwest', 12),
  ('Santa Clara',       10, 'Midwest', 24),
  ('Iowa State',        2,  'Midwest', 10),
  ('Tennessee State',   15, 'Midwest', 48),

  -- WEST
  ('Arizona',           1,  'West',    50),
  ('Long Island',       16, 'West',    44),
  ('Villanova',         8,  'West',    39),
  ('Utah State',        9,  'West',    35),
  ('Wisconsin',         5,  'West',    40),
  ('High Point',        12, 'West',    41),
  ('Arkansas',          4,  'West',     2),
  ('Hawaii',            13, 'West',    41),
  ('BYU',               6,  'West',     3),
  ('Texas/NC State',    11, 'West',    31),
  ('Gonzaga',           3,  'West',     6),
  ('Kennesaw State',    14, 'West',    41),
  ('Miami',             7,  'West',    14),
  ('Missouri',          10, 'West',    17),
  ('Purdue',            2,  'West',    21),
  ('Queens',            15, 'West',    46),

  -- SOUTH
  ('Florida',           1,  'South',   52),
  ('Prairie View A&M/Lehigh', 16, 'South', 45),
  ('Clemson',           8,  'South',    4),
  ('Iowa',              9,  'South',    9),
  ('Vanderbilt',        5,  'South',   36),
  ('McNeese',           12, 'South',   41),
  ('Nebraska',          4,  'South',   18),
  ('Troy',              13, 'South',   41),
  ('North Carolina',    6,  'South',   19),
  ('VCU',               11, 'South',   37),
  ('Illinois',          3,  'South',    8),
  ('Penn',              14, 'South',   41),
  ('Saint Mary''s',     7,  'South',   23),
  ('Texas A&M',         10, 'South',   29),
  ('Houston',           2,  'South',    7),
  ('Idaho',             15, 'South',   43),

  -- EAST
  ('Duke',              1,  'East',    51),
  ('Siena',             16, 'East',    47),
  ('Ohio State',        8,  'East',    20),
  ('TCU',               9,  'East',    27),
  ('St. John''s',       5,  'East',    26),
  ('Northern Iowa',     12, 'East',    41),
  ('Kansas',            4,  'East',    11),
  ('Cal Baptist',       13, 'East',    41),
  ('Louisville',        6,  'East',    13),
  ('South Florida',     11, 'East',    25),
  ('Michigan State',    3,  'East',    16),
  ('North Dakota',      14, 'East',    41),
  ('UCLA',              7,  'East',    33),
  ('UCF',               10, 'East',    32),
  ('UConn',             2,  'East',    34),
  ('Furman',            15, 'East',    42);

-- ============================================================
-- DONE.
-- ============================================================
