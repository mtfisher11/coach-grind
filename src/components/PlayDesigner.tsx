import React, { useState, useEffect } from 'react';
import FieldEnhanced, { Player, DrawingElement } from './FieldEnhanced';
import DrawingTools, { DrawingTool } from './DrawingTools';
import FormationSelector from './FormationSelector';
import { NFLRulesEngine } from '../services/rules.service';
import { PlayService, PlayData } from '../services/play.service';
import formationsData from '../data/formations.json';

interface Props {
  initialPlay?: PlayData;
  onSave?: (play: PlayData) => void;
}

const PlayDesigner: React.FC<Props> = ({ initialPlay, onSave }) => {
  // Play state
  const [playName, setPlayName] = useState(initialPlay?.name || 'New Play');
  const [formation, setFormation] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  
  // UI state
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('select');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentLineStyle, setCurrentLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showFormationSelector, setShowFormationSelector] = useState(true);
  const [showRuleViolations, setShowRuleViolations] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from existing play
  useEffect(() => {
    if (initialPlay) {
      setPlayName(initialPlay.name);
      
      // Convert player positions to Player array
      const playersArray = Object.entries(initialPlay.playerPositions).map(([id, pos]) => ({
        id,
        x: pos.x,
        y: pos.y,
        onLOS: pos.onLOS,
        eligible: pos.eligible,
        label: id
      }));
      setPlayers(playersArray);
      
      // Load drawing elements if any
      if (initialPlay.drawingElements) {
        setDrawingElements(initialPlay.drawingElements.map((el, idx) => ({
          ...el,
          id: `element-${idx}`
        })));
      }
    }
  }, [initialPlay]);

  // Handle formation selection
  const handleFormationSelect = (selectedFormation: any) => {
    setFormation(selectedFormation);
    
    // Convert formation positions to players
    const newPlayers = Object.entries(selectedFormation.positions).map(([id, pos]: [string, any]) => ({
      id,
      x: pos.x,
      y: pos.y,
      onLOS: pos.onLOS,
      eligible: pos.eligible,
      label: id,
      number: getPlayerNumber(id)
    }));
    
    setPlayers(newPlayers);
    setShowFormationSelector(false);
  };

  // Get suggested player number based on position
  const getPlayerNumber = (positionId: string): number | undefined => {
    const numberRanges: Record<string, [number, number]> = {
      'QB': [1, 19],
      'RB': [20, 49],
      'FB': [20, 49],
      'HB': [20, 49],
      'WR': [10, 19],
      'X': [80, 89],
      'Y': [80, 89],
      'Z': [10, 19],
      'S': [10, 19],
      'F': [80, 89],
      'W': [10, 19],
      'TE': [80, 89],
      'C': [50, 79],
      'LG': [50, 79],
      'RG': [50, 79],
      'LT': [50, 79],
      'RT': [50, 79]
    };
    
    for (const [prefix, [min, max]] of Object.entries(numberRanges)) {
      if (positionId.includes(prefix)) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }
    
    return undefined;
  };

  // Handle player movement
  const handlePlayerMove = (playerId: string, x: number, y: number) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, x, y, onLOS: Math.abs(y - 350) < 10 }
        : p
    ));
  };

  // Handle player click
  const handlePlayerClick = (player: Player) => {
    setSelectedPlayerId(player.id);
  };

  // Handle drawing complete
  const handleDrawingComplete = (element: DrawingElement) => {
    setDrawingElements(prev => [...prev, element]);
  };

  // Handle element selection
  const handleElementSelect = (elementId: string) => {
    // Could open a properties panel here
    console.log('Selected element:', elementId);
  };

  // Handle element deletion
  const handleElementDelete = (elementId: string) => {
    setDrawingElements(prev => prev.filter(el => el.id !== elementId));
  };

  // Save play
  const handleSave = async () => {
    if (!formation) {
      alert('Please select a formation first');
      return;
    }

    setIsSaving(true);
    
    try {
      // Convert players array back to positions object
      const playerPositions = players.reduce((acc, player) => ({
        ...acc,
        [player.id]: {
          x: player.x,
          y: player.y,
          onLOS: player.onLOS || false,
          eligible: player.eligible || false
        }
      }), {});

      const playData: PlayData = {
        name: playName,
        formationId: formation.id,
        personnel: formation.personnel,
        playerPositions,
        routes: [], // Would be populated from route assignments
        drawingElements: drawingElements.map(el => ({
          type: el.type,
          points: el.points,
          color: el.color,
          lineStyle: el.lineStyle,
          text: el.text
        })),
        tags: formation.tags || [],
        coachingPoints: []
      };

      const { data, error } = await PlayService.savePlay(playData);
      
      if (error) {
        console.error('Error saving play:', error);
        alert('Failed to save play');
      } else {
        console.log('Play saved:', data);
        if (onSave) onSave(playData);
        alert('Play saved successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save play');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        background: 'var(--panel)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <input
            type="text"
            value={playName}
            onChange={(e) => setPlayName(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'var(--panel-2)',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: 'bold'
            }}
          />
          
          {formation && (
            <div style={{ opacity: 0.7, fontSize: '0.875rem' }}>
              {formation.name} • {formationsData.personnel_groups[formation.personnel]?.name || formation.personnel}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowFormationSelector(!showFormationSelector)}
            className="button secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Change Formation
          </button>
          
          <button
            onClick={() => setShowRuleViolations(!showRuleViolations)}
            className="button secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            {showRuleViolations ? 'Hide' : 'Show'} Rules
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="button"
            style={{ padding: '0.5rem 1.5rem' }}
          >
            {isSaving ? 'Saving...' : 'Save Play'}
          </button>
        </div>
      </div>

      {/* Drawing Tools */}
      <DrawingTools
        selectedTool={selectedTool}
        onToolSelect={setSelectedTool}
        onColorChange={setCurrentColor}
        onLineStyleChange={setCurrentLineStyle}
        currentColor={currentColor}
        currentLineStyle={currentLineStyle}
      />

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: showFormationSelector ? '1fr 350px' : '1fr', gap: '1rem' }}>
        {/* Field */}
        <div style={{
          background: 'var(--panel)',
          borderRadius: '16px',
          padding: '1rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <FieldEnhanced
            players={players}
            drawingElements={drawingElements}
            selectedTool={selectedTool}
            currentColor={currentColor}
            currentLineStyle={currentLineStyle}
            onPlayerMove={handlePlayerMove}
            onPlayerClick={handlePlayerClick}
            onDrawingComplete={handleDrawingComplete}
            onElementSelect={handleElementSelect}
            onElementDelete={handleElementDelete}
            selectedPlayerId={selectedPlayerId}
            showRuleViolations={showRuleViolations}
          />
        </div>

        {/* Formation Selector */}
        {showFormationSelector && (
          <FormationSelector
            onFormationSelect={handleFormationSelect}
            currentFormationId={formation?.id}
          />
        )}
      </div>

      {/* Player Details Panel */}
      {selectedPlayerId && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'var(--panel)',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          minWidth: '250px'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Player: {selectedPlayerId}</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', opacity: 0.7 }}>
              Position:
              <select
                value={players.find(p => p.id === selectedPlayerId)?.onLOS ? 'los' : 'backfield'}
                onChange={(e) => {
                  const onLOS = e.target.value === 'los';
                  setPlayers(prev => prev.map(p => 
                    p.id === selectedPlayerId 
                      ? { ...p, onLOS, y: onLOS ? 350 : 380 }
                      : p
                  ));
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.25rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'var(--panel-2)',
                  color: 'white'
                }}
              >
                <option value="los">Line of Scrimmage</option>
                <option value="backfield">Backfield</option>
              </select>
            </label>
            
            <label style={{ fontSize: '0.875rem', opacity: 0.7 }}>
              Eligible Receiver:
              <input
                type="checkbox"
                checked={players.find(p => p.id === selectedPlayerId)?.eligible || false}
                onChange={(e) => {
                  setPlayers(prev => prev.map(p => 
                    p.id === selectedPlayerId 
                      ? { ...p, eligible: e.target.checked }
                      : p
                  ));
                }}
                style={{ marginLeft: '0.5rem' }}
              />
            </label>
          </div>
          
          <button
            onClick={() => setSelectedPlayerId(null)}
            className="button secondary"
            style={{ marginTop: '1rem', width: '100%' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayDesigner;