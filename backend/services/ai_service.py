import os
from typing import Dict, List, Optional
from openai import OpenAI
import json

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4o-mini"  # Using cost-effective model
        
    async def analyze_play(
        self,
        play_name: str,
        formation: str,
        personnel: str,
        routes: List[Dict],
        concept: Optional[str] = None
    ) -> Dict:
        """
        Analyze a football play and provide coaching insights
        """
        
        # Build prompt with play details
        prompt = f"""
        You are an expert football coach analyzing a play. Provide detailed coaching analysis for:
        
        Play: {play_name}
        Formation: {formation}
        Personnel: {personnel}
        Concept: {concept or 'Custom'}
        Routes: {json.dumps(routes, indent=2)}
        
        Provide analysis in the following JSON format:
        {{
            "whenToCall": [3-4 specific game situations when this play is effective],
            "bestAgainst": [3-4 defensive schemes/coverages this beats],
            "strengths": [3-4 key advantages of this play],
            "weaknesses": [2-3 vulnerabilities to watch for],
            "coachingPoints": [3-4 key coaching points for execution],
            "qbProgression": [3-5 step QB read progression],
            "adjustments": {{
                "vsMan": "Adjustment against man coverage",
                "vsZone": "Adjustment against zone coverage",
                "vsBlitz": "Hot route adjustment for blitz"
            }},
            "redZone": "Effectiveness and adjustments in red zone",
            "keyMatchups": [2-3 critical player matchups for success]
        }}
        
        Be specific, practical, and use real football terminology. Focus on actionable coaching insights.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert football coach with deep knowledge of offensive schemes, defensive coverages, and game strategy."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=1500
            )
            
            analysis = json.loads(response.choices[0].message.content)
            return analysis
            
        except Exception as e:
            print(f"AI Analysis Error: {str(e)}")
            # Return default analysis if AI fails
            return self._get_default_analysis(play_name, formation, concept)
    
    async def generate_play_from_description(self, description: str) -> Dict:
        """
        Generate a complete play from natural language description
        """
        prompt = f"""
        You are an expert football coach. Generate a complete football play based on this description:
        
        "{description}"
        
        Return a JSON object with:
        {{
            "name": "Play name",
            "formation": "Formation name (e.g., Gun Trips Right, I-Form Strong)",
            "personnel": "Personnel grouping (e.g., 11, 12, 21)",
            "concept": "Core concept (e.g., Mesh, Smash, Power)",
            "players": [
                {{"id": "position", "x": x_coord, "y": y_coord}} // positions on 1200x600 field
            ],
            "routes": [
                {{
                    "from": "player_id",
                    "routeType": "route name",
                    "path": "SVG path string",
                    "label": "Route label"
                }}
            ],
            "blocking": {{
                "scheme": "Blocking scheme name",
                "assignments": {{"position": "assignment"}}
            }},
            "description": "Brief play description",
            "coachingNotes": "Key coaching points"
        }}
        
        Use standard football positions: QB, RB, FB, X, Z, Y, F, H, C, LG, RG, LT, RT
        Field dimensions: 1200px wide x 600px tall, offense starts around y=380
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert football coach and play designer."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.8,
                max_tokens=2000
            )
            
            play_data = json.loads(response.choices[0].message.content)
            return play_data
            
        except Exception as e:
            print(f"Play Generation Error: {str(e)}")
            raise Exception(f"Failed to generate play: {str(e)}")
    
    async def suggest_counter_plays(self, defensive_scheme: str) -> List[Dict]:
        """
        Suggest offensive plays that work well against a specific defense
        """
        prompt = f"""
        You are an expert offensive coordinator. Suggest 5 effective plays against: {defensive_scheme}
        
        For each play, provide:
        {{
            "playName": "Name of the play",
            "formation": "Offensive formation",
            "concept": "Core concept",
            "reasoning": "Why this works against {defensive_scheme}",
            "keyPoints": ["2-3 execution keys"]
        }}
        
        Return as JSON array.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert offensive coordinator."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=1000
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get("plays", [])
            
        except Exception as e:
            print(f"Counter Play Suggestion Error: {str(e)}")
            return []
    
    def _get_default_analysis(self, play_name: str, formation: str, concept: Optional[str]) -> Dict:
        """
        Fallback analysis if AI service fails
        """
        return {
            "whenToCall": [
                "3rd and medium (4-7 yards)",
                "Red zone situations",
                "2-minute drill",
                "After successful run plays"
            ],
            "bestAgainst": [
                "Cover 2 defense",
                "Man coverage",
                "Aggressive blitzing teams"
            ],
            "strengths": [
                "Multiple options for quarterback",
                "Can exploit mismatches",
                "Good ball control play"
            ],
            "weaknesses": [
                "Takes time to develop",
                "Vulnerable to interior pressure"
            ],
            "coachingPoints": [
                "Ensure proper spacing between receivers",
                "QB must go through full progression",
                "RB check protection first"
            ],
            "qbProgression": [
                "Pre-snap: Identify Mike linebacker",
                "First read: Quick game concept",
                "Second read: Intermediate routes",
                "Checkdown: RB in flat"
            ],
            "adjustments": {
                "vsMan": "Convert to quick slants and hot routes",
                "vsZone": "Sit in open windows, work option routes",
                "vsBlitz": "RB stays in for protection, hot route to slot"
            },
            "redZone": "Effective inside the 20, consider fade routes to corners",
            "keyMatchups": [
                "Slot receiver vs nickel corner",
                "X receiver vs boundary corner"
            ]
        }