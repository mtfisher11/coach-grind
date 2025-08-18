from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Optional

router = APIRouter()

class PlayAnalysisRequest(BaseModel):
    play_name: str
    formation: str
    personnel: str = "11"
    routes: List[Dict]
    concept: Optional[str] = None

class GeneratePlayRequest(BaseModel):
    description: str

class CounterPlayRequest(BaseModel):
    defensive_scheme: str

@router.post("/analyze")
async def analyze_play(request: Request, play_data: PlayAnalysisRequest):
    """
    Analyze a football play and provide coaching insights
    """
    try:
        ai_service = request.app.state.ai_service
        analysis = await ai_service.analyze_play(
            play_name=play_data.play_name,
            formation=play_data.formation,
            personnel=play_data.personnel,
            routes=play_data.routes,
            concept=play_data.concept
        )
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_play(request: Request, play_request: GeneratePlayRequest):
    """
    Generate a complete play from natural language description
    """
    try:
        ai_service = request.app.state.ai_service
        play = await ai_service.generate_play_from_description(play_request.description)
        return {"success": True, "play": play}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest-counters")
async def suggest_counter_plays(request: Request, counter_request: CounterPlayRequest):
    """
    Suggest offensive plays that work well against specific defensive schemes
    """
    try:
        ai_service = request.app.state.ai_service
        suggestions = await ai_service.suggest_counter_plays(counter_request.defensive_scheme)
        return {"success": True, "suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))