from pydantic import BaseModel, Field
from typing import Optional
import uuid

class Escrow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    funder_wallet: str
    amount: float
    status: str = Field(default="pending")  # pending, funded, released
    tx_signature: Optional[str] = Field(default=None)  # TODO: real Solana tx sig