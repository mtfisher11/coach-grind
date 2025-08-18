import { supabase } from '../lib/supabase';

export interface PlayData {
  id?: string;
  name: string;
  formationId: string;
  personnel: string;
  playerPositions: Record<string, { x: number; y: number; onLOS: boolean; eligible: boolean }>;
  routes: Array<{
    playerId: string;
    routeType: string;
    path: string;
  }>;
  drawingElements?: Array<{
    type: string;
    points: { x: number; y: number }[];
    color: string;
    lineStyle: string;
    text?: string;
  }>;
  motionData?: Array<{
    playerId: string;
    motionType: string;
    path: { x: number; y: number; time: number }[];
    timing: string;
  }>;
  blockingAssignments?: Array<{
    blockerId: string;
    defenderId?: string;
    assignmentType: string;
    technique?: string;
  }>;
  tags?: string[];
  situation?: {
    down?: number;
    distance?: number;
    fieldPosition?: string;
    hash?: string;
  };
  coachingPoints?: string[];
  notes?: string;
}

export class PlayService {
  /**
   * Save a complete play with all associated data
   */
  static async savePlay(playData: PlayData, teamId?: string): Promise<{ data: any; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Start a transaction by saving the main play first
      const { data: play, error: playError } = await supabase
        .from('plays')
        .insert({
          name: playData.name,
          formation_id: playData.formationId,
          personnel: playData.personnel,
          player_positions: playData.playerPositions,
          routes: playData.routes,
          drawing_elements: playData.drawingElements,
          motion_data: playData.motionData,
          blocking_assignments: playData.blockingAssignments,
          game_plan_tags: playData.tags,
          situation: playData.situation,
          coaching_points: playData.coachingPoints,
          notes: playData.notes,
          created_by: user.id,
          team_id: teamId,
          play_type: 'pass' // Default, should be determined by routes/assignments
        })
        .select()
        .single();

      if (playError) throw playError;

      // Save drawing elements
      if (playData.drawingElements && playData.drawingElements.length > 0) {
        const drawingInserts = playData.drawingElements.map((element, index) => ({
          play_id: play.id,
          element_type: element.type,
          points: element.points,
          color: element.color,
          line_style: element.lineStyle,
          text_content: element.text,
          layer_order: index
        }));

        const { error: drawingError } = await supabase
          .from('play_drawings')
          .insert(drawingInserts);

        if (drawingError) console.error('Error saving drawings:', drawingError);
      }

      // Save motion data
      if (playData.motionData && playData.motionData.length > 0) {
        const motionInserts = playData.motionData.map(motion => ({
          play_id: play.id,
          player_id: motion.playerId,
          motion_type: motion.motionType,
          path: motion.path,
          timing: motion.timing
        }));

        const { error: motionError } = await supabase
          .from('player_motions')
          .insert(motionInserts);

        if (motionError) console.error('Error saving motions:', motionError);
      }

      // Save blocking assignments
      if (playData.blockingAssignments && playData.blockingAssignments.length > 0) {
        const blockingInserts = playData.blockingAssignments.map(assignment => ({
          play_id: play.id,
          blocker_id: assignment.blockerId,
          defender_id: assignment.defenderId,
          assignment_type: assignment.assignmentType,
          technique: assignment.technique
        }));

        const { error: blockingError } = await supabase
          .from('blocking_assignments')
          .insert(blockingInserts);

        if (blockingError) console.error('Error saving blocking:', blockingError);
      }

      return { data: play, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Load a complete play with all associated data
   */
  static async loadPlay(playId: string): Promise<{ data: any; error: any }> {
    try {
      // Use the database function to get complete play data
      const { data, error } = await supabase
        .rpc('get_complete_play', { play_uuid: playId });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Search plays with filters
   */
  static async searchPlays(
    searchTerm?: string,
    filterTags?: string[],
    filterPersonnel?: string,
    filterFormation?: string
  ): Promise<{ data: any[]; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('search_plays', {
          search_term: searchTerm,
          filter_tags: filterTags,
          filter_personnel: filterPersonnel,
          filter_formation: filterFormation
        });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Get user's favorite plays
   */
  static async getFavoritePlays(): Promise<{ data: any[]; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('plays')
        .select(`
          *,
          formations (name, personnel)
        `)
        .eq('created_by', user.id)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Toggle play favorite status
   */
  static async toggleFavorite(playId: string): Promise<{ data: any; error: any }> {
    try {
      // First get current status
      const { data: play, error: fetchError } = await supabase
        .from('plays')
        .select('is_favorite')
        .eq('id', playId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the status
      const { data, error } = await supabase
        .from('plays')
        .update({ is_favorite: !play.is_favorite })
        .eq('id', playId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Duplicate a play
   */
  static async duplicatePlay(playId: string, newName: string): Promise<{ data: any; error: any }> {
    try {
      // Load the complete play
      const { data: originalPlay, error: loadError } = await this.loadPlay(playId);
      if (loadError) throw loadError;

      // Create new play data
      const newPlayData: PlayData = {
        name: newName,
        formationId: originalPlay.play.formation_id,
        personnel: originalPlay.play.personnel,
        playerPositions: originalPlay.play.player_positions,
        routes: originalPlay.play.routes,
        drawingElements: originalPlay.drawings,
        motionData: originalPlay.motions,
        blockingAssignments: originalPlay.blocking,
        tags: originalPlay.play.game_plan_tags,
        situation: originalPlay.play.situation,
        coachingPoints: originalPlay.play.coaching_points,
        notes: `Duplicated from: ${originalPlay.play.name}`
      };

      // Save as new play
      return await this.savePlay(newPlayData, originalPlay.play.team_id);
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Get play statistics
   */
  static async getPlayStats(playId: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase
        .from('play_outcomes')
        .select(`
          result,
          yards_gained,
          defensive_front,
          coverage
        `)
        .eq('play_id', playId);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        timesCalled: data.length,
        successRate: data.filter(o => ['touchdown', 'first_down'].includes(o.result)).length / data.length,
        averageYards: data.reduce((sum, o) => sum + (o.yards_gained || 0), 0) / data.length,
        byDefense: data.reduce((acc, o) => {
          const key = `${o.defensive_front || 'unknown'}_${o.coverage || 'unknown'}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}