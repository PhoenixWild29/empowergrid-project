from pydantic import BaseModel, Field

class Investor(BaseModel):
    wallet_address: str
    funded_projects: list[str] = Field(default_factory=list)
    total_invested: float = Field(default=0.0)