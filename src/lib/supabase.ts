import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rjxkllwfjafwvmxtmmrm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqeGtsbHdmamFmd3ZteHRtbXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4OTAzNzcsImV4cCI6MjA2ODQ2NjM3N30.kXWj_SkzGz4JPwJ8BkkI9sZ04_aRXlB2S9X5yY0LhSE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Formation {
  id: string;
  name: string;
  system: string; // air_raid, west_coast, spread, etc.
  personnel: string; // 11, 12, 21, etc.
  positions: Record<string, [number, number]>; // position -> [x,y]
  created_by?: string;
  is_public: boolean;
}

export interface RouteAction {
  player_id: string;
  action_type: 'route' | 'block' | 'motion';
  action_value: string; // hitch, double_team, jet_motion, etc.
  path?: string; // SVG path for routes
  target?: string; // for blocks - who to block
}

export interface Play {
  id: string;
  name: string;
  formation_id: string;
  concept_id?: string;
  protection_id?: string;
  actions: RouteAction[];
  tags: string[]; // red_zone, 3rd_down, etc.
  notes?: string;
  situation?: {
    down?: number;
    distance?: number;
    field_position?: string;
    hash?: 'left' | 'middle' | 'right';
  };
  created_by: string;
  team_id?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteConcept {
  id: string;
  name: string;
  category: string; // quick_game, dropback, play_action, etc.
  routes: Record<string, string>; // position -> route
  description: string;
  strengths: string[];
  weaknesses: string[];
  coaching_points: string[];
}

export interface BlockingScheme {
  id: string;
  name: string;
  type: 'pass' | 'run';
  assignments: Record<string, string>; // OL position -> assignment
  description: string;
}