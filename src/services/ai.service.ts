import { supabase } from '../lib/supabase';
import type { Play, Formation, RouteAction } from '../lib/supabase';

interface PlayGenerationRequest {
  description: string; // "Trips Right Mesh Half-Slide Right, Z fast"
  situation?: {
    down: number;
    distance: number;
    fieldPosition: string;
    timeRemaining?: number;
  };
}

interface PlayAnalysis {
  whenToCall: string[];
  bestAgainst: string[];
  strengths: string[];
  weaknesses: string[];
  coachingPoints: string[];
  qbReads: string[];
}

export class AIService {
  // This will be replaced with actual AI API calls
  static async generatePlay(request: PlayGenerationRequest): Promise<{
    formation: string;
    concept: string;
    protection: string;
    actions: RouteAction[];
    analysis: PlayAnalysis;
  }> {
    // Parse the play description
    const playParts = this.parsePlayDescription(request.description);
    
    // Generate route actions based on concept
    const actions = await this.generateRouteActions(
      playParts.formation,
      playParts.concept,
      playParts.motions
    );
    
    // Generate coaching analysis
    const analysis = await this.analyzePlay(
      playParts.concept,
      request.situation
    );
    
    return {
      formation: playParts.formation,
      concept: playParts.concept,
      protection: playParts.protection,
      actions,
      analysis
    };
  }

  private static parsePlayDescription(description: string): {
    formation: string;
    concept: string;
    protection: string;
    motions: string[];
  } {
    const lower = description.toLowerCase();
    
    // Extract formation
    let formation = 'trips_right';
    if (lower.includes('trips left')) formation = 'trips_left';
    else if (lower.includes('bunch')) formation = 'bunch_right';
    else if (lower.includes('empty')) formation = 'empty_3x2';
    else if (lower.includes('i-form')) formation = 'i_form';
    
    // Extract concept
    let concept = 'mesh';
    if (lower.includes('smash')) concept = 'smash';
    else if (lower.includes('flood')) concept = 'flood';
    else if (lower.includes('stick')) concept = 'stick';
    else if (lower.includes('verts') || lower.includes('verticals')) concept = 'verts';
    
    // Extract protection
    let protection = 'half_slide_r';
    if (lower.includes('half slide left') || lower.includes('half-slide left')) {
      protection = 'half_slide_l';
    } else if (lower.includes('bob') || lower.includes('big on big')) {
      protection = 'bob';
    } else if (lower.includes('scat')) {
      protection = 'scat';
    }
    
    // Extract motions
    const motions: string[] = [];
    if (lower.includes('z fast')) motions.push('z_fast_motion');
    if (lower.includes('orbit')) motions.push('orbit_motion');
    if (lower.includes('shift')) motions.push('shift');
    
    return { formation, concept, protection, motions };
  }

  private static async generateRouteActions(
    formation: string,
    concept: string,
    motions: string[]
  ): Promise<RouteAction[]> {
    const actions: RouteAction[] = [];
    
    // Add motion actions
    motions.forEach(motion => {
      if (motion === 'z_fast_motion') {
        actions.push({
          player_id: 'Z',
          action_type: 'motion',
          action_value: 'fast_motion',
          path: 'M850 350 L 600 350' // Motion across formation
        });
      }
    });
    
    // Generate routes based on concept
    switch (concept) {
      case 'mesh':
        actions.push(
          { player_id: 'X', action_type: 'route', action_value: 'mesh', path: 'M200 350 L 400 330' },
          { player_id: 'Z', action_type: 'route', action_value: 'shallow', path: 'M850 350 L 650 330' },
          { player_id: 'Y', action_type: 'route', action_value: 'corner', path: 'M690 350 L 750 230' },
          { player_id: 'F', action_type: 'route', action_value: 'sit', path: 'M750 350 L 750 280' },
          { player_id: 'RB', action_type: 'route', action_value: 'swing', path: 'M600 420 L 400 440' }
        );
        break;
        
      case 'smash':
        actions.push(
          { player_id: 'Z', action_type: 'route', action_value: 'corner', path: 'M850 350 L 900 230' },
          { player_id: 'F', action_type: 'route', action_value: 'hitch', path: 'M750 350 L 750 290' },
          { player_id: 'Y', action_type: 'route', action_value: 'arrow', path: 'M690 350 L 590 370' },
          { player_id: 'X', action_type: 'route', action_value: 'deep', path: 'M200 350 L 300 250' }
        );
        break;
        
      // Add more concepts...
    }
    
    // Add blocking assignments
    actions.push(
      { player_id: 'LT', action_type: 'block', action_value: 'pass_set', target: 'edge' },
      { player_id: 'LG', action_type: 'block', action_value: 'pass_set', target: '3_tech' },
      { player_id: 'C', action_type: 'block', action_value: 'slide_right', target: '0_tech' },
      { player_id: 'RG', action_type: 'block', action_value: 'slide_right', target: '3_tech' },
      { player_id: 'RT', action_type: 'block', action_value: 'slide_right', target: 'edge' }
    );
    
    return actions;
  }

