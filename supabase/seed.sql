-- Seed base formations that come with the system
INSERT INTO formations (name, system, personnel, positions, is_public, is_base) VALUES
-- Air Raid Formations
('Trips Right', 'air_raid', '11', 
 '{"QB": [600, 380], "RB": [600, 420], "C": [600, 350], "LG": [570, 350], "RG": [630, 350], "LT": [540, 350], "RT": [660, 350], "X": [200, 350], "Z": [850, 350], "Y": [690, 350], "F": [750, 350]}',
 true, true),

('Trips Left', 'air_raid', '11',
 '{"QB": [600, 380], "RB": [600, 420], "C": [600, 350], "LG": [570, 350], "RG": [630, 350], "LT": [540, 350], "RT": [660, 350], "X": [1000, 350], "Z": [350, 350], "Y": [510, 350], "F": [450, 350]}',
 true, true),

('Empty Quads', 'air_raid', '10',
 '{"QB": [600, 380], "C": [600, 350], "LG": [570, 350], "RG": [630, 350], "LT": [540, 350], "RT": [660, 350], "X": [200, 350], "Z": [350, 350], "Y": [850, 350], "F": [1000, 350], "W": [750, 350]}',
 true, true),

-- West Coast Formations  
('I-Form Strong', 'west_coast', '21',
 '{"QB": [600, 380], "FB": [600, 420], "HB": [600, 460], "C": [600, 350], "LG": [570, 350], "RG": [630, 350], "LT": [540, 350], "RT": [660, 350], "X": [200, 350], "Z": [1000, 350], "Y": [690, 350]}',
 true, true),

('Strong Right', 'west_coast', '12',
 '{"QB": [600, 380], "RB": [560, 420], "C": [600, 350], "LG": [570, 350], "RG": [630, 350], "LT": [540, 350], "RT": [660, 350], "X": [200, 350], "Z": [1000, 350], "Y": [690, 350], "F": [510, 350]}',
 true, true),

-- Spread Formations
('Gun Spread 2x2', 'spread', '11',
 '{"QB": [600, 420], "RB": [600, 470], "C": [600, 350], "LG": [570, 350], "RG": [630, 350], "LT": [540, 350], "RT": [660, 350], "X": [200, 350], "Z": [1000, 350], "Y": [400, 350], "F": [800, 350]}',
 true, true),

('Gun Trips Open', 'spread', '10',
 '{"QB": [600, 420], "C": [600, 350], "LG": [570, 350], "RG": [630, 350], "LT": [540, 350], "RT": [660, 350], "X": [200, 350], "Z": [850, 350], "Y": [750, 350], "F": [950, 350], "W": [650, 350]}',
 true, true);

-- Base Route Concepts
INSERT INTO route_concepts (name, category, routes, progression, description, is_public) VALUES
('Mesh', 'dropback', 
 '{"X": "mesh", "Z": "shallow", "Y": "corner", "F": "sit", "RB": "swing"}',
 ARRAY['Z', 'X', 'Y', 'RB'],
 'Crossing routes create natural picks vs man coverage', 
 true),

('Smash', 'quick_game',
 '{"X": "deep", "Z": "corner", "Y": "arrow", "F": "hitch"}',
 ARRAY['Z', 'F', 'Y'],
 'Hi-low concept attacking the flat defender',
 true),

('Four Verticals', 'dropback',
 '{"X": "go", "Z": "go", "Y": "seam", "F": "seam", "RB": "check_release"}',
 ARRAY['F', 'Y', 'Z', 'X', 'RB'],
 'Vertical stretch attacking all levels',
 true),

('Stick', 'quick_game',
 '{"X": "hitch", "Z": "out", "Y": "stick", "RB": "swing"}',
 ARRAY['Y', 'Z', 'RB', 'X'],
 'Triangle stretch concept with quick throws',
 true),

('Flood', 'dropback',
 '{"X": "deep", "Z": "corner", "Y": "out", "RB": "arrow"}',
 ARRAY['Y', 'Z', 'RB'],
 'Three-level vertical stretch to the field',
 true);

-- Base Blocking Schemes
INSERT INTO blocking_schemes (name, type, scheme_type, assignments, description, is_public) VALUES
('Half Slide Right', 'pass', 'slide',
 '{"C": "slide_right", "RG": "slide_right", "RT": "slide_right", "LG": "man", "LT": "man"}',
 'Half slide protection with backside man protection',
 true),

('Half Slide Left', 'pass', 'slide',
 '{"C": "slide_left", "LG": "slide_left", "LT": "slide_left", "RG": "man", "RT": "man"}',
 'Half slide protection with backside man protection',
 true),

('6 Man BOB', 'pass', 'man',
 '{"C": "0_tech", "LG": "1_tech", "RG": "3_tech", "LT": "edge", "RT": "edge", "RB": "mike"}',
 'Big on Big protection with RB on Mike',
 true),

('Inside Zone', 'run', 'zone',
 '{"C": "combo_0_mike", "LG": "combo_1_will", "RG": "combo_3_sam", "LT": "reach", "RT": "reach"}',
 'Zone blocking with combination blocks to linebackers',
 true),

('Power Gap', 'run', 'gap',
 '{"C": "back", "LG": "back", "RG": "pull_kick", "LT": "big_on_big", "RT": "big_on_big", "FB": "lead"}',
 'Gap scheme with pulling guard and lead blocker',
 true);

-- Function to generate play variations
CREATE OR REPLACE FUNCTION generate_base_plays() RETURNS void AS $$
DECLARE
  formation RECORD;
  concept RECORD;
  protection RECORD;
BEGIN
  -- Generate passing plays for each formation/concept/protection combo
  FOR formation IN SELECT * FROM formations WHERE is_base = true LOOP
    FOR concept IN SELECT * FROM route_concepts WHERE is_public = true LOOP
      FOR protection IN SELECT * FROM blocking_schemes WHERE type = 'pass' AND is_public = true LOOP
        INSERT INTO plays (
          name,
          formation_id,
          play_type,
          route_concept_id,
          protection_id,
          actions,
          tags,
          when_to_call,
          best_against,
          strengths,
          weaknesses,
          is_public,
          created_by
        ) VALUES (
          formation.name || ' ' || concept.name || ' - ' || protection.name,
          formation.id,
          'pass',
          concept.id,
          protection.id,
          '[]'::jsonb,
          CASE 
            WHEN concept.category = 'quick_game' THEN ARRAY['3rd_short', 'red_zone']
            WHEN concept.category = 'dropback' THEN ARRAY['1st_down', '2nd_long']
            ELSE ARRAY['standard']
          END,
          ARRAY['3rd & 4-8', '2-minute drill', 'Field position 50+'],
          ARRAY['Cover 1', 'Cover 2', 'Blitz'],
          ARRAY['Quick release', 'Multiple options', 'Field stretcher'],
          ARRAY['Requires protection', 'Timing critical', 'Weather dependent'],
          true,
          (SELECT id FROM auth.users LIMIT 1) -- System user
        );
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate base plays
SELECT generate_base_plays();

-- Add indexes for common queries
CREATE INDEX idx_plays_name ON plays(name);
CREATE INDEX idx_formations_name ON formations(name);