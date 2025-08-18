import React from 'react';

interface PlayAnalysisProps {
  analysis?: {
    whenToCall: string[];
    bestAgainst: string[];
    strengths: string[];
    weaknesses: string[];
    coachingPoints: string[];
    qbProgression: string[];
  };
  concept?: string;
  formation?: string;
  personnel?: string;
}

const PlayAnalysis: React.FC<PlayAnalysisProps> = ({ 
  analysis,
  concept = 'Custom Play',
  formation = 'Formation',
  personnel = '11'
}) => {
  if (!analysis) {
    return (
      <div style={{
        background: 'var(--panel)',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center',
        opacity: 0.7
      }}>
        <p>Select a play or use AI to generate analysis</p>
      </div>
    );
  }

  const sections = [
    {
      title: 'WHEN TO CALL',
      items: analysis.whenToCall,
      icon: '📍',
      color: '#3B82F6'
    },
    {
      title: 'BEST AGAINST',
      items: analysis.bestAgainst,
      icon: '🎯',
      color: '#10B981'
    },
    {
      title: 'STRENGTHS',
      items: analysis.strengths,
      icon: '💪',
      color: '#10B981'
    },
    {
      title: 'WEAKNESSES',
      items: analysis.weaknesses,
      icon: '⚠️',
      color: '#F59E0B'
    },
    {
      title: 'COACHING POINTS',
      items: analysis.coachingPoints,
      icon: '📋',
      color: '#8B5CF6'
    },
    {
      title: 'QB PROGRESSION',
      items: analysis.qbProgression,
      icon: '👁️',
      color: '#3B82F6',
      ordered: true
    }
  ];

  return (
    <div style={{
      background: 'var(--panel)',
      borderRadius: '16px',
      padding: '2rem'
    }}>
      {/* Play Header */}
      <div style={{ 
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{ marginBottom: '0.5rem' }}>{concept}</h2>
        <div style={{ display: 'flex', gap: '2rem', opacity: 0.7 }}>
          <span>Formation: {formation}</span>
          <span>Personnel: {personnel}</span>
        </div>
      </div>

      {/* Analysis Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {sections.map(section => (
          <div 
            key={section.title}
            style={{
              background: 'var(--panel-2)',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>{section.icon}</span>
              <h3 style={{ 
                fontSize: '0.875rem',
                fontWeight: '600',
                letterSpacing: '0.05em',
                color: section.color
              }}>
                {section.title}
              </h3>
            </div>

            {section.items && section.items.length > 0 ? (
              section.ordered ? (
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {section.items.map((item, idx) => (
                    <li 
                      key={idx}
                      style={{ 
                        fontSize: '0.875rem',
                        lineHeight: '1.5'
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ol>
              ) : (
                <ul style={{ 
                  margin: 0, 
                  paddingLeft: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {section.items.map((item, idx) => (
                    <li 
                      key={idx}
                      style={{ 
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        listStyle: 'none',
                        position: 'relative'
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        left: '-1.25rem',
                        color: section.color
                      }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p style={{ 
                fontSize: '0.875rem', 
                opacity: 0.5,
                margin: 0
              }}>
                No data available
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <span>💡</span>
          <strong style={{ fontSize: '0.875rem' }}>Pro Tip</strong>
        </div>
        <p style={{ 
          fontSize: '0.875rem', 
          margin: 0,
          lineHeight: '1.5'
        }}>
          Review this analysis with your players during install. Focus on the QB progression 
          and ensure everyone understands their role in making this play successful.
        </p>
      </div>
    </div>
  );
};

export default PlayAnalysis;