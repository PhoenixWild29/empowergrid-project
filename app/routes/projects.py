from fastapi import APIRouter, HTTPException, Depends
from ..models import Project
from ..storage import projects
from .auth import get_current_user

router = APIRouter()

@router.get("/projects", tags=["Projects"])
async def get_projects():
    return list(projects.values())

@router.get("/projects/{project_id}", tags=["Projects"])
async def get_project(project_id: str):
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects[project_id]

@router.post("/projects", tags=["Projects"])
async def create_project(project: Project, current_user: str = Depends(get_current_user)):
    if project.owner_wallet != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    projects[project.id] = project
    return project