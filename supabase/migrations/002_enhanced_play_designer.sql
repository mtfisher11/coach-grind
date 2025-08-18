-- Enhanced Play Designer Migration
-- Adds comprehensive features for drawing, formations, and rules

-- Store custom formations with detailed positioning
CREATE TABLE custom_formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    personnel TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    positions JSONB NOT NULL, -- {playerId: {x, y, onLOS, eligible, label, number}}
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    is_validated BOOLEAN DEFAULT false, -- Passed NFL rules validation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced plays table with drawing support
ALTER TABLE plays 
ADD COLUMN IF NOT EXISTS player_positions JSONB, -- Current positions after adjustments
ADD COLUMN IF NOT EXISTS drawing_elements JSONB, -- Array of drawing elements
ADD COLUMN IF NOT EXISTS motion_data JSONB, -- Pre-snap motion paths
ADD COLUMN IF NOT EXISTS blocking_assignments JSONB, -- Blocking scheme details
ADD COLUMN IF NOT EXISTS install_date DATE,
ADD COLUMN IF NOT EXISTS game_plan_tags TEXT[],
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Store drawing elements for plays (for better querying)
CREATE TABLE play_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    play_id UUID REFERENCES plays(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL CHECK (element_type IN ('line', 'arrow', 'curve', 'zone', 'text', 'motion', 'block')),
    points JSONB NOT NULL, -- Array of {x, y} coordinates
    color TEXT DEFAULT '#000000',
    line_style TEXT DEFAULT 'solid' CHECK (line_style IN ('solid', 'dashed', 'dotted')),
    text_content TEXT,
    associated_player TEXT, -- For motion paths
    layer_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Motion paths for players
CREATE TABLE player_motions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    play_id UUID REFERENCES plays(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    motion_type TEXT NOT NULL CHECK (motion_type IN ('pre_snap', 'shift', 'motion', 'orbit', 'jet')),
    path JSONB NOT NULL, -- Array of {x, y, time} coordinates
    timing TEXT CHECK (timing IN ('on_cadence', 'hard_count', 'on_snap')),
    speed TEXT CHECK (speed IN ('walk', 'jog', 'sprint')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocking assignments with techniques
CREATE TABLE blocking_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    play_id UUID REFERENCES plays(id) ON DELETE CASCADE,
    blocker_id TEXT NOT NULL,
    defender_id TEXT,
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('man', 'zone', 'combo', 'double', 'fold', 'pull')),
    technique TEXT CHECK (technique IN ('drive', 'reach', 'cut', 'climb', 'down', 'kick_out', 'log', 'fan')),
    landmark TEXT, -- aiming point
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Play tags for advanced categorization
CREATE TABLE play_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('situation', 'concept', 'personnel', 'tempo', 'trick', 'install')),
    color TEXT DEFAULT '#3b82f6',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Many-to-many relationship for plays and tags
CREATE TABLE play_tag_assignments (
    play_id UUID REFERENCES plays(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES play_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (play_id, tag_id)
);

-- Formation validation history
CREATE TABLE formation_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_id UUID REFERENCES custom_formations(id) ON DELETE CASCADE,
    validation_result JSONB NOT NULL, -- {valid: boolean, violations: [], warnings: []}
    validated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Play installation tracking
CREATE TABLE play_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    play_id UUID REFERENCES plays(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    install_date DATE NOT NULL,
    install_period TEXT, -- spring, camp, week_1, etc.
    proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default formation library
INSERT INTO play_tags (name, category, color, description) VALUES
('Red Zone', 'situation', '#dc2626', 'Inside opponent 20 yard line'),
('3rd Down', 'situation', '#f59e0b', '3rd down situations'),
('2 Minute', 'situation', '#8b5cf6', '2 minute drill'),
('Goal Line', 'situation', '#ef4444', 'Inside opponent 5 yard line'),
('Empty', 'personnel', '#3b82f6', 'No running backs'),
('Heavy', 'personnel', '#6b7280', 'Extra blockers'),
('RPO', 'concept', '#10b981', 'Run-Pass Option'),
('Play Action', 'concept', '#06b6d4', 'Play action pass'),
('Screen', 'concept', '#a855f7', 'Screen pass'),
('Tempo', 'tempo', '#f97316', 'No huddle tempo');

-- Create indexes for performance
CREATE INDEX idx_custom_formations_user ON custom_formations(user_id);
CREATE INDEX idx_custom_formations_team ON custom_formations(team_id);
CREATE INDEX idx_play_drawings_play ON play_drawings(play_id);
CREATE INDEX idx_play_drawings_type ON play_drawings(element_type);
CREATE INDEX idx_player_motions_play ON player_motions(play_id);
CREATE INDEX idx_blocking_assignments_play ON blocking_assignments(play_id);
CREATE INDEX idx_play_tags_category ON play_tags(category);
CREATE INDEX idx_plays_game_plan_tags ON plays USING GIN(game_plan_tags);
CREATE INDEX idx_plays_favorite ON plays(is_favorite) WHERE is_favorite = true;

-- Enable RLS on new tables
ALTER TABLE custom_formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_motions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocking_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_installations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view public custom formations" ON custom_formations
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own custom formations" ON custom_formations
    FOR ALL USING (auth.uid() = user_id OR team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage play drawings for their plays" ON play_drawings
    FOR ALL USING (
        play_id IN (
            SELECT id FROM plays WHERE created_by = auth.uid() OR team_id IN (
                SELECT team_id FROM team_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage motions for their plays" ON player_motions
    FOR ALL USING (
        play_id IN (
            SELECT id FROM plays WHERE created_by = auth.uid() OR team_id IN (
                SELECT team_id FROM team_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage blocking for their plays" ON blocking_assignments
    FOR ALL USING (
        play_id IN (
            SELECT id FROM plays WHERE created_by = auth.uid() OR team_id IN (
                SELECT team_id FROM team_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Everyone can view play tags" ON play_tags
    FOR SELECT USING (true);

CREATE POLICY "Users can manage tag assignments for their plays" ON play_tag_assignments
    FOR ALL USING (
        play_id IN (
            SELECT id FROM plays WHERE created_by = auth.uid() OR team_id IN (
                SELECT team_id FROM team_members WHERE user_id = auth.uid()
            )
        )
    );

-- Functions for complex queries

-- Get complete play data with all relationships
CREATE OR REPLACE FUNCTION get_complete_play(play_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'play', row_to_json(p.*),
        'drawings', COALESCE(json_agg(DISTINCT d.*) FILTER (WHERE d.id IS NOT NULL), '[]'::json),
        'motions', COALESCE(json_agg(DISTINCT m.*) FILTER (WHERE m.id IS NOT NULL), '[]'::json),
        'blocking', COALESCE(json_agg(DISTINCT b.*) FILTER (WHERE b.id IS NOT NULL), '[]'::json),
        'tags', COALESCE(json_agg(DISTINCT t.*) FILTER (WHERE t.id IS NOT NULL), '[]'::json)
    ) INTO result
    FROM plays p
    LEFT JOIN play_drawings d ON p.id = d.play_id
    LEFT JOIN player_motions m ON p.id = m.play_id
    LEFT JOIN blocking_assignments b ON p.id = b.play_id
    LEFT JOIN play_tag_assignments pta ON p.id = pta.play_id
    LEFT JOIN play_tags t ON pta.tag_id = t.id
    WHERE p.id = play_uuid
    GROUP BY p.id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search plays with filters
CREATE OR REPLACE FUNCTION search_plays(
    search_term TEXT DEFAULT NULL,
    filter_tags TEXT[] DEFAULT NULL,
    filter_personnel TEXT DEFAULT NULL,
    filter_formation UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    formation_name TEXT,
    personnel TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        f.name as formation_name,
        p.personnel::text,
        p.game_plan_tags as tags,
        p.created_at
    FROM plays p
    JOIN formations f ON p.formation_id = f.id
    WHERE 
        (search_term IS NULL OR p.name ILIKE '%' || search_term || '%')
        AND (filter_tags IS NULL OR p.game_plan_tags && filter_tags)
        AND (filter_personnel IS NULL OR p.personnel::text = filter_personnel)
        AND (filter_formation IS NULL OR p.formation_id = filter_formation)
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;