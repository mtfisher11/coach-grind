interface Position {
  x: number;
  y: number;
  onLOS: boolean;
  eligible: boolean;
}

interface Formation {
  positions: Record<string, Position>;
}

export class NFLRulesEngine {
  private static readonly LOS_Y = 350; // Line of scrimmage Y coordinate
  private static readonly LOS_TOLERANCE = 5; // Pixels tolerance for being "on the line"

  /**
   * Validates that a formation follows NFL rules
   */
  static validateFormation(formation: Formation): {
    valid: boolean;
    violations: string[];
    warnings: string[];
  } {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Get all players
    const players = Object.entries(formation.positions);
    
    // Check total player count
    if (players.length !== 11) {
      violations.push(`Must have exactly 11 players, found ${players.length}`);
    }

    // Count players on LOS
    const playersOnLOS = players.filter(([_, pos]) => pos.onLOS);
    if (playersOnLOS.length < 7) {
      violations.push(`Must have at least 7 players on the line of scrimmage, found ${playersOnLOS.length}`);
    }

    // Check backfield count (max 4)
    const backfieldPlayers = players.filter(([_, pos]) => !pos.onLOS);
    if (backfieldPlayers.length > 4) {
      violations.push(`Cannot have more than 4 players in the backfield, found ${backfieldPlayers.length}`);
    }

    // Validate eligible receivers on the line
    const eligibleOnLine = this.getEligibleReceiversOnLine(formation);
    if (eligibleOnLine.violations.length > 0) {
      violations.push(...eligibleOnLine.violations);
    }

    // Check for covered receivers
    const coveredReceivers = this.checkCoveredReceivers(formation);
    if (coveredReceivers.length > 0) {
      violations.push(...coveredReceivers);
    }

    // Check formation balance (unbalanced line warnings)
    const balance = this.checkFormationBalance(formation);
    if (balance.warnings.length > 0) {
      warnings.push(...balance.warnings);
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Check that only the ends of the line are eligible
   */
  private static getEligibleReceiversOnLine(formation: Formation): {
    violations: string[];
  } {
    const violations: string[] = [];
    
    // Get all players on the LOS, sorted by X position
    const linePlayersArray = Object.entries(formation.positions)
      .filter(([_, pos]) => pos.onLOS)
      .sort((a, b) => a[1].x - b[1].x);

    // Check each player on the line
    linePlayersArray.forEach(([playerId, pos], index) => {
      const isEnd = index === 0 || index === linePlayersArray.length - 1;
      
      if (pos.eligible && !isEnd) {
        violations.push(`${playerId} is an eligible receiver but not on the end of the line (covered)`);
      }
      
      // Interior linemen should be ineligible
      if (!pos.eligible && isEnd && this.isLineman(playerId)) {
        violations.push(`${playerId} is on the end of the line and must be eligible or report as eligible`);
      }
    });

    return { violations };
  }

  /**
   * Check for covered receivers (receivers who are not on the end of their side)
   */
  private static checkCoveredReceivers(formation: Formation): string[] {
    const violations: string[] = [];
    const centerX = 600; // Center position

    // Check left side
    const leftSidePlayers = Object.entries(formation.positions)
      .filter(([_, pos]) => pos.x < centerX && pos.onLOS)
      .sort((a, b) => a[1].x - b[1].x);

    // Check right side  
    const rightSidePlayers = Object.entries(formation.positions)
      .filter(([_, pos]) => pos.x > centerX && pos.onLOS)
      .sort((a, b) => b[1].x - a[1].x);

    // The outermost player on each side must be eligible
    if (leftSidePlayers.length > 0) {
      const [leftEndId, leftEndPos] = leftSidePlayers[0];
      if (!leftEndPos.eligible && this.isReceiver(leftEndId)) {
        violations.push(`${leftEndId} is covered and ineligible`);
      }
    }

    if (rightSidePlayers.length > 0) {
      const [rightEndId, rightEndPos] = rightSidePlayers[0];
      if (!rightEndPos.eligible && this.isReceiver(rightEndId)) {
        violations.push(`${rightEndId} is covered and ineligible`);
      }
    }

    return violations;
  }

  /**
   * Check formation balance and provide warnings
   */
  private static checkFormationBalance(formation: Formation): {
    warnings: string[];
  } {
    const warnings: string[] = [];
    const centerX = 600;

    const leftLinemen = Object.entries(formation.positions)
      .filter(([id, pos]) => pos.onLOS && pos.x < centerX && this.isLineman(id));
    
    const rightLinemen = Object.entries(formation.positions)
      .filter(([id, pos]) => pos.onLOS && pos.x > centerX && this.isLineman(id));

    if (Math.abs(leftLinemen.length - rightLinemen.length) > 1) {
      warnings.push(`Unbalanced line: ${leftLinemen.length} linemen left, ${rightLinemen.length} right`);
    }

    return { warnings };
  }

  /**
   * Auto-adjust formation to fix common violations
   */
  static autoFixFormation(formation: Formation): Formation {
    const fixed = JSON.parse(JSON.stringify(formation)) as Formation;
    
    // Ensure we have exactly 7 on the LOS
    const currentOnLOS = Object.entries(fixed.positions)
      .filter(([_, pos]) => pos.onLOS);
    
    if (currentOnLOS.length < 7) {
      // Move some players to the LOS
      const backfieldPlayers = Object.entries(fixed.positions)
        .filter(([_, pos]) => !pos.onLOS)
        .sort((a, b) => Math.abs(a[1].y - this.LOS_Y) - Math.abs(b[1].y - this.LOS_Y));
      
      const needed = 7 - currentOnLOS.length;
      for (let i = 0; i < needed && i < backfieldPlayers.length; i++) {
        const [playerId] = backfieldPlayers[i];
        fixed.positions[playerId].y = this.LOS_Y;
        fixed.positions[playerId].onLOS = true;
      }
    }

    // Fix eligible receivers
    const linePlayersArray = Object.entries(fixed.positions)
      .filter(([_, pos]) => pos.onLOS)
      .sort((a, b) => a[1].x - b[1].x);

    linePlayersArray.forEach(([playerId, pos], index) => {
      const isEnd = index === 0 || index === linePlayersArray.length - 1;
      
      if (this.isReceiver(playerId)) {
        // Receivers should only be eligible if on the end
        fixed.positions[playerId].eligible = isEnd;
      }
    });

    return fixed;
  }

  /**
   * Helper to determine if a player is a lineman
   */
  private static isLineman(playerId: string): boolean {
    return ['C', 'LG', 'RG', 'LT', 'RT', 'OL'].some(pos => playerId.includes(pos));
  }

  /**
   * Helper to determine if a player is a receiver
   */
  private static isReceiver(playerId: string): boolean {
    return ['WR', 'X', 'Y', 'Z', 'S', 'F', 'W'].some(pos => playerId.includes(pos));
  }

  /**
   * Check if a player can motion
   */
  static canPlayerMotion(playerId: string, formation: Formation): boolean {
    const player = formation.positions[playerId];
    if (!player) return false;

    // Only eligible receivers in the backfield can motion
    return !player.onLOS && player.eligible;
  }

  /**
   * Get valid motion paths for a player
   */
  static getValidMotionPaths(playerId: string, formation: Formation): {
    horizontal: boolean;
    vertical: boolean;
    mustSetBeforeSnap: boolean;
  } {
    const player = formation.positions[playerId];
    if (!player || !this.canPlayerMotion(playerId, formation)) {
      return { horizontal: false, vertical: false, mustSetBeforeSnap: false };
    }

    return {
      horizontal: true, // Can motion horizontally
      vertical: false, // Cannot motion toward LOS at snap
      mustSetBeforeSnap: true // Must be set for 1 second before snap
    };
  }
}