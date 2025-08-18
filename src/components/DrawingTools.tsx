import React, { useState } from 'react';

export type DrawingTool = 
  | 'select'
  | 'line'
  | 'arrow' 
  | 'curve'
  | 'zone'
  | 'text'
  | 'motion'
  | 'block';

interface Props {
  selectedTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onLineStyleChange: (style: 'solid' | 'dashed' | 'dotted') => void;
  currentColor: string;
  currentLineStyle: 'solid' | 'dashed' | 'dotted';
}

const DrawingTools: React.FC<Props> = ({
  selectedTool,
  onToolSelect,
  onColorChange,
  onLineStyleChange,
  currentColor,
  currentLineStyle
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools = [
    { id: 'select', icon: '⬚', label: 'Select' },
    { id: 'line', icon: '╱', label: 'Line' },
    { id: 'arrow', icon: '→', label: 'Arrow' },
    { id: 'curve', icon: '〜', label: 'Curve' },
    { id: 'zone', icon: '▭', label: 'Zone' },
    { id: 'text', icon: 'T', label: 'Text' },
    { id: 'motion', icon: '⤳', label: 'Motion' },
    { id: 'block', icon: '⊓', label: 'Block' }
  ];

  const colors = [
    { value: '#000000', label: 'Black' },
    { value: '#ff0000', label: 'Red' },
    { value: '#0000ff', label: 'Blue' },
    { value: '#ffff00', label: 'Yellow' },
    { value: '#00ff00', label: 'Green' },
    { value: '#ff8c00', label: 'Orange' },
    { value: '#800080', label: 'Purple' }
  ];

  const lineStyles = [
    { value: 'solid', label: '━━━' },
    { value: 'dashed', label: '- - -' },
    { value: 'dotted', label: '• • •' }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      background: 'var(--panel)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: '1rem'
    }}>
      {/* Drawing Tools */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id as DrawingTool)}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              background: selectedTool === tool.id ? 'var(--accent)' : 'var(--panel-2)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div style={{
        width: '1px',
        height: '30px',
        background: 'rgba(255,255,255,0.2)'
      }} />

      {/* Color Picker */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          style={{
            width: '40px',
            height: '40px',
            background: currentColor,
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          title="Color"
        />
        
        {showColorPicker && (
          <div style={{
            position: 'absolute',
            top: '45px',
            left: 0,
            background: 'var(--panel-2)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '0.5rem',
            display: 'flex',
            gap: '0.25rem',
            zIndex: 100
          }}>
            {colors.map(color => (
              <button
                key={color.value}
                onClick={() => {
                  onColorChange(color.value);
                  setShowColorPicker(false);
                }}
                style={{
                  width: '30px',
                  height: '30px',
                  background: color.value,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title={color.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Line Style */}
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {lineStyles.map(style => (
          <button
            key={style.value}
            onClick={() => onLineStyleChange(style.value as any)}
            style={{
              padding: '0.5rem 1rem',
              background: currentLineStyle === style.value ? 'var(--accent)' : 'var(--panel-2)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Tool Info */}
      <div style={{
        marginLeft: 'auto',
        fontSize: '0.875rem',
        opacity: 0.7
      }}>
        {selectedTool === 'select' && 'Click to select • Drag to move'}
        {selectedTool === 'line' && 'Click and drag to draw line'}
        {selectedTool === 'arrow' && 'Click and drag to draw arrow'}
        {selectedTool === 'curve' && 'Click start, drag control point, click end'}
        {selectedTool === 'zone' && 'Click and drag to draw zone'}
        {selectedTool === 'text' && 'Click to add text'}
        {selectedTool === 'motion' && 'Click player and drag motion path'}
        {selectedTool === 'block' && 'Click blocker, then defender'}
      </div>
    </div>
  );
};

export default DrawingTools;