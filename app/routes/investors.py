from fastapi import APIRouter
from ..storage import investors, projects, escrows

router = APIRouter()

@router.get("/investors/{wallet}/portfolio", tags=["Investors"])
async def get_investor_portfolio(wallet: str):
    if wallet not in investors:
        return {"funded_projects": [], "total_invested": 0.0}
    investor = investors[wallet]
    portfolio = []
    for proj_id in investor.funded_projects:
        if proj_id in projects:
            project = projects[proj_id]
            amount = sum(e.amount for e in escrows.values() if e.project_id == proj_id and e.funder_wallet == wallet)
            portfolio.append({"project": project, "amount": amount})
    return {"portfolio": portfolio, "total_invested": investor.total_invested}

@router.get("/investors/{wallet}/returns", tags=["Investors"])
async def get_investor_returns(wallet: str):
    if wallet not in investors:
        return {"total_invested": 0.0, "returns": 0.0}  # TODO: calculate actual returns
    investor = investors[wallet]
    # Mock returns, e.g., 10% on invested
    returns = investor.total_invested * 0.1
    return {"total_invested": investor.total_invested, "returns": returns}