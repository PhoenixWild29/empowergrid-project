from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..db_models import EscrowDB, InvestorDB, ProjectDB

router = APIRouter()

@router.get("/investors/{wallet}/portfolio", tags=["Investors"])
async def get_investor_portfolio(wallet: str, db: Session = Depends(get_db)):
    escrows = db.query(EscrowDB).filter(EscrowDB.funder_wallet == wallet).all()
    portfolio = {}
    for e in escrows:
        if e.project_id not in portfolio:
            portfolio[e.project_id] = 0.0
        portfolio[e.project_id] += e.amount
    projects = {}
    for proj_id in portfolio:
        proj = db.query(ProjectDB).filter(ProjectDB.id == proj_id).first()
        if proj:
            projects[proj_id] = proj
    return {
        "total_invested": sum(portfolio.values()),
        "projects": [{"project_id": k, "amount": v, "project": projects.get(k)} for k, v in portfolio.items()]
    }

@router.get("/investors/{wallet}/returns", tags=["Investors"])
async def get_investor_returns(wallet: str, db: Session = Depends(get_db)):
    investor = db.query(InvestorDB).filter(InvestorDB.wallet_address == wallet).first()
    total_invested = investor.total_invested if investor else 0.0
    returns = total_invested * 0.1  # Mock returns
    return {"total_invested": total_invested, "returns": returns}
