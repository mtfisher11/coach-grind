import React, { useState } from 'react';

export interface BlockingAssignment {
  player_id: string;
  assignment_type: 'block' | 'combo' | 'pull' | 'release';
  target: string;
  technique?: string;
  notes?: string;
}

interface BlockingAssignmentsProps {
  players: Array<{ id: string; x: number; y: number }>;
  onAssignmentsChange: (assignments: BlockingAssignment[]) => void;
  initialAssignments?: BlockingAssignment[];
}

const OFFENSIVE_LINE = ['LT', 'LG', 'C', 'RG', 'RT', 'Y'];

const BLOCKING_SCHEMES = {
  'Zone': {
    assignments: [
      { player: 'LT', type: 'combo', target: '3-Tech to Mike' },
      { player: 'LG', type: 'combo', target: '1-Tech to Mike' },
      { player: 'C', type: 'block', target: 'Backside A-Gap' },
      { player: 'RG', type: 'combo', target: '1-Tech to Will' },
      { player: 'RT', type: 'block', target: 'EMLOS' },
      { player: 'Y', type: 'block', target: 'SAM' }
    ]
  },
  'Power': {
    assignments: [
      { player: 'LT', type: 'block', target: 'Big on Big' },
      { player: 'LG', type: 'pull', target: 'Kick EMLOS' },
      { player: 'C', type: 'block', target: 'Back to Mike' },
      { player: 'RG', type: 'block', target: '3-Tech' },
      { player: 'RT', type: 'block', target: '5-Tech' },
      { player: 'Y', type: 'block', target: 'Down to LB' }
    ]
  },
  'Counter': {
    assignments: [
      { player: 'LT', type: 'block', target: 'Big on Big' },
      { player: 'LG', type: 'block', target: 'Back to Mike' },
      { player: 'C', type: 'block', target: 'Back to Will' },
      { player: 'RG', type: 'pull', target: 'Kick EMLOS' },
      { player: 'RT', type: 'pull', target: 'Lead through hole' },
      { player: 'Y', type: 'block', target: 'Down Block' }
    ]
  },
  'Half Slide Right': {
    assignments: [
      { player: 'LT', type: 'block', target: 'Big on Big' },
      { player: 'LG', type: 'block', target: 'Big on Big' },
      { player: 'C', type: 'block', target: 'Slide Right' },
      { player: 'RG', type: 'block', target: 'Slide Right' },
      { player: 'RT', type: 'block', target: 'Slide Right' },
      { player: 'Y', type: 'release', target: 'Route' }
    ]
  },
  'Max Pro': {
    assignments: [
      { player: 'LT', type: 'block', target: 'Edge' },
      { player: 'LG', type: 'block', target: 'B-Gap' },
      { player: 'C', type: 'block', target: 'Mike' },
      { player: 'RG', type: 'block', target: 'B-Gap' },
      { player: 'RT', type: 'block', target: 'Edge' },
      { player: 'Y', type: 'block', target: 'Edge Help' }
    ]
  }
};

const ASSIGNMENT_TYPES = [
  { value: 'block', label: 'Block', color: '#3B82F6' },
  { value: 'combo', label: 'Combo', color: '#10B981' },
  { value: 'pull', label: 'Pull', color: '#F59E0B' },
  { value: 'release', label: 'Release', color: '#8B5CF6' }
];

const TARGETS = [
  'Mike (MLB)',
  'Will (WLB)', 
  'Sam (SLB)',
  '0-Tech (Nose)',
  '1-Tech',
  '3-Tech',
  '5-Tech',
  '7-Tech',
  '9-Tech',
  'EMLOS',
  'Edge',
  'A-Gap',
  'B-Gap',
  'C-Gap',
  'D-Gap',
  'Backside A-Gap',
  'Playside Gap',
  'Big on Big',
  'Back to Backer',
  'Slide Left',
  'Slide Right',
  'Route'
];

