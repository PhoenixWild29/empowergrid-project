from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..models.project import Project
from ..db_models import ProjectDB
from ..database import get_db
from .auth import get_current_user
import uuid

router = APIRouter()

@router.get("/projects", tags=["Projects"])
async def get_projects(db: Session = Depends(get_db)):
    rows = db.query(ProjectDB).all()
    return [{"id": r.id, "name": r.name, "description": r.description, "owner_wallet": r.owner_wallet, "total_funding": r.total_funding, "status": r.status} for r in rows]

@router.get("/projects/{project_id}", tags=["Projects"])
async def get_project(project_id: str, db: Session = Depends(get_db)):
    row = db.query(ProjectDB).filter(ProjectDB.id == project_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"id": row.id, "name": row.name, "description": row.description, "owner_wallet": row.owner_wallet, "total_funding": row.total_funding, "status": row.status}

@router.post("/projects", tags=["Projects"])
async def create_project(project: Project, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    if project.owner_wallet != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    row = ProjectDB(id=str(uuid.uuid4()), name=project.name, description=project.description, owner_wallet=project.owner_wallet, total_funding=project.total_funding, status=project.status)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row