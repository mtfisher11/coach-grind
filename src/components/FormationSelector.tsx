import React, { useState } from 'react';
import formationsData from '../data/formations.json';

interface FormationPosition {
  x: number;
  y: number;
  onLOS: boolean;
  eligible: boolean;
}

interface Formation {
  id: string;
  name: string;
  personnel: string;
  category: string;
  description: string;
  positions: Record<string, FormationPosition>;
  tags: string[];
}

interface Props {
  onFormationSelect: (formation: Formation) => void;
  currentFormationId?: string;
}

const FormationSelector: React.FC<Props> = ({ onFormationSelect, currentFormationId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const formations = formationsData.formations as Formation[];
  const categories = ['all', ...new Set(formations.map(f => f.category))];

  // Filter formations
  const filteredFormations = formations.filter(formation => {
    const matchesCategory = selectedCategory === 'all' || formation.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      formation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formation.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      formation.personnel.includes(searchTerm);
    
    return matchesCategory && matchesSearch;
  });

  // Group formations by personnel
  const groupedFormations = filteredFormations.reduce((acc, formation) => {
    const personnel = formationsData.personnel_groups[formation.personnel]?.name || formation.personnel;
    if (!acc[personnel]) {
      acc[personnel] = [];
    }
    acc[personnel].push(formation);
    return acc;
  }, {} as Record<string, Formation[]>);

  return (
    <div style={{
      background: 'var(--panel)',
      borderRadius: '16px',
      padding: '1.5rem',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h3 style={{ marginBottom: '1rem' }}>Select Formation</h3>

      {/* Search and filters */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search formations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'var(--panel-2)',
            color: 'var(--ink)',
            marginBottom: '0.75rem'
          }}
        />

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: selectedCategory === category ? 'var(--accent)' : 'transparent',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textTransform: 'capitalize'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Formations list */}
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        {Object.entries(groupedFormations).map(([personnel, formations]) => (
          <div key={personnel} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: '0.5rem'
            }}>
              {personnel}
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {formations.map(formation => (
                <div
                  key={formation.id}
                  onClick={() => onFormationSelect(formation)}
                  style={{
                    padding: '1rem',
                    background: currentFormationId === formation.id ? 'var(--accent)' : 'var(--panel-2)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h5 style={{ margin: 0 }}>{formation.name}</h5>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.7 }}>
                        {formation.description}
                      </p>
                    </div>
                    
                    {/* Mini formation preview */}
                    <svg width="80" height="40" style={{ opacity: 0.6 }}>
                      {/* Mini field */}
                      <rect x={0} y={0} width={80} height={40} fill="#0a5f38" rx="4" />
                      <line x1={0} y1={20} x2={80} y2={20} stroke="white" strokeWidth="0.5" opacity="0.3" />
                      
                      {/* Mini players */}
                      {Object.entries(formation.positions).map(([playerId, pos]) => {
                        const x = (pos.x / 1200) * 80;
                        const y = ((pos.y - 300) / 200) * 40;
                        return (
                          <circle
                            key={playerId}
                            cx={x}
                            cy={y}
                            r="2"
                            fill={pos.onLOS ? '#3b82f6' : '#10b981'}
                          />
                        );
                      })}
                    </svg>
                  </div>
                  
                  {/* Tags */}
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {formation.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          opacity: 0.7
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Show details toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
      >
        {showDetails ? 'Hide' : 'Show'} Formation Details
      </button>

      {/* Formation details */}
      {showDetails && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'var(--panel-2)',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          <h4>NFL Formation Rules:</h4>
          <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
            {formationsData.rules.offense.formation_requirements.map((rule, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>{rule}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FormationSelector;