  private static async analyzePlay(
    concept: string,
    situation?: any
  ): Promise<PlayAnalysis> {
    // This will eventually call GPT-4/Claude API
    // For now, return concept-specific analysis
    
    const analysisMap: Record<string, PlayAnalysis> = {
      mesh: {
        whenToCall: ['3rd & 4-8', '2-minute drill', 'vs heavy blitz'],
        bestAgainst: ['Cover 1 (man)', 'Cover 2', 'Blitz packages'],
        strengths: [
          'Creates natural picks vs man coverage',
          'Quick hitting routes available',
          'Multiple horizontal stretches',
          'RB outlet always available'
        ],
        weaknesses: [
          'Requires good pass protection',
          'Can get congested vs zone',
          'Timing critical for mesh point'
        ],
        coachingPoints: [
          'Mesh at 6 yards depth',
          'Z shallow must clear LBs',
          'QB eyes must come off Mike quickly',
          'RB check protection before release'
        ],
        qbReads: [
          '1. Pre-snap: Identify Mike LB',
          '2. Z shallow in first window',
          '3. X on mesh crossing',
          '4. Y corner vs safety',
          '5. RB on swing as outlet'
        ]
      },
      smash: {
        whenToCall: ['Red zone', '1st & 10', 'vs Cover 2'],
        bestAgainst: ['Cover 2', 'Quarters', 'Red zone defense'],
        strengths: [
          'Hi-low stretch on corner',
          'Simple read for QB',
          'Red zone staple'
        ],
        weaknesses: [
          'Limited vs Cover 3',
          'Predictable in red zone',
          'Requires outside leverage'
        ],
        coachingPoints: [
          'Corner route at 12-15 yards',
          'Hitch settle at 6 yards',
          'QB read flat defender'
        ],
        qbReads: [
          '1. Pre-snap: Identify flat defender',
          '2. Peek post-snap rotation',
          '3. Flat defender - throw opposite',
          '4. Alert backside 1-on-1'
        ]
      }
    };
    
    return analysisMap[concept] || {
      whenToCall: ['Standard down & distance'],
      bestAgainst: ['Various coverages'],
      strengths: ['Versatile concept'],
      weaknesses: ['Requires execution'],
      coachingPoints: ['Execute assignments'],
      qbReads: ['Progress through reads']
    };
  }

  // Generate AI training data from plays
  static async generateTrainingData(play: Play): Promise<{
    input: string;
    output: any;
  }> {
    // Format play data for AI training
    const input = `Formation: ${play.name}, Situation: Down ${play.down}, Distance ${play.distance}`;
    
    const output = {
      actions: play.actions,
      analysis: {
        whenToCall: play.when_to_call,
        bestAgainst: play.best_against,
        strengths: play.strengths,
        weaknesses: play.weaknesses,
        coachingPoints: play.coaching_points
      }
    };
    
    return { input, output };
  }

  // Suggest plays based on game situation and opponent tendencies
  static async suggestPlays(params: {
    situation: {
      down: number;
      distance: number;
      fieldPosition: string;
      timeRemaining?: number;
      score_differential?: number;
    };
    opponentTendencies?: {
      coverage: Record<string, number>;
      blitzRate: number;
    };
  }): Promise<Play[]> {
    // Build context for AI
    const context = this.buildGameContext(params);
    
    // Get plays from database that match situation
    const { data: plays } = await supabase
      .from('plays')
      .select('*')
      .contains('tags', this.situationToTags(params.situation))
      .order('success_rate', { ascending: false })
      .limit(20);
    
    // Score and rank plays based on opponent tendencies
    const scoredPlays = this.scorePlaysByTendencies(
      plays || [],
      params.opponentTendencies
    );
    
    return scoredPlays.slice(0, 5);
  }

  private static buildGameContext(params: any): string {
    const { situation, opponentTendencies } = params;
    let context = `Down: ${situation.down}, Distance: ${situation.distance}, Field Position: ${situation.fieldPosition}`;
    
    if (situation.timeRemaining) {
      context += `, Time: ${situation.timeRemaining}s`;
    }
    
    if (opponentTendencies) {
      const topCoverage = Object.entries(opponentTendencies.coverage)
        .sort(([,a], [,b]) => b - a)[0];
      context += `, Opponent prefers ${topCoverage[0]} (${topCoverage[1]}%)`;
    }
    
    return context;
  }

  private static situationToTags(situation: any): string[] {
    const tags: string[] = [];
    
    if (situation.down === 1) tags.push('1st_down');
    else if (situation.down === 2) {
      if (situation.distance <= 3) tags.push('2nd_short');
      else if (situation.distance >= 8) tags.push('2nd_long');
    } else if (situation.down === 3) {
      if (situation.distance <= 3) tags.push('3rd_short');
      else if (situation.distance >= 7) tags.push('3rd_long');
    }
    
    if (situation.fieldPosition?.includes('opp_19')) {
      tags.push('red_zone');
    }
    
    if (situation.timeRemaining && situation.timeRemaining < 120) {
      tags.push('two_minute');
    }
    
    return tags;
  }

  private static scorePlaysByTendencies(
    plays: any[],
    tendencies?: any
  ): any[] {
    if (!tendencies) return plays;
    
    return plays.map(play => {
      let score = play.success_rate || 0.5;
      
      // Boost plays that attack the opponent's most common coverage
      if (play.best_against) {
        Object.entries(tendencies.coverage).forEach(([coverage, rate]) => {
          if (play.best_against.includes(coverage)) {
            score += (rate as number) * 0.1;
          }
        });
      }
      
      // Adjust for blitz rate
      if (tendencies.blitzRate > 0.4 && play.tags?.includes('quick_game')) {
        score += 0.2;
      }
      
      return { ...play, aiScore: score };
    }).sort((a, b) => b.aiScore - a.aiScore);
  }
}