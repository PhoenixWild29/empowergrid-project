from pydantic import BaseModel, Field
import uuid
import datetime

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    owner_wallet: str
    total_funding: float = Field(default=0.0)
    status: str = Field(default="active")  # active, completed, cancelled
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)