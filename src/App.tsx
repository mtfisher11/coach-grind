import { useMemo, useState } from "react";
import Field, { Play, Player, Route } from "./components/Field";
import PlayAnalysis from "./components/PlayAnalysis";
import formations from "./data/catalogs/formations.json";
import { flipHoriz } from "./types/football";
import PlayerActionMenu from "./components/PlayerActionMenu";
import { coachGrindAPI, PlayAnalysis as PlayAnalysisType } from "./services/api";

// Choose one to start
const initialFormationId = "gun_trips_right_11";

function toPlayers(defaults: Record<string,[number,number]>): Player[] {
  return Object.entries(defaults).map(([id, [x,y]]) => ({ id, x, y }));
}

function generateRouteFromAction(player: Player, action: string): Route | null {
  const x = player.x;
  const y = player.y;
  
  switch(action) {
    case "hitch":
      return { from: player.id, path: `M${x} ${y} L ${x} ${y - 50}`, label: "Hitch" };
    case "curl":
      return { from: player.id, path: `M${x} ${y} L ${x} ${y - 120} Q ${x - 20} ${y - 140} ${x - 40} ${y - 120}`, label: "Curl" };
    case "out":
      return { from: player.id, path: `M${x} ${y} L ${x} ${y - 100} L ${x + 100} ${y - 100}`, label: "Out" };
    case "dig":
      return { from: player.id, path: `M${x} ${y} L ${x} ${y - 150} L ${x - 150} ${y - 150}`, label: "Dig" };
    case "corner":
      return { from: player.id, path: `M${x} ${y} L ${x} ${y - 70} Q ${x + 30} ${y - 120} ${x + 60} ${y - 160}`, label: "Corner" };
    case "post":
      return { from: player.id, path: `M${x} ${y} L ${x} ${y - 70} L ${x - 60} ${y - 160}`, label: "Post" };
    case "go":
      return { from: player.id, path: `M${x} ${y} L ${x} ${y - 200}`, label: "Go" };
    case "slant":
      return { from: player.id, path: `M${x} ${y} L ${x - 60} ${y - 60}`, label: "Slant" };
    case "shallow":
      return { from: player.id, path: `M${x} ${y} L ${x} ${y - 30} L ${x - 200} ${y - 30}`, label: "Shallow" };
    case "swing":
      return { from: player.id, path: `M${x} ${y} L ${x - 100} ${y + 20} Q ${x - 150} ${y + 30} ${x - 200} ${y + 10}`, label: "Swing", dash: true };
    default:
      return null;
  }
}

