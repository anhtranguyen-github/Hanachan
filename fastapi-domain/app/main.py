from fastapi import FastAPI
from .adapters.http.reading import router as reading_router

app = FastAPI(
    title="Hanachan Domain Service",
    description="Single Source of Truth for Hanachan Business Logic",
    version="0.1.0"
)

# Register routers
app.include_router(reading_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "fastapi-domain"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
