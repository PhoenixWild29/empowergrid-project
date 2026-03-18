from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..models import Escrow, Investor
from ..storage import projects, escrows, investors
from .auth import get_current_user

router = APIRouter()

class FundEscrowRequest(BaseModel):
    project_id: str
    amount: float

@router.post("/escrow/fund", tags=["Escrow"])
async def fund_escrow(request: FundEscrowRequest, current_user: str = Depends(get_current_user)):
    if request.project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    project = projects[request.project_id]
    project.total_funding += request.amount
    escrow = Escrow(project_id=request.project_id, funder_wallet=current_user, amount=request.amount, status="funded", tx_signature="mock_tx_sig")  # TODO: real Solana tx
    escrows[escrow.id] = escrow
    # Update investor
    if current_user not in investors:
        investors[current_user] = Investor(wallet_address=current_user)
    investor = investors[current_user]
    investor.funded_projects.append(request.project_id)
    investor.total_invested += request.amount
    return escrow

@router.post("/escrow/release", tags=["Escrow"])
async def release_escrow(escrow_id: str, current_user: str = Depends(get_current_user)):
    if escrow_id not in escrows:
        raise HTTPException(status_code=404, detail="Escrow not found")
    escrow = escrows[escrow_id]
    project = projects.get(escrow.project_id)
    if not project or project.owner_wallet != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    # TODO: check if all milestones completed
    escrow.status = "released"
    escrow.tx_signature = "mock_release_sig"  # TODO: real Solana tx
    return escrow

@router.get("/escrow/{escrow_id}/status", tags=["Escrow"])
async def get_escrow_status(escrow_id: str):
    if escrow_id not in escrows:
        raise HTTPException(status_code=404, detail="Escrow not found")
    return escrows[escrow_id]