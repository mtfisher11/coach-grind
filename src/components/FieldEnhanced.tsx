import React, { useState, useRef, useEffect } from 'react';
import { NFLRulesEngine } from '../services/rules.service';
import { DrawingTool } from './DrawingTools';

export interface Player {
  id: string;
  x: number;
  y: number;
  onLOS?: boolean;
  eligible?: boolean;
  label?: string;
  number?: number;
}

export interface DrawingElement {
  id: string;
  type: 'line' | 'arrow' | 'curve' | 'zone' | 'text' | 'motion' | 'block';
  points: { x: number; y: number }[];
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  text?: string;
  player?: string; // For motion paths
}

interface Props {
  players: Player[];
  drawingElements: DrawingElement[];
  selectedTool: DrawingTool;
  currentColor: string;
  currentLineStyle: 'solid' | 'dashed' | 'dotted';
  onPlayerMove: (playerId: string, x: number, y: number) => void;
  onPlayerClick: (player: Player) => void;
  onDrawingComplete: (element: DrawingElement) => void;
  onElementSelect: (elementId: string) => void;
  onElementDelete: (elementId: string) => void;
  selectedPlayerId?: string;
  showRuleViolations?: boolean;
}

const FieldEnhanced: React.FC<Props> = ({
  players,
  drawingElements,
  selectedTool,
  currentColor,
  currentLineStyle,
  onPlayerMove,
  onPlayerClick,
  onDrawingComplete,
  onElementSelect,
  onElementDelete,
  selectedPlayerId,
  showRuleViolations = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [ruleViolations, setRuleViolations] = useState<string[]>([]);

  // Field dimensions
  const fieldWidth = 1200;
  const fieldHeight = 600;
  const lineOfScrimmage = 350;

  // Validate formation on player changes
  useEffect(() => {
    if (showRuleViolations) {
      const formation = {
        positions: players.reduce((acc, player) => ({
          ...acc,
          [player.id]: {
            x: player.x,
            y: player.y,
            onLOS: Math.abs(player.y - lineOfScrimmage) < 10,
            eligible: player.eligible || false
          }
        }), {})
      };
      
      const validation = NFLRulesEngine.validateFormation(formation);
      setRuleViolations(validation.violations);
    }
  }, [players, showRuleViolations]);

  // Get mouse position relative to SVG
  const getMousePosition = (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Handle mouse down on field
  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    
    if (selectedTool !== 'select') {
      setIsDrawing(true);
      setCurrentPoints([pos]);
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    
    if (draggedPlayer) {
      onPlayerMove(draggedPlayer, pos.x, pos.y);
    } else if (isDrawing && currentPoints.length > 0) {
      if (selectedTool === 'curve' && currentPoints.length < 3) {
        setCurrentPoints([currentPoints[0], pos]);
      } else if (['line', 'arrow', 'motion', 'block'].includes(selectedTool)) {
        setCurrentPoints([currentPoints[0], pos]);
      } else if (selectedTool === 'zone') {
        const start = currentPoints[0];
        setCurrentPoints([
          start,
          { x: pos.x, y: start.y },
          pos,
          { x: start.x, y: pos.y }
        ]);
      }
    }
  };

  // Handle mouse up
  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggedPlayer) {
      setDraggedPlayer(null);
    } else if (isDrawing && currentPoints.length > 1) {
      const element: DrawingElement = {
        id: `element-${Date.now()}`,
        type: selectedTool as any,
        points: [...currentPoints],
        color: currentColor,
        lineStyle: currentLineStyle
      };
      
      onDrawingComplete(element);
      setIsDrawing(false);
      setCurrentPoints([]);
    }
  };

  // Handle player drag start
  const handlePlayerMouseDown = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    if (selectedTool === 'select') {
      setDraggedPlayer(playerId);
    } else {
      onPlayerClick(players.find(p => p.id === playerId)!);
    }
  };

  // Render drawing element
  const renderDrawingElement = (element: DrawingElement) => {
    const { type, points, color, lineStyle } = element;
    
    const strokeDasharray = 
      lineStyle === 'dashed' ? '10,5' :
      lineStyle === 'dotted' ? '2,3' : 
      undefined;

    switch (type) {
      case 'line':
        return (
          <line
            x1={points[0].x}
            y1={points[0].y}
            x2={points[1].x}
            y2={points[1].y}
            stroke={color}
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
          />
        );
      
      case 'arrow':
        const angle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        return (
          <>
            <line
              x1={points[0].x}
              y1={points[0].y}
              x2={points[1].x}
              y2={points[1].y}
              stroke={color}
              strokeWidth="2"
              strokeDasharray={strokeDasharray}
            />
            <line
              x1={points[1].x}
              y1={points[1].y}
              x2={points[1].x - arrowLength * Math.cos(angle - arrowAngle)}
              y2={points[1].y - arrowLength * Math.sin(angle - arrowAngle)}
              stroke={color}
              strokeWidth="2"
            />
            <line
              x1={points[1].x}
              y1={points[1].y}
              x2={points[1].x - arrowLength * Math.cos(angle + arrowAngle)}
              y2={points[1].y - arrowLength * Math.sin(angle + arrowAngle)}
              stroke={color}
              strokeWidth="2"
            />
          </>
        );
      
      case 'zone':
        const path = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
        return (
          <path
            d={path}
            fill={color}
            fillOpacity="0.2"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
          />
        );
      
      case 'text':
        return (
          <text
            x={points[0].x}
            y={points[0].y}
            fill={color}
            fontSize="16"
            fontWeight="bold"
          >
            {element.text || 'Text'}
          </text>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        width={fieldWidth}
        height={fieldHeight}
        style={{
          background: '#0a5f38',
          cursor: 
            selectedTool === 'select' ? 'default' :
            selectedTool === 'text' ? 'text' :
            'crosshair'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setDraggedPlayer(null);
          setIsDrawing(false);
        }}
      >
        {/* Field Lines */}
        {/* End zones */}
        <rect x={0} y={0} width={100} height={fieldHeight} fill="#064f2f" />
        <rect x={1100} y={0} width={100} height={fieldHeight} fill="#064f2f" />
        
        {/* Yard lines every 50 pixels (5 yards) */}
        {Array.from({ length: 21 }, (_, i) => {
          const x = 100 + (i * 50);
          return (
            <g key={i}>
              <line
                x1={x}
                y1={0}
                x2={x}
                y2={fieldHeight}
                stroke="white"
                strokeWidth={i % 2 === 0 ? 2 : 1}
                opacity={i % 2 === 0 ? 1 : 0.5}
              />
              {i % 2 === 0 && i > 0 && i < 20 && (
                <text
                  x={x}
                  y={30}
                  fill="white"
                  fontSize="20"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {i <= 10 ? i * 5 : (20 - i) * 5}
                </text>
              )}
            </g>
          );
        })}

        {/* Hash marks */}
        {Array.from({ length: 41 }, (_, i) => {
          const x = 200 + (i * 10);
          return (
            <g key={i}>
              <line x1={x} y1={235} x2={x} y2={245} stroke="white" strokeWidth="1" />
              <line x1={x} y1={355} x2={x} y2={365} stroke="white" strokeWidth="1" />
            </g>
          );
        })}

        {/* Line of scrimmage */}
        <line
          x1={100}
          y1={lineOfScrimmage}
          x2={1100}
          y2={lineOfScrimmage}
          stroke="blue"
          strokeWidth="3"
          strokeDasharray="10,5"
          opacity="0.6"
        />

        {/* Drawing elements */}
        {drawingElements.map(element => (
          <g 
            key={element.id}
            onClick={() => selectedTool === 'select' && onElementSelect(element.id)}
            style={{ cursor: selectedTool === 'select' ? 'pointer' : 'default' }}
          >
            {renderDrawingElement(element)}
          </g>
        ))}

        {/* Current drawing preview */}
        {isDrawing && currentPoints.length > 1 && (
          <g opacity="0.6">
            {renderDrawingElement({
              id: 'preview',
              type: selectedTool as any,
              points: currentPoints,
              color: currentColor,
              lineStyle: currentLineStyle
            })}
          </g>
        )}

        {/* Players */}
        {players.map(player => {
          const isOnLOS = Math.abs(player.y - lineOfScrimmage) < 10;
          const isSelected = player.id === selectedPlayerId;
          const isDragging = player.id === draggedPlayer;
          
          return (
            <g key={player.id}>
              {/* Player circle */}
              <circle
                cx={player.x}
                cy={player.y}
                r="15"
                fill={
                  isOnLOS ? '#1e3a8a' : // Blue for LOS
                  player.eligible ? '#059669' : // Green for eligible
                  '#dc2626' // Red for ineligible
                }
                stroke={isSelected ? '#fbbf24' : 'white'}
                strokeWidth={isSelected ? 3 : 2}
                opacity={isDragging ? 0.7 : 1}
                style={{ cursor: selectedTool === 'select' ? 'grab' : 'pointer' }}
                onMouseDown={(e) => handlePlayerMouseDown(e, player.id)}
                onMouseEnter={() => setHoveredPlayer(player.id)}
                onMouseLeave={() => setHoveredPlayer(null)}
              />
              
              {/* Player label */}
              <text
                x={player.x}
                y={player.y + 5}
                fill="white"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                pointerEvents="none"
              >
                {player.label || player.id}
              </text>
              
              {/* Player number */}
              {player.number && (
                <text
                  x={player.x}
                  y={player.y - 25}
                  fill="white"
                  fontSize="10"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  #{player.number}
                </text>
              )}
            </g>
          );
        })}

        {/* Hover tooltip */}
        {hoveredPlayer && (
          <g>
            <rect
              x={players.find(p => p.id === hoveredPlayer)!.x - 40}
              y={players.find(p => p.id === hoveredPlayer)!.y - 45}
              width="80"
              height="20"
              fill="black"
              opacity="0.8"
              rx="4"
            />
            <text
              x={players.find(p => p.id === hoveredPlayer)!.x}
              y={players.find(p => p.id === hoveredPlayer)!.y - 32}
              fill="white"
              fontSize="11"
              textAnchor="middle"
            >
              {hoveredPlayer}
            </text>
          </g>
        )}
      </svg>

      {/* Rule violations */}
      {showRuleViolations && ruleViolations.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          maxWidth: '300px'
        }}>
          <strong>Formation Violations:</strong>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
            {ruleViolations.map((violation, i) => (
              <li key={i}>{violation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FieldEnhanced;