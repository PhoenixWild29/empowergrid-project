from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..db_models import EscrowDB, ProjectDB, InvestorDB
from .auth import get_current_user
import uuid

router = APIRouter()

class FundEscrowRequest(BaseModel):
    project_id: str
    amount: float

@router.post("/escrow/fund", tags=["Escrow"])
async def fund_escrow(request: FundEscrowRequest, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    project = db.query(ProjectDB).filter(ProjectDB.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.total_funding += request.amount
    escrow = EscrowDB(
        id=str(uuid.uuid4()),
        project_id=request.project_id,
        funder_wallet=current_user,
        amount=request.amount,
        status="funded",
        tx_signature="mock_tx_sig"  # TODO: real Solana tx
    )
    db.add(escrow)
    db.commit()
    db.refresh(escrow)
    investor = db.query(InvestorDB).filter(InvestorDB.wallet_address == current_user).first()
    if not investor:
        investor = InvestorDB(wallet_address=current_user)
        db.add(investor)
        db.commit()
    investor.total_invested += request.amount
    db.commit()
    db.refresh(investor)
    return escrow

@router.post("/escrow/release", tags=["Escrow"])
async def release_escrow(escrow_id: str, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    escrow = db.query(EscrowDB).filter(EscrowDB.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    project = db.query(ProjectDB).filter(ProjectDB.id == escrow.project_id).first()
    if not project or project.owner_wallet != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    # TODO: check if all milestones completed
    escrow.status = "released"
    escrow.tx_signature = "mock_release_sig"  # TODO: real Solana tx
    db.commit()
    db.refresh(escrow)
    return escrow

@router.get("/escrow/{escrow_id}/status", tags=["Escrow"])
async def get_escrow_status(escrow_id: str, db: Session = Depends(get_db)):
    escrow = db.query(EscrowDB).filter(EscrowDB.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    return escrow
