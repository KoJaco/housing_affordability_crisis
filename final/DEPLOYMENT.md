# Deployment Guide for Fly.io

This guide covers deploying both the FastAPI backend (`property-api`) and React Router frontend (`property-web`) to Fly.io.

## Prerequisites

1. Install [Fly CLI](https://fly.io/docs/getting-started/installing-flyctl/)
2. Login to Fly.io: `fly auth login`
3. Ensure your SQLite database is built and located at `backend/src/db/database.sqlite`

## Architecture

- **property-api**: FastAPI backend serving JSON endpoints, running on port 8000
- **property-web**: React Router frontend, running on port 3000
- Both apps are configured for autoscaling (1-2 instances)
- SQLite database is baked into the backend Docker image (read-only)

## Deploy Backend (property-api)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create the Fly.io app (first time only):
   ```bash
   fly apps create property-api
   ```

3. Deploy:
   ```bash
   fly deploy
   ```

4. Get your backend URL:
   ```bash
   fly status
   ```
   The URL will be something like `https://property-api.fly.dev`

## Deploy Frontend (property-web)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Update the API URL in `fly.toml` if your backend URL is different:
   ```toml
   [env]
     API_BASE_URL = "https://property-api.fly.dev"
   ```

3. Create the Fly.io app (first time only):
   ```bash
   fly apps create property-web
   ```

4. Deploy:
   ```bash
   fly deploy
   ```

5. Get your frontend URL:
   ```bash
   fly status
   ```
   The URL will be something like `https://property-web.fly.dev`

## Configuration

### Backend Environment Variables

The backend uses these environment variables (set in `fly.toml`):
- `DATABASE_URL`: SQLite database path (baked into image)
- `API_HOST`: Server host (0.0.0.0)
- `API_PORT`: Server port (8000)

### Frontend Environment Variables

The frontend uses:
- `API_BASE_URL`: Backend API URL (set in `fly.toml`)
- `PORT`: Server port (3000)
- `NODE_ENV`: Set to "production"

## Autoscaling

Both apps are configured to autoscale between 1-2 instances:
- Minimum: 1 machine (always running)
- Maximum: 2 machines (scales up based on load)
- Auto-start/stop: Enabled for cost optimization

## Static Assets

- **Backend**: FastAPI can serve static assets from `backend/static/` directory (if it exists)
- **Frontend**: React Router serves static assets from the `public/` directory

## Health Checks

Both apps have health check endpoints:
- Backend: `https://property-api.fly.dev/health`
- Frontend: TCP health checks on ports 8000/3000

## Troubleshooting

### Check logs:
```bash
# Backend logs
cd backend && fly logs

# Frontend logs
cd frontend && fly logs
```

### SSH into a machine:
```bash
fly ssh console -a property-api
fly ssh console -a property-web
```

### Scale manually:
```bash
fly scale count 2 -a property-api
fly scale count 2 -a property-web
```

## Notes

- The SQLite database is read-only and baked into the backend image
- Both apps use shared CPU and 512MB RAM by default
- HTTPS is enforced on both apps
- CORS is configured to allow all origins (consider restricting in production)

