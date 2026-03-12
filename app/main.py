from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title=&quot;EmpowerGrid API&quot;,
    version=&quot;0.1.0&quot;,
    description=&quot;Backend API for Solana escrow milestones&quot;
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[&quot;*&quot;],
    allow_credentials=True,
    allow_methods=[&quot;*&quot;],
    allow_headers=[&quot;*&quot;],
)

@app.get(&quot;/&quot;)
async def root():
    return {
        &quot;message&quot;: &quot;EmpowerGrid API v0.1.0&quot;,
        &quot;docs&quot;: &quot;/docs&quot;
    }

if __name__ == &quot;__main__&quot;:
    import uvicorn
    uvicorn.run(app, host=&quot;0.0.0.0&quot;, port=int(os.getenv(&quot;PORT&quot;, 8000)))