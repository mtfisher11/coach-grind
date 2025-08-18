-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS for consistent data
CREATE TYPE offensive_system AS ENUM ('air_raid', 'west_coast', 'spread', 'pro_style', 'option', 'wing_t', 'pistol', 'custom');
CREATE TYPE personnel_group AS ENUM ('00', '10', '11', '12', '13', '20', '21', '22', '23', '30', '31', '32');
CREATE TYPE field_position AS ENUM ('own_1_10', 'own_11_20', 'own_21_30', 'own_31_40', 'own_41_50', 'opp_49_40', 'opp_39_30', 'opp_29_20', 'opp_19_10', 'opp_9_goal');
CREATE TYPE hash_mark AS ENUM ('left', 'middle', 'right');
CREATE TYPE play_type AS ENUM ('pass', 'run', 'play_action', 'rpo', 'trick', 'special');

-- Users & Teams
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  coaching_level TEXT, -- youth, high_school, college, pro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL, -- youth, high_school, college, pro
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, coach, analyst
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  PRIMARY KEY (team_id, user_id)
);

-- Core Formation Data
CREATE TABLE formations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  system offensive_system NOT NULL,
  personnel personnel_group NOT NULL,
  positions JSONB NOT NULL, -- {"QB": [600, 450], "RB": [640, 500], ...}
  alignment_rules JSONB, -- {"strong": "right", "slot_alignment": "3x1"}
  created_by UUID REFERENCES profiles(id),
  team_id UUID REFERENCES teams(id),
  is_public BOOLEAN DEFAULT false,
  is_base BOOLEAN DEFAULT false, -- true for system formations
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Route Concepts & Combinations
CREATE TABLE route_concepts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- quick_game, dropback, play_action, screen, etc.
  routes JSONB NOT NULL, -- {"X": "hitch", "Z": "corner", ...}
  progression TEXT[], -- ["Z", "X", "RB", "Y"]
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Blocking Schemes
CREATE TABLE blocking_schemes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type play_type NOT NULL,
  scheme_type TEXT NOT NULL, -- gap, zone, man, combo
  assignments JSONB NOT NULL, -- {"C": "0_tech", "RG": "combo_3_tech_mike", ...}
  description TEXT,
  coaching_points TEXT[],
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Complete Plays (20K+ records)
CREATE TABLE plays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  formation_id UUID REFERENCES formations(id) NOT NULL,
  play_type play_type NOT NULL,
  
  -- Passing plays
  route_concept_id UUID REFERENCES route_concepts(id),
  protection_id UUID REFERENCES blocking_schemes(id),
  
  -- Running plays  
  run_scheme_id UUID REFERENCES blocking_schemes(id),
  ball_carrier TEXT, -- RB, QB, WR
  
  -- Play details
  actions JSONB NOT NULL, -- [{"player": "X", "action": "motion", "timing": "pre-snap", "path": "..."}]
  tags TEXT[], -- ['red_zone', '3rd_and_short', 'two_minute']
  
  -- Situational data
  down INTEGER CHECK (down >= 1 AND down <= 4),
  distance INTEGER CHECK (distance >= 0),
  field_position field_position,
  hash hash_mark,
  
  -- AI coaching data
  when_to_call TEXT[],
  best_against TEXT[], -- ['cover_2', 'cover_3', 'man']
  strengths TEXT[],
  weaknesses TEXT[],
  coaching_points TEXT[],
  
  -- Metadata
  created_by UUID REFERENCES profiles(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  is_public BOOLEAN DEFAULT false,
  success_rate DECIMAL(3,2), -- 0.00 to 1.00
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Playbooks & Organization
CREATE TABLE playbooks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) NOT NULL,
  season TEXT,
  week INTEGER,
  opponent TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE playbook_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Red Zone", "3rd Down", "2 Minute"
  order_index INTEGER NOT NULL,
  situation_filters JSONB -- {"down": 3, "distance_min": 3, "distance_max": 7}
);

CREATE TABLE playbook_plays (
  section_id UUID REFERENCES playbook_sections(id) ON DELETE CASCADE,
  play_id UUID REFERENCES plays(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  notes TEXT,
  PRIMARY KEY (section_id, play_id)
);

-- Game Planning & Tendencies
CREATE TABLE opponent_tendencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) NOT NULL,
  opponent_name TEXT NOT NULL,
  defensive_fronts JSONB, -- {"4-3": 0.45, "3-4": 0.35, "nickel": 0.20}
  coverages JSONB, -- {"cover_1": 0.25, "cover_2": 0.30, ...}
  blitz_rate DECIMAL(3,2),
  situational_tendencies JSONB, -- {"3rd_and_long": {"blitz_rate": 0.65, "coverage": {...}}}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- AI Training Data
CREATE TABLE play_outcomes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  play_id UUID REFERENCES plays(id) NOT NULL,
  game_date DATE NOT NULL,
  opponent TEXT,
  defensive_front TEXT,
  coverage TEXT,
  result TEXT NOT NULL, -- touchdown, first_down, incomplete, etc.
  yards_gained INTEGER,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_plays_formation ON plays(formation_id);
CREATE INDEX idx_plays_team ON plays(team_id);
CREATE INDEX idx_plays_tags ON plays USING GIN(tags);
CREATE INDEX idx_plays_situation ON plays(down, distance, field_position);
CREATE INDEX idx_formations_system ON formations(system);
CREATE INDEX idx_formations_personnel ON formations(personnel);

-- Full text search
CREATE INDEX idx_plays_search ON plays USING GIN(to_tsvector('english', name || ' ' || COALESCE(tags::text, '')));

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

-- Public formations/plays can be read by anyone
CREATE POLICY "Public formations are viewable by everyone" ON formations
  FOR SELECT USING (is_public = true);

CREATE POLICY "Public plays are viewable by everyone" ON plays
  FOR SELECT USING (is_public = true);

-- Users can CRUD their own data
CREATE POLICY "Users can manage their own formations" ON formations
  FOR ALL USING (auth.uid() = created_by OR team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own plays" ON plays
  FOR ALL USING (auth.uid() = created_by OR team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));