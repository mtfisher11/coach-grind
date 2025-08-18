from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
import os

router = APIRouter()

class Player(BaseModel):
    id: str
    x: int
    y: int

class Route(BaseModel):
    from_player: str = None
    path: str
    label: str
    route_type: Optional[str] = None
    dash: Optional[bool] = False

class Play(BaseModel):
    name: str
    formation: str
    personnel: str = "11"
    players: List[Player]
    routes: List[Route]
    concept: Optional[str] = None
    description: Optional[str] = None

class SavePlayRequest(BaseModel):
    play: Play
    category: str = "offense"
    tags: List[str] = []

# In-memory storage for now (will move to Supabase)
plays_storage = {}

@router.get("/")
async def get_all_plays():
    """
    Get all saved plays
    """
    return {"success": True, "plays": list(plays_storage.values())}

@router.get("/{play_id}")
async def get_play(play_id: str):
    """
    Get a specific play by ID
    """
    if play_id not in plays_storage:
        raise HTTPException(status_code=404, detail="Play not found")
    return {"success": True, "play": plays_storage[play_id]}

@router.post("/save")
async def save_play(play_data: SavePlayRequest):
    """
    Save a new play or update existing
    """
    play_id = f"{play_data.category}_{play_data.play.name.lower().replace(' ', '_')}"
    
    plays_storage[play_id] = {
        "id": play_id,
        "play": play_data.play.dict(),
        "category": play_data.category,
        "tags": play_data.tags
    }
    
    return {"success": True, "play_id": play_id}

@router.delete("/{play_id}")
async def delete_play(play_id: str):
    """
    Delete a play
    """
    if play_id not in plays_storage:
        raise HTTPException(status_code=404, detail="Play not found")
    
    del plays_storage[play_id]
    return {"success": True, "message": "Play deleted"}

@router.get("/library/formations")
async def get_formations():
    """
    Get all available formations
    """
    formations_path = "/root/coach-grind/src/data/catalogs/formations.json"
    try:
        with open(formations_path, 'r') as f:
            formations = json.load(f)
        return {"success": True, "formations": formations}
    except Exception as e:
        return {"success": True, "formations": []}

@router.get("/library/concepts")
async def get_route_concepts():
    """
    Get all route concepts
    """
    concepts_path = "/root/coach-grind/src/data/catalogs/route_concepts.json"
    try:
        with open(concepts_path, 'r') as f:
            concepts = json.load(f)
        return {"success": True, "concepts": concepts}
    except Exception as e:
        return {"success": True, "concepts": []}