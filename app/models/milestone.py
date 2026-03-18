from pydantic import BaseModel, Field
import uuid
import datetime

class Milestone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    description: str
    amount: float
    status: str = Field(default="pending")  # pending, completed, released
    proof_url: str | None = Field(default=None)
    completed_at: datetime.datetime | None = Field(default=None)