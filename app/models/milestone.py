from pydantic import BaseModel, Field
from typing import Optional
import uuid
import datetime

class Milestone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    description: str
    amount: float
    status: str = Field(default="pending")  # pending, completed, released
    proof_url: Optional[str] = Field(default=None)
    completed_at: Optional[datetime.datetime] = Field(default=None)