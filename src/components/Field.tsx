import React, { useState } from "react";

export type Player = { 
  id: string; 
  x: number; 
  y: number; 
  label?: string;
  action?: string; // block type or route
};

export type Route = { 
  from: string; 
  path: string; 
  label?: string; 
  dash?: boolean;
};

export type Play = {
  name: string;
  players: Player[];
  routes: Route[];
};

type Props = {
  play: Play;
  height?: number;
  onPlayerClick?: (player: Player) => void;
  selectedPlayerId?: string;
};

const Field: React.FC<Props> = ({ play, height = 600, onPlayerClick, selectedPlayerId }) => {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

  return (
    <svg
      viewBox="0 0 1200 600"
      width="100%"
      style={{
        height,
        borderRadius: 8,
        display: "block",
        border: "2px solid #1a1a1a",
        cursor: "default"
      }}
    >
      <defs>
        <filter id="playerGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
        </filter>

        <filter id="selectedGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3b82f6" floodOpacity="0.8" />
        </filter>

        <filter id="hoverGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.6" />
        </filter>
        
        <marker
          id="arrowWhite"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffffff" />
        </marker>

        <marker
          id="arrowYellow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffeb3b" />
        </marker>
      </defs>

      {/* Field background - solid green like the image */}
      <rect x="0" y="0" width="1200" height="600" fill="#4a9d4a" />

      {/* White border/sidelines */}
      <rect x="100" y="50" width="1000" height="500" fill="none" stroke="#ffffff" strokeWidth="6" />
      
      {/* Goal lines (thick) */}
      <line x1="100" y1="100" x2="1100" y2="100" stroke="#ffffff" strokeWidth="6" />
      <line x1="100" y1="500" x2="1100" y2="500" stroke="#ffffff" strokeWidth="6" />

      {/* 5-yard lines */}
      <g stroke="#ffffff" strokeWidth="4">
        {[150, 250, 350, 450].map((y) => (
          <line key={y} x1="100" x2="1100" y1={y} y2={y} />
        ))}
      </g>

      {/* 10-yard lines (thicker) */}
      <g stroke="#ffffff" strokeWidth="6">
        <line x1="100" x2="1100" y1="200" y2="200" />
        <line x1="100" x2="1100" y1="300" y2="300" />
        <line x1="100" x2="1100" y1="400" y2="400" />
      </g>

      {/* Yard numbers - exactly like the image */}
      <g fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold">
        {/* 10 yard line */}
        <text x="200" y="195" textAnchor="middle">1</text>
        <text x="240" y="195" textAnchor="middle">0</text>
        <text x="960" y="195" textAnchor="middle">1</text>
        <text x="1000" y="195" textAnchor="middle">0</text>
        
        {/* 20 yard line */}
        <text x="200" y="295" textAnchor="middle">2</text>
        <text x="240" y="295" textAnchor="middle">0</text>
        <text x="960" y="295" textAnchor="middle">2</text>
        <text x="1000" y="295" textAnchor="middle">0</text>
        
        {/* 30 yard line */}
        <text x="200" y="395" textAnchor="middle">3</text>
        <text x="240" y="395" textAnchor="middle">0</text>
        <text x="960" y="395" textAnchor="middle">3</text>
        <text x="1000" y="395" textAnchor="middle">0</text>
        
        {/* 40 yard line */}
        <text x="200" y="495" textAnchor="middle">4</text>
        <text x="240" y="495" textAnchor="middle">0</text>
        <text x="960" y="495" textAnchor="middle">4</text>
        <text x="1000" y="495" textAnchor="middle">0</text>
      </g>

      {/* Hash marks - every yard (10 yards = 100 pixels, so 1 yard = 10 pixels) */}
      <g stroke="#ffffff" strokeWidth="3">
        {/* Left hash marks */}
        {Array.from({ length: 41 }).map((_, i) => {
          const y = 100 + i * 10;
          if (y <= 500) {
            return (
              <line key={`left-${i}`} x1="470" x2="485" y1={y} y2={y} />
            );
          }
          return null;
        })}
        
        {/* Right hash marks */}
        {Array.from({ length: 41 }).map((_, i) => {
          const y = 100 + i * 10;
          if (y <= 500) {
            return (
              <line key={`right-${i}`} x1="715" x2="730" y1={y} y2={y} />
            );
          }
          return null;
        })}
      </g>

      {/* Sideline marks - every yard */}
      <g stroke="#ffffff" strokeWidth="2">
        {Array.from({ length: 41 }).map((_, i) => {
          const y = 100 + i * 10;
          if (y <= 500) {
            return (
              <g key={`side-${i}`}>
                <line x1="100" x2="110" y1={y} y2={y} />
                <line x1="1090" x2="1100" y1={y} y2={y} />
              </g>
            );
          }
          return null;
        })}
      </g>

      {/* Routes */}
      <g fill="none" strokeWidth="4">
        {play.routes.map((r, idx) => (
          <path
            key={idx}
            d={r.path}
            stroke={r.dash ? "#ffeb3b" : "#ffffff"}
            strokeDasharray={r.dash ? "10 6" : undefined}
            markerEnd={r.dash ? "url(#arrowYellow)" : "url(#arrowWhite)"}
            opacity="0.95"
          />
        ))}
      </g>

      {/* Route labels */}
      {play.routes.map((r, idx) => {
        const pathElement = r.path;
        const matches = [...pathElement.matchAll(/[ML]\s*(\d+)\s+(\d+)/g)];
        if (matches.length > 0 && r.label) {
          const lastMatch = matches[matches.length - 1];
          const x = parseInt(lastMatch[1]);
          const y = parseInt(lastMatch[2]);
          return (
            <g key={`label-${idx}`}>
              <rect
                x={x + 10}
                y={y - 25}
                width={r.label.length * 9 + 10}
                height={22}
                fill="#000000"
                opacity="0.7"
                rx="3"
              />
              <text
                x={x + 15}
                y={y - 10}
                fill="#ffffff"
                fontSize="13"
                fontWeight="600"
                fontFamily="Arial, sans-serif"
              >
                {r.label}
              </text>
            </g>
          );
        }
        return null;
      })}

      {/* Players - Now Interactive! */}
      <g>
        {play.players.map((p) => {
          const isQB = p.id === "QB";
          const isOL = ["C", "LG", "RG", "LT", "RT"].includes(p.id);
          const isSelected = selectedPlayerId === p.id;
          const isHovered = hoveredPlayer === p.id;
          
          let filter = "url(#playerGlow)";
          if (isSelected) filter = "url(#selectedGlow)";
          else if (isHovered) filter = "url(#hoverGlow)";
          
          return (
            <g 
              key={p.id} 
              filter={filter}
              style={{ cursor: "pointer" }}
              onClick={() => onPlayerClick?.(p)}
              onMouseEnter={() => setHoveredPlayer(p.id)}
              onMouseLeave={() => setHoveredPlayer(null)}
            >
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="22"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="5 3"
                  opacity="0.8"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="0;8"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              
              {/* Player circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isOL ? "14" : "16"}
                fill={isOL ? "#dc2626" : "#ffffff"}
                stroke="#000000"
                strokeWidth="2"
              />
              
              {/* Player label */}
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor="middle"
                fontWeight="bold"
                fontSize={isOL ? "12" : "13"}
                fill={isOL ? "#ffffff" : "#000000"}
                fontFamily="Arial, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {p.id}
              </text>
              
              {/* Position label above player */}
              {!isOL && (
                <text
                  x={p.x}
                  y={p.y - 25}
                  textAnchor="middle"
                  fontWeight="600"
                  fontSize="12"
                  fill="#ffffff"
                  fontFamily="Arial, sans-serif"
                  style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)", pointerEvents: "none" }}
                >
                  {p.id}
                </text>
              )}

              {/* Action label if assigned */}
              {p.action && (
                <text
                  x={p.x}
                  y={p.y + 35}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#ffeb3b"
                  fontFamily="Arial, sans-serif"
                  fontWeight="600"
                  style={{ pointerEvents: "none" }}
                >
                  {p.action}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* Line of scrimmage */}
      <line
        x1="100"
        x2="1100"
        y1="350"
        y2="350"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeDasharray="15 5"
        opacity="0.7"
      />
      
      {/* LOS label */}
      <rect x="105" y="340" width="35" height="20" fill="#3b82f6" opacity="0.7" rx="2" />
      <text
        x="122"
        y="354"
        fill="#ffffff"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
      >
        LOS
      </text>
    </svg>
  );
};

export default Field;