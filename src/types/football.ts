export type FormationPosition = {
  x: number;
  y: number;
  onLOS: boolean;
  eligible: boolean;
};

export type Formation = {
  id: string;
  name: string;
  personnel: string;      // e.g., "11"
  backfield: "gun"|"pistol"|"under_center"|"wildcat";
  strength: "left"|"right"|"balanced";
  systems: string[];
  tags: string[];
  defaults: Record<string, [number, number]>; // player -> [x,y]
  positions?: Record<string, FormationPosition>;
  category?: string;
  description?: string;
};

export type DrawingElement = {
  id: string;
  type: "block" | "text" | "line" | "motion" | "arrow" | "curve" | "zone";
  points: { x: number; y: number; }[];
  color: string;
  lineStyle: string;
  text?: string;
};

export type Play = {
  id?: string;
  name: string;
  players: any[];
  routes: any[];
  down?: number;
  distance?: number;
  when_to_call?: string;
  best_against?: string;
  strengths?: string[];
  weaknesses?: string[];
  coaching_points?: string[];
};

export function flipHoriz(defaults: Record<string,[number,number]>, width = 1200) {
  // Mirror across vertical axis (SVG viewBox width)
  const out: Record<string,[number,number]> = {};
  for (const [id, [x,y]] of Object.entries(defaults)) out[id] = [width - x, y];
  return out;
}