export default function App() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [playerActions, setPlayerActions] = useState<Record<string, string>>({});
  const [customRoutes, setCustomRoutes] = useState<Route[]>([]);
  
  // Formation state
  const [formationId, setFormationId] = useState(initialFormationId);
  const [flip, setFlip] = useState(false);
  
  // AI Analysis state
  const [playAnalysis, setPlayAnalysis] = useState<PlayAnalysisType | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [playDescription, setPlayDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Play concept state
  const [selectedConcept, setSelectedConcept] = useState("mesh");

  const formation = useMemo(
    () => (formations as any[]).find(f => f.id === formationId)!,
    [formationId]
  );

  const anchors = useMemo(() => {
    // Add offensive line positions to the formation
    const baseAnchors = formation.defaults;
    const withOL = {
      ...baseAnchors,
      C: [600, 380] as [number, number],
      LG: [560, 380] as [number, number],
      RG: [640, 380] as [number, number],
      LT: [520, 380] as [number, number],
      RT: [680, 380] as [number, number]
    };
    return flip ? flipHoriz(withOL) : withOL;
  }, [formation, flip]);

  // Demo: hardcode Mesh routes off anchors (so the field shows something)
  const routes: Route[] = useMemo(() => {
    const Z = anchors.Z ?? [340,320];
    const X = anchors.X ?? [220,340];
    const Y = anchors.Y ?? [700,340];
    const F = anchors.F ?? [980,320];
    
    // Add demo routes plus any custom routes from player actions
    const demoRoutes = [];
    if (anchors.Z) demoRoutes.push({ from:"Z", path:`M${Z[0]} ${Z[1]} L ${Z[0]+170} ${Z[1]} L ${Z[0]+250} ${Z[1]+40}`, label: "Mesh" });
    if (anchors.X) demoRoutes.push({ from:"X", path:`M${X[0]} ${X[1]} L ${X[0]+160} ${X[1]} L ${X[0]+260} ${X[1]-30}`, label: "Mesh" });
    if (anchors.Y) demoRoutes.push({ from:"Y", path:`M${Y[0]} ${Y[1]} Q ${Y[0]+40} ${Y[1]-60} ${Y[0]+60} ${Y[1]-120}`, label: "Corner" });
    if (anchors.F) demoRoutes.push({ from:"F", path:`M${F[0]} ${F[1]} L ${F[0]} ${F[1]-40} L ${F[0]+40} ${F[1]-60}`, label: "Slant" });
    
    return [...demoRoutes, ...customRoutes];
  }, [anchors, customRoutes]);

  const players = useMemo(() => toPlayers(anchors), [anchors]);
  const play: Play = { name: `${formation.name} — ${selectedConcept}`, players, routes };

  function handlePlayerClick(player: Player, event?: any) {
    setSelectedPlayer(player);
    const rect = (event?.target as SVGElement)?.getBoundingClientRect();
    if (rect) {
      setMenuPosition({ 
        x: rect.left + (rect.width / 2), 
        y: rect.top - 10 
      });
    }
  }

  function handleActionSelect(playerId: string, action: string) {
    setPlayerActions(prev => ({ ...prev, [playerId]: action }));
    
    const player = play.players.find(p => p.id === playerId);
    if (player) {
      const newRoute = generateRouteFromAction(player, action);
      if (newRoute) {
        setCustomRoutes(prev => [
          ...prev.filter(r => r.from !== playerId),
          newRoute
        ]);
      }
    }
  }
  
  async function analyzePlay() {
    setIsAnalyzing(true);
    try {
      const analysis = await coachGrindAPI.analyzePlay(
        play.name,
        formation.name,
        formation.personnel || "11",
        routes.map(r => ({
          player: r.from,
          route: r.label,
          path: r.path
        })),
        selectedConcept
      );
      setPlayAnalysis(analysis);
    } catch (error) {
      console.error("Failed to analyze play:", error);
      // Use default analysis if API fails
      setPlayAnalysis({
        whenToCall: ["3rd and medium", "Red zone", "2-minute drill"],
        bestAgainst: ["Cover 2", "Man coverage", "Blitz packages"],
        strengths: ["Multiple options", "Quick developing", "Hard to defend"],
        weaknesses: ["Needs pass protection", "Vulnerable to zone drops"],
        coachingPoints: ["Set proper spacing", "Time the mesh", "Check protection"],
        qbProgression: ["Pre-snap read", "Mesh concept", "Corner route", "Checkdown"]
      });
    } finally {
      setIsAnalyzing(false);
    }
  }
  
  async function generatePlayFromDescription() {
    if (!playDescription.trim()) return;
    
    setIsGenerating(true);
    try {
      const generatedPlay = await coachGrindAPI.generatePlay(playDescription);
      
      // Update formation and routes based on generated play
      // This would require more complex state management
      console.log("Generated play:", generatedPlay);
      alert(`Play generated: ${generatedPlay.name}\n\n${generatedPlay.description}`);
    } catch (error) {
      console.error("Failed to generate play:", error);
      alert("Failed to generate play. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <div className="logo">
            <div>
              <div className="kicker">PLAYBOOK AI</div>
              <h1>CoachGrind</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="button primary"
              onClick={analyzePlay}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "Analyzing..." : "🤖 AI Analysis"}
            </button>
            <button className="button secondary" onClick={() => window.print()}>
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <main>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: playAnalysis ? '2fr 1fr' : '1fr', 
          gap: '2rem',
          alignItems: 'start'
        }}>
          <div>
            <section className="hero-section">
              <h2>AI-Powered Play Design</h2>
              <p>Professional formations with intelligent coaching analysis</p>
            </section>

            {/* AI Play Generator */}
            <section style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div className="kicker" style={{ marginBottom: '1rem', color: '#3B82F6' }}>
                🤖 AI PLAY GENERATOR
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="Describe your play (e.g., 'Trips right with a deep shot to X and RB checkdown')"
                  value={playDescription}
                  onChange={(e) => setPlayDescription(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && generatePlayFromDescription()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'white'
                  }}
                />
                <button
                  className="button primary"
                  onClick={generatePlayFromDescription}
                  disabled={isGenerating || !playDescription.trim()}
                >
                  {isGenerating ? "Generating..." : "Generate Play"}
                </button>
              </div>
            </section>

            {/* Formation Controls */}
            <section style={{
              background: 'var(--panel)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div>
                  <div className="kicker" style={{ marginBottom: '0.5rem' }}>FORMATION</div>
                  <select
                    className="select"
                    value={formationId}
                    onChange={(e) => setFormationId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'var(--panel-2)',
                      color: 'white'
                    }}
                  >
                    {(formations as any[]).map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="kicker" style={{ marginBottom: '0.5rem' }}>CONCEPT</div>
                  <select
                    className="select"
                    value={selectedConcept}
                    onChange={(e) => setSelectedConcept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'var(--panel-2)',
                      color: 'white'
                    }}
                  >
                    <option value="mesh">Mesh</option>
                    <option value="smash">Smash</option>
                    <option value="flood">Flood</option>
                    <option value="verts">4 Verts</option>
                    <option value="stick">Stick</option>
                    <option value="levels">Levels</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <div className="kicker" style={{ marginBottom: '0.5rem' }}>PERSONNEL</div>
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'var(--panel-2)',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {formation.personnel} Personnel
                  </div>
                </div>
                <div>
                  <div className="kicker" style={{ marginBottom: '0.5rem' }}>OPTIONS</div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'var(--panel-2)',
                    cursor: 'pointer',
                    height: '42px'
                  }}>
                    <input
                      type="checkbox"
                      checked={flip}
                      onChange={(e) => setFlip(e.target.checked)}
                    />
                    Mirror (L/R)
                  </label>
                </div>
              </div>
            </section>

            <section className="field-section" style={{ marginBottom: '2rem' }}>
              <div className="field-container">
                <Field 
                  play={play} 
                  height={600} 
                  onPlayerClick={handlePlayerClick}
                  selectedPlayerId={selectedPlayer?.id}
                />
                <div style={{ marginTop: '1rem', textAlign: 'center', opacity: 0.7 }}>
                  <p>{play.name}</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Click any player to customize their route or assignment
                  </p>
                </div>
              </div>
            </section>
          </div>
          
          {/* AI Analysis Panel */}
          {playAnalysis && (
            <div>
              <PlayAnalysis
                analysis={playAnalysis}
                concept={selectedConcept}
                formation={formation.name}
                personnel={formation.personnel}
              />
            </div>
          )}
        </div>
      </main>

      <footer>
        <p>© 2025 CoachGrind • AI-Powered Football Play Design</p>
      </footer>

      {/* Player Action Menu */}
      {selectedPlayer && (
        <PlayerActionMenu
          player={selectedPlayer}
          onActionSelect={handleActionSelect}
          onClose={() => setSelectedPlayer(null)}
          position={menuPosition}
        />
      )}
    </div>
  );
}