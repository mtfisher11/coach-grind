from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from api import plays_api, analysis_api, playbook_api, auth_api
from services.ai_service import AIService

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🏈 CoachGrind Backend Starting...")
    app.state.ai_service = AIService()
    yield
    # Shutdown
    print("🏈 CoachGrind Backend Shutting Down...")

app = FastAPI(
    title="CoachGrind API",
    description="AI-powered football playbook and coaching platform",
    version="0.1.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(plays_api.router, prefix="/api/plays", tags=["plays"])
app.include_router(analysis_api.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(playbook_api.router, prefix="/api/playbook", tags=["playbook"])
app.include_router(auth_api.router, prefix="/api/auth", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "CoachGrind API is running", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "coachgrind-backend"}