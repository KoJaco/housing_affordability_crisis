"""FastAPI application for Sydney Housing Data API."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import properties, analytics, quarterly

# Create FastAPI app
app = FastAPI(
    title="Sydney Housing Data API",
    description="API for querying Sydney property sales data.",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(properties.router)
app.include_router(analytics.router)
app.include_router(quarterly.router)


@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "name": "Sydney Housing Data API",
        "version": "1.0.0",
        "description": "API for querying Sydney property sales data",
        "endpoints": {
            "properties": "/api/properties",
            "analytics": "/api/analytics",
            "quarterly": "/api/quarterly",
            "docs": "/docs",
            "health": "/health"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
 