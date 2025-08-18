import React from 'react';
import { Player } from './Field';

type Props = {
  player: Player;
  onActionSelect: (playerId: string, action: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
};

const PlayerActionMenu: React.FC<Props> = ({ player, onActionSelect, onClose, position }) => {
  const isOL = ["C", "LG", "RG", "LT", "RT"].includes(player.id);
  const isQB = player.id === "QB";
  const isRB = player.id === "RB";
  
  const blockingOptions = [
    { label: "Base Block", value: "base" },
    { label: "Double Team", value: "double" },
    { label: "Pull Left", value: "pull-l" },
    { label: "Pull Right", value: "pull-r" },
    { label: "Pass Set", value: "pass-set" },
    { label: "Slide Left", value: "slide-l" },
    { label: "Slide Right", value: "slide-r" },
    { label: "Chip & Release", value: "chip" },
  ];
  
  const routeOptions = [
    { label: "Hitch (5y)", value: "hitch" },
    { label: "Curl (12y)", value: "curl" },
    { label: "Out (10y)", value: "out" },
    { label: "In/Dig (15y)", value: "dig" },
    { label: "Corner", value: "corner" },
    { label: "Post", value: "post" },
    { label: "Go/Fly", value: "go" },
    { label: "Slant", value: "slant" },
    { label: "Shallow Cross", value: "shallow" },
    { label: "Deep Cross", value: "deep-cross" },
    { label: "Comeback", value: "comeback" },
    { label: "Wheel", value: "wheel" },
    { label: "Block", value: "block" },
  ];
  
  const rbOptions = [
    ...routeOptions,
    { label: "Swing", value: "swing" },
    { label: "Flare", value: "flare" },
    { label: "Check Release", value: "check" },
    { label: "Pass Pro", value: "pass-pro" },
  ];
  
  const qbOptions = [
    { label: "3-Step Drop", value: "3-step" },
    { label: "5-Step Drop", value: "5-step" },
    { label: "7-Step Drop", value: "7-step" },
    { label: "Play Action", value: "play-action" },
    { label: "Bootleg Right", value: "boot-r" },
    { label: "Bootleg Left", value: "boot-l" },
    { label: "Rollout Right", value: "roll-r" },
    { label: "Rollout Left", value: "roll-l" },
    { label: "QB Draw", value: "draw" },
    { label: "QB Sneak", value: "sneak" },
  ];
  
  let options = routeOptions;
  if (isOL) options = blockingOptions;
  else if (isQB) options = qbOptions;
  else if (isRB) options = rbOptions;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }}
        onClick={onClose}
      />
      
      {/* Menu */}
      <div
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          backgroundColor: '#0f1e38',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '8px',
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          minWidth: '200px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}
      >
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '8px'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px', 
            fontWeight: 'bold',
            color: '#3b82f6'
          }}>
            {player.id} Actions
          </h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onActionSelect(player.id, option.value);
                onClose();
              }}
              style={{
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e3a5f';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default PlayerActionMenu;