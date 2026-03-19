from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

# Include routers
from app.routes import auth, health, projects, milestones, escrow, investors  # noqa: E402

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="EmpowerGrid API",
    version="0.1.0",
    description="Backend API for Solana escrow milestones"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(milestones.router, prefix="/api")
app.include_router(escrow.router, prefix="/api")
app.include_router(investors.router, prefix="/api")

from app.database import engine
from app.db_models import Base
Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {
        "message": "EmpowerGrid API v0.1.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
