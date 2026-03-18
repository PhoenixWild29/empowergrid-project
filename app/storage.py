from .models import Project, Milestone, Escrow, Investor

# In-memory storage - TODO: migrate to PostgreSQL
projects: dict[str, Project] = {}
milestones: dict[str, Milestone] = {}
escrows: dict[str, Escrow] = {}
investors: dict[str, Investor] = {}