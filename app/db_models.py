from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from .database import Base
import uuid

class ProjectDB(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_wallet = Column(String, nullable=False)
    total_funding = Column(Float, default=0.0)
    status = Column(String, default="active")
    created_at = Column(DateTime, server_default=func.now())

class MilestoneDB(Base):
    __tablename__ = "milestones"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey('projects.id'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")
    proof_url = Column(String, nullable=True)
    completed_at = Column(DateTime, nullable=True)

class EscrowDB(Base):
    __tablename__ = "escrows"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey('projects.id'), nullable=False)
    funder_wallet = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")
    tx_signature = Column(String, nullable=True)

class InvestorDB(Base):
    __tablename__ = "investors"
    wallet_address = Column(String, primary_key=True)
    total_invested = Column(Float, default=0.0)
