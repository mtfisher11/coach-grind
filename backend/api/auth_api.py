from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import os
from datetime import datetime, timedelta
import secrets

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    team: Optional[str] = None
    role: str = "coach"  # coach, assistant, player

class UserProfile(BaseModel):
    name: str
    team: Optional[str] = None
    role: str
    subscription: str = "free"  # free, pro, enterprise

# In-memory storage for demo (will move to Supabase)
users_storage = {}
sessions_storage = {}

@router.post("/signup")
async def signup(signup_data: SignupRequest):
    """
    Create a new user account
    """
    if signup_data.email in users_storage:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_id = f"user_{datetime.now().timestamp()}"
    users_storage[signup_data.email] = {
        "id": user_id,
        "email": signup_data.email,
        "password": signup_data.password,  # In production, hash this!
        "name": signup_data.name,
        "team": signup_data.team,
        "role": signup_data.role,
        "created_at": datetime.now().isoformat()
    }
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    sessions_storage[session_token] = {
        "user_id": user_id,
        "email": signup_data.email,
        "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
    }
    
    return {
        "success": True,
        "user_id": user_id,
        "session_token": session_token,
        "user": {
            "email": signup_data.email,
            "name": signup_data.name,
            "team": signup_data.team,
            "role": signup_data.role
        }
    }

@router.post("/login")
async def login(login_data: LoginRequest):
    """
    Login user
    """
    if login_data.email not in users_storage:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users_storage[login_data.email]
    if user["password"] != login_data.password:  # In production, verify hashed password
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    sessions_storage[session_token] = {
        "user_id": user["id"],
        "email": user["email"],
        "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
    }
    
    return {
        "success": True,
        "session_token": session_token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "team": user["team"],
            "role": user["role"]
        }
    }

@router.post("/logout")
async def logout(session_token: str):
    """
    Logout user
    """
    if session_token in sessions_storage:
        del sessions_storage[session_token]
    
    return {"success": True, "message": "Logged out successfully"}

@router.get("/profile")
async def get_profile(session_token: str):
    """
    Get user profile
    """
    if session_token not in sessions_storage:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    session = sessions_storage[session_token]
    
    # Find user by email
    for email, user in users_storage.items():
        if user["id"] == session["user_id"]:
            return {
                "success": True,
                "user": {
                    "id": user["id"],
                    "email": user["email"],
                    "name": user["name"],
                    "team": user["team"],
                    "role": user["role"]
                }
            }
    
    raise HTTPException(status_code=404, detail="User not found")

@router.put("/profile")
async def update_profile(session_token: str, profile: UserProfile):
    """
    Update user profile
    """
    if session_token not in sessions_storage:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    session = sessions_storage[session_token]
    
    # Update user
    for email, user in users_storage.items():
        if user["id"] == session["user_id"]:
            user["name"] = profile.name
            user["team"] = profile.team
            user["role"] = profile.role
            return {"success": True, "message": "Profile updated"}
    
    raise HTTPException(status_code=404, detail="User not found")