from fastapi import FastAPI
from app.config import APP_NAME
from app.routers import health, debug, candidates, ranking, jobs

app = FastAPI(title=APP_NAME)

app.include_router(health.router)
app.include_router(debug.router)
app.include_router(candidates.router)
app.include_router(ranking.router)
app.include_router(jobs.router)

@app.get("/")
def root():
    return {
        "service": APP_NAME,
        "message": "Recommendation service is running",
    }