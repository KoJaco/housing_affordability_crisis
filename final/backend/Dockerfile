FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/

# Copy SQLite database (read-only, baked into image)
COPY src/db/database.sqlite ./src/db/database.sqlite

# Expose port
EXPOSE 8000

# Set environment variables
ENV DATABASE_URL="sqlite:///./src/db/database.sqlite"
ENV API_HOST="0.0.0.0"
ENV API_PORT="8000"

# Run FastAPI server
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

