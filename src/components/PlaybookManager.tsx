import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Play } from './Field';

interface PlaybookCategory {
  id: string;
  name: string;
  type: 'offense' | 'defense' | 'special_teams';
  subcategories?: PlaybookCategory[];
}

interface SavedPlay {
  id: string;
  name: string;
  formation: string;
  concept: string;
  personnel: string;
  category_id: string;
  play_data: any;
  situation_tags: string[];
  created_at: string;
  updated_at: string;
}

const OFFENSIVE_CATEGORIES: PlaybookCategory[] = [
  {
    id: 'run-game',
    name: 'Run Game',
    type: 'offense',
    subcategories: [
      { id: 'zone', name: 'Zone Schemes', type: 'offense' },
      { id: 'gap', name: 'Gap Schemes', type: 'offense' },
      { id: 'draw', name: 'Draw Plays', type: 'offense' },
      { id: 'option', name: 'Option', type: 'offense' }
    ]
  },
  {
    id: 'pass-game',
    name: 'Pass Game',
    type: 'offense',
    subcategories: [
      { id: 'quick-game', name: 'Quick Game (3 Step)', type: 'offense' },
      { id: 'intermediate', name: 'Intermediate (5 Step)', type: 'offense' },
      { id: 'deep-shots', name: 'Deep Shots (7 Step)', type: 'offense' },
      { id: 'play-action', name: 'Play Action', type: 'offense' },
      { id: 'screens', name: 'Screens', type: 'offense' },
      { id: 'rpo', name: 'RPO', type: 'offense' }
    ]
  },
  {
    id: 'situational',
    name: 'Situational',
    type: 'offense',
    subcategories: [
      { id: 'red-zone', name: 'Red Zone', type: 'offense' },
      { id: 'goal-line', name: 'Goal Line', type: 'offense' },
      { id: 'third-down', name: '3rd Down', type: 'offense' },
      { id: 'two-minute', name: '2 Minute', type: 'offense' },
      { id: 'four-minute', name: '4 Minute', type: 'offense' }
    ]
  }
];

const SITUATION_TAGS = [
  '1st Down',
  '2nd & Short',
  '2nd & Medium',
  '2nd & Long',
  '3rd & Short',
  '3rd & Medium',
  '3rd & Long',
  '4th Down',
  'Red Zone',
  'Goal Line',
  '2 Minute',
  '4 Minute',
  'Backed Up',
  'Open Field',
  'Coming Out'
];

interface PlaybookManagerProps {
  onSelectPlay?: (play: SavedPlay) => void;
  currentPlay?: Play | null;
  onSavePlay?: (play: SavedPlay) => void;
}

const PlaybookManager: React.FC<PlaybookManagerProps> = ({ 
  onSelectPlay, 
  currentPlay,
  onSavePlay 
}) => {
  const [plays, setPlays] = useState<SavedPlay[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('pass-game');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('quick-game');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [playName, setPlayName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load plays from database
  useEffect(() => {
    loadPlays();
  }, [selectedCategory, selectedSubcategory]);

  const loadPlays = async () => {
    if (!supabase) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('plays')
        .select('*')
        .eq('category_id', `${selectedCategory}-${selectedSubcategory}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlays(data || []);
    } catch (error) {
      console.error('Error loading plays:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlay = async () => {
    if (!currentPlay || !playName || !supabase) return;

    try {
      const playData = {
        name: playName,
        formation: currentPlay.name.split(' — ')[0],
        concept: 'Custom',
        personnel: '11', // Extract from formation
        category_id: `${selectedCategory}-${selectedSubcategory}`,
        play_data: currentPlay,
        situation_tags: selectedTags
      };

      const { data, error } = await supabase
        .from('plays')
        .insert([playData])
        .select()
        .single();

      if (error) throw error;

      setPlays([data, ...plays]);
      setShowSaveDialog(false);
      setPlayName('');
      setSelectedTags([]);
      
      if (onSavePlay) onSavePlay(data);
    } catch (error) {
      console.error('Error saving play:', error);
    }
  };

  const filteredPlays = plays.filter(play => {
    const matchesSearch = play.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = filterTags.length === 0 || 
      filterTags.some(tag => play.situation_tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const currentCategory = OFFENSIVE_CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <div style={{
      background: 'var(--panel)',
      borderRadius: '16px',
      padding: '2rem',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Playbook Manager</h2>
        
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {OFFENSIVE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`button ${selectedCategory === cat.id ? '' : 'secondary'}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedSubcategory(cat.subcategories?.[0]?.id || '');
              }}
              style={{ padding: '0.5rem 1rem' }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategory Tabs */}
        {currentCategory?.subcategories && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {currentCategory.subcategories.map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.id)}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  border: `1px solid ${selectedSubcategory === sub.id ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                  background: selectedSubcategory === sub.id ? 'var(--primary)' : 'transparent',
                  color: 'white',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search plays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'var(--panel-2)',
              color: 'white'
            }}
          />
          {currentPlay && (
            <button 
              className="button"
              onClick={() => setShowSaveDialog(true)}
            >
              Save Current Play
            </button>
          )}
        </div>

        {/* Situation Filter Tags */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SITUATION_TAGS.slice(0, 8).map(tag => (
            <button
              key={tag}
              onClick={() => {
                setFilterTags(prev => 
                  prev.includes(tag) 
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                );
              }}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: filterTags.includes(tag) ? 'var(--primary)' : 'transparent',
                color: 'white',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Plays List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        background: 'var(--panel-2)',
        borderRadius: '8px',
        padding: '1rem'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
            Loading plays...
          </div>
        ) : filteredPlays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
            No plays found. Create your first play!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredPlays.map(play => (
              <div
                key={play.id}
                onClick={() => onSelectPlay?.(play)}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'var(--panel)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  ':hover': {
                    borderColor: 'var(--primary)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{play.name}</strong>
                  <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    {play.formation} • {play.personnel}
                  </span>
                </div>
                {play.situation_tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {play.situation_tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: 'var(--primary)',
                          fontSize: '0.75rem'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Play Dialog */}
      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--panel)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Save Play to Playbook</h3>
            
            <input
              type="text"
              placeholder="Play name..."
              value={playName}
              onChange={(e) => setPlayName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'var(--panel-2)',
                color: 'white',
                marginBottom: '1rem'
              }}
            />

            <div style={{ marginBottom: '1.5rem' }}>
              <div className="kicker" style={{ marginBottom: '0.5rem' }}>SITUATION TAGS</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {SITUATION_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: selectedTags.includes(tag) ? 'var(--primary)' : 'transparent',
                      color: 'white',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="button secondary"
                onClick={() => {
                  setShowSaveDialog(false);
                  setPlayName('');
                  setSelectedTags([]);
                }}
              >
                Cancel
              </button>
              <button 
                className="button"
                onClick={savePlay}
                disabled={!playName}
              >
                Save Play
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaybookManager;