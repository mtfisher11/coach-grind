import { supabase } from '../lib/supabase';
import type { Formation, Play, RouteConcept, BlockingScheme } from '../lib/supabase';

export class PlaybookService {
  // Formations
  static async getFormations(teamId?: string) {
    let query = supabase
      .from('formations')
      .select('*')
      .order('name');

    if (teamId) {
      query = query.or(`team_id.eq.${teamId},is_public.eq.true`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Formation[];
  }

  static async createFormation(formation: Partial<Formation>) {
    const { data, error } = await supabase
      .from('formations')
      .insert(formation)
      .select()
      .single();
    
    if (error) throw error;
    return data as Formation;
  }

  // Route Concepts
  static async getRouteConcepts() {
    const { data, error } = await supabase
      .from('route_concepts')
      .select('*')
      .order('category', { ascending: true })
      .order('name');
    
    if (error) throw error;
    return data as RouteConcept[];
  }

  // Blocking Schemes
  static async getBlockingSchemes(type?: 'pass' | 'run') {
    let query = supabase
      .from('blocking_schemes')
      .select('*')
      .order('name');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as BlockingScheme[];
  }

  // Plays
  static async getPlays(filters?: {
    teamId?: string;
    tags?: string[];
    formation?: string;
    concept?: string;
    situation?: { down?: number; distance?: number };
  }) {
    let query = supabase
      .from('plays')
      .select(`
        *,
        formation:formations(name, system, personnel),
        route_concept:route_concepts(name, category),
        protection:blocking_schemes(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.teamId) {
      query = query.or(`team_id.eq.${filters.teamId},is_public.eq.true`);
    } else {
      query = query.eq('is_public', true);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.formation) {
      query = query.eq('formation_id', filters.formation);
    }

    if (filters?.concept) {
      query = query.eq('route_concept_id', filters.concept);
    }

    if (filters?.situation) {
      if (filters.situation.down) {
        query = query.eq('down', filters.situation.down);
      }
      if (filters.situation.distance) {
        query = query.gte('distance', filters.situation.distance - 2)
                     .lte('distance', filters.situation.distance + 2);
      }
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;
    return data as Play[];
  }

  static async createPlay(play: Partial<Play>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to create plays');

    const { data, error } = await supabase
      .from('plays')
      .insert({
        ...play,
        created_by: user.id,
        actions: play.actions || []
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Play;
  }

  static async updatePlay(id: string, updates: Partial<Play>) {
    const { data, error } = await supabase
      .from('plays')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Play;
  }

  static async deletePlay(id: string) {
    const { error } = await supabase
      .from('plays')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Search plays by name or tags
  static async searchPlays(searchTerm: string) {
    const { data, error } = await supabase
      .from('plays')
      .select(`
        *,
        formation:formations(name),
        route_concept:route_concepts(name)
      `)
      .textSearch('name', searchTerm)
      .limit(20);
    
    if (error) throw error;
    return data as Play[];
  }

  // Get play suggestions based on situation
  static async getPlaySuggestions(situation: {
    down: number;
    distance: number;
    fieldPosition?: string;
    timeRemaining?: number;
  }) {
    // This will eventually use AI, for now use tag matching
    const tags = [];
    
    if (situation.down === 3 && situation.distance <= 3) {
      tags.push('3rd_short');
    } else if (situation.down === 3 && situation.distance >= 7) {
      tags.push('3rd_long');
    }
    
    if (situation.fieldPosition && situation.fieldPosition.includes('opp_19')) {
      tags.push('red_zone');
    }
    
    if (situation.timeRemaining && situation.timeRemaining < 120) {
      tags.push('two_minute');
    }

    const { data, error } = await supabase
      .from('plays')
      .select(`
        *,
        formation:formations(name),
        route_concept:route_concepts(name)
      `)
      .contains('tags', tags)
      .order('success_rate', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data as Play[];
  }

  // Analytics
  static async getPlayAnalytics(playId: string) {
    const { data, error } = await supabase
      .from('play_outcomes')
      .select('*')
      .eq('play_id', playId)
      .order('game_date', { ascending: false });
    
    if (error) throw error;
    
    // Calculate success metrics
    const totalPlays = data.length;
    const successfulPlays = data.filter(o => 
      o.result === 'touchdown' || 
      o.result === 'first_down' || 
      (o.yards_gained && o.yards_gained >= 4)
    ).length;
    
    const averageYards = data.reduce((sum, o) => sum + (o.yards_gained || 0), 0) / totalPlays;
    
    return {
      totalPlays,
      successRate: totalPlays > 0 ? successfulPlays / totalPlays : 0,
      averageYards,
      outcomes: data
    };
  }
}