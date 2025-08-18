from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

router = APIRouter()

class Playbook(BaseModel):
    name: str
    team: Optional[str] = None
    season: Optional[str] = None
    description: Optional[str] = None

class PlaySheet(BaseModel):
    name: str
    situation: str  # e.g., "3rd Down", "Red Zone", "2 Minute"
    play_ids: List[str]

# In-memory storage
playbooks_storage = {}
playsheets_storage = {}

@router.get("/")
async def get_playbooks():
    """
    Get all playbooks
    """
    return {"success": True, "playbooks": list(playbooks_storage.values())}

@router.post("/create")
async def create_playbook(playbook: Playbook):
    """
    Create a new playbook
    """
    playbook_id = f"pb_{datetime.now().timestamp()}"
    
    playbooks_storage[playbook_id] = {
        "id": playbook_id,
        "name": playbook.name,
        "team": playbook.team,
        "season": playbook.season,
        "description": playbook.description,
        "created_at": datetime.now().isoformat(),
        "plays": []
    }
    
    return {"success": True, "playbook_id": playbook_id}

@router.post("/{playbook_id}/add-play")
async def add_play_to_playbook(playbook_id: str, play_id: str):
    """
    Add a play to a playbook
    """
    if playbook_id not in playbooks_storage:
        raise HTTPException(status_code=404, detail="Playbook not found")
    
    if play_id not in playbooks_storage[playbook_id]["plays"]:
        playbooks_storage[playbook_id]["plays"].append(play_id)
    
    return {"success": True, "message": "Play added to playbook"}

@router.post("/sheets/create")
async def create_play_sheet(sheet: PlaySheet):
    """
    Create a situational play sheet
    """
    sheet_id = f"sheet_{datetime.now().timestamp()}"
    
    playsheets_storage[sheet_id] = {
        "id": sheet_id,
        "name": sheet.name,
        "situation": sheet.situation,
        "play_ids": sheet.play_ids,
        "created_at": datetime.now().isoformat()
    }
    
    return {"success": True, "sheet_id": sheet_id}

@router.get("/sheets")
async def get_play_sheets():
    """
    Get all play sheets
    """
    return {"success": True, "sheets": list(playsheets_storage.values())}

@router.get("/export/{playbook_id}")
async def export_playbook(playbook_id: str, format: str = "pdf"):
    """
    Export playbook to PDF or other format
    """
    if playbook_id not in playbooks_storage:
        raise HTTPException(status_code=404, detail="Playbook not found")
    
    # TODO: Implement actual PDF generation
    return {
        "success": True, 
        "message": f"Export to {format} will be implemented",
        "playbook": playbooks_storage[playbook_id]
    }