const BlockingAssignments: React.FC<BlockingAssignmentsProps> = ({
  players,
  onAssignmentsChange,
  initialAssignments = []
}) => {
  const [assignments, setAssignments] = useState<BlockingAssignment[]>(initialAssignments);
  const [selectedScheme, setSelectedScheme] = useState<string>('');
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  const applyScheme = (schemeName: string) => {
    const scheme = BLOCKING_SCHEMES[schemeName];
    if (!scheme) return;

    const newAssignments: BlockingAssignment[] = scheme.assignments.map(a => ({
      player_id: a.player,
      assignment_type: a.type as any,
      target: a.target
    }));

    setAssignments(newAssignments);
    onAssignmentsChange(newAssignments);
    setSelectedScheme(schemeName);
  };

  const updateAssignment = (playerId: string, field: string, value: any) => {
    const updated = assignments.map(a => 
      a.player_id === playerId ? { ...a, [field]: value } : a
    );
    
    // Add new assignment if doesn't exist
    if (!updated.find(a => a.player_id === playerId)) {
      updated.push({
        player_id: playerId,
        assignment_type: 'block',
        target: '',
        [field]: value
      });
    }

    setAssignments(updated);
    onAssignmentsChange(updated);
  };

  const getAssignment = (playerId: string) => {
    return assignments.find(a => a.player_id === playerId) || {
      player_id: playerId,
      assignment_type: 'block',
      target: ''
    };
  };

  const relevantPlayers = players.filter(p => OFFENSIVE_LINE.includes(p.id));

  return (
    <div style={{
      background: 'var(--panel)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '1rem'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Blocking Assignments</h3>

      {/* Quick Scheme Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="kicker" style={{ marginBottom: '0.5rem' }}>QUICK SCHEMES</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.keys(BLOCKING_SCHEMES).map(scheme => (
            <button
              key={scheme}
              onClick={() => applyScheme(scheme)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${selectedScheme === scheme ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                background: selectedScheme === scheme ? 'var(--primary)' : 'transparent',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {scheme}
            </button>
          ))}
        </div>
      </div>

      {/* Individual Assignments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {relevantPlayers.map(player => {
          const assignment = getAssignment(player.id);
          const isEditing = editingPlayer === player.id;

          return (
            <div
              key={player.id}
              style={{
                background: 'var(--panel-2)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '0.5rem',
                fontSize: '1.125rem'
              }}>
                {player.id}
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <select
                    value={assignment.assignment_type}
                    onChange={(e) => updateAssignment(player.id, 'assignment_type', e.target.value)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'var(--panel)',
                      color: 'white'
                    }}
                  >
                    {ASSIGNMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={assignment.target}
                    onChange={(e) => updateAssignment(player.id, 'target', e.target.value)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'var(--panel)',
                      color: 'white'
                    }}
                  >
                    <option value="">Select target...</option>
                    {TARGETS.map(target => (
                      <option key={target} value={target}>
                        {target}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setEditingPlayer(null)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid var(--primary)',
                      background: 'var(--primary)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setEditingPlayer(player.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: ASSIGNMENT_TYPES.find(t => t.value === assignment.assignment_type)?.color || '#3B82F6',
                    color: 'white',
                    fontSize: '0.75rem',
                    marginBottom: '0.25rem'
                  }}>
                    {ASSIGNMENT_TYPES.find(t => t.value === assignment.assignment_type)?.label || 'Block'}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem',
                    opacity: assignment.target ? 1 : 0.5
                  }}>
                    {assignment.target || 'Click to assign'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visual Key */}
      <div style={{ 
        marginTop: '1.5rem', 
        paddingTop: '1rem', 
        borderTop: '1px solid rgba(255,255,255,0.1)' 
      }}>
        <div className="kicker" style={{ marginBottom: '0.5rem' }}>ASSIGNMENT TYPES</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {ASSIGNMENT_TYPES.map(type => (
            <div key={type.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: type.color
              }} />
              <span style={{ fontSize: '0.875rem' }}>{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlockingAssignments;