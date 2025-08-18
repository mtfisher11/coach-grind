export type Formation = {
  id: string;
  name: string;
  personnel: string;      // e.g., "11"
  backfield: "gun"|"pistol"|"under_center"|"wildcat";
  strength: "left"|"right"|"balanced";
  systems: string[];
  tags: string[];
  defaults: Record<string, [number, number]>; // player -> [x,y]
};

export function flipHoriz(defaults: Record<string,[number,number]>, width = 1200) {
  // Mirror across vertical axis (SVG viewBox width)
  const out: Record<string,[number,number]> = {};
  for (const [id, [x,y]] of Object.entries(defaults)) out[id] = [width - x, y];
  return out;
}