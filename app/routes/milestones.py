from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..storage import projects, milestones
from .auth import get_current_user
import datetime

router = APIRouter()

@router.get("/projects/{project_id}/milestones", tags=["Milestones"])
async def get_milestones(project_id: str):
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    return [m for m in milestones.values() if m.project_id == project_id]

class CompleteMilestoneRequest(BaseModel):
    proof_url: str

@router.post("/milestones/{milestone_id}/complete", tags=["Milestones"])
async def complete_milestone(milestone_id: str, request: CompleteMilestoneRequest, current_user: str = Depends(get_current_user)):
    if milestone_id not in milestones:
        raise HTTPException(status_code=404, detail="Milestone not found")
    milestone = milestones[milestone_id]
    project = projects.get(milestone.project_id)
    if not project or project.owner_wallet != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    milestone.status = "completed"
    milestone.proof_url = request.proof_url
    milestone.completed_at = datetime.datetime.utcnow()
    return milestone