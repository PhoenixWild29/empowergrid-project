from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..db_models import MilestoneDB, ProjectDB
from .auth import get_current_user
import datetime

router = APIRouter()

class CompleteMilestoneRequest(BaseModel):
    proof_url: str

@router.get("/projects/{project_id}/milestones", tags=["Milestones"])
async def get_milestones(project_id: str, db: Session = Depends(get_db)):
    rows = db.query(MilestoneDB).filter(MilestoneDB.project_id == project_id).all()
    return [{"id": r.id, "project_id": r.project_id, "title": r.title, "description": r.description, "amount": r.amount, "status": r.status, "proof_url": r.proof_url, "completed_at": r.completed_at} for r in rows]

@router.post("/milestones/{milestone_id}/complete", tags=["Milestones"])
async def complete_milestone(milestone_id: str, request: CompleteMilestoneRequest, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    row = db.query(MilestoneDB).filter(MilestoneDB.id == milestone_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Milestone not found")
    project = db.query(ProjectDB).filter(ProjectDB.id == row.project_id).first()
    if not project or project.owner_wallet != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    row.status = "completed"
    row.proof_url = request.proof_url
    row.completed_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(row)
    return {"id": row.id, "project_id": row.project_id, "title": row.title, "description": row.description, "amount": row.amount, "status": row.status, "proof_url": row.proof_url, "completed_at": row.completed_at}
