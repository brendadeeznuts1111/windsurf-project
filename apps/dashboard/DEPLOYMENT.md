# 🚀 Bun Dashboard Deployment Guide

This guide covers deploying the Bun Dashboard to production using Fly.io, which provides excellent support for Bun applications.

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install the Fly CLI tool
   ```bash
   # macOS
   brew install flyctl

   # Linux
   curl -L https://fly.io/install.sh | sh

   # Windows
   powershell -c "iwr https://fly.io/install.ps1 -useb | iex"
   ```

3. **Bun**: Ensure Bun v1.3.4+ is installed
4. **Docker**: Required for containerized deployment

## Quick Deployment

### 1. Authenticate with Fly.io
```bash
fly auth login
```

### 2. Initialize Fly App
```bash
cd apps/dashboard
fly launch --name bun-dashboard --region iad
```

### 3. Deploy
```bash
fly deploy
```

## Manual Deployment Steps

### Step 1: Initialize Fly App
```bash
cd apps/dashboard
fly apps create bun-dashboard --org personal
```

### Step 2: Configure Database (Optional)
If using a persistent database:
```bash
# Create PostgreSQL database
fly postgres create --name bun-dashboard-db

# Attach to app
fly postgres attach bun-dashboard-db --app bun-dashboard
```

### Step 3: Set Environment Variables
```bash
# Set production environment
fly secrets set NODE_ENV=production
fly secrets set DATABASE_URL=your_database_url_here

# Optional: Set custom domain
fly secrets set ALLOWED_HOSTS=yourdomain.com
```

### Step 4: Deploy Application
```bash
fly deploy
```

### Step 5: Check Deployment Status
```bash
# Check app status
fly status

# View logs
fly logs

# Check health
curl https://bun-dashboard.fly.dev/health
```

## Configuration Files

### fly.toml
The `fly.toml` file contains the deployment configuration:
- Uses Docker for containerization
- Configures health checks
- Sets up routing for API and static assets
- Optimizes for Bun runtime

### Dockerfile
Multi-stage build process:
1. **Frontend Build**: Compiles React app with Vite
2. **Runtime**: Uses Bun slim image for production
3. **Security**: Runs as non-root user
4. **Health Checks**: Built-in health monitoring

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `DATABASE_URL` | Database connection | `:memory:` |

## Health Checks

The application includes comprehensive health checks:
- **HTTP Health Check**: `/health` endpoint
- **Database Connectivity**: Automatic DB health verification
- **Container Health**: Docker health checks

## Monitoring & Logs

### View Application Logs
```bash
fly logs
```

### Monitor Performance
```bash
# Check app status
fly status

# View metrics
fly metrics

# Check health
fly checks list
```

### Scale Application
```bash
# Scale to 2 instances
fly scale count 2

# Scale memory
fly scale memory 1024
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   fly logs --app bun-dashboard

   # Rebuild locally
   docker build -t bun-dashboard .
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   fly postgres status --app bun-dashboard-db

   # Reset database URL
   fly secrets set DATABASE_URL=your_new_db_url
   ```

3. **Health Check Failures**
   ```bash
   # Check health endpoint
   curl https://bun-dashboard.fly.dev/health

   # View detailed logs
   fly logs --instance <instance-id>
   ```

### Rollback Deployment
```bash
# List releases
fly releases

# Rollback to previous version
fly releases rollback <version>
```

## Performance Optimization

### CDN Integration
```bash
# Use Fly's built-in CDN
fly certs create yourdomain.com
```

### Caching Strategies
- Static assets cached for 1 year
- API responses use appropriate cache headers
- Database queries optimized with prepared statements

### Monitoring
- Built-in performance metrics at `/api/metrics`
- CPU profiling available via `bun --cpu-prof`
- Memory usage monitoring

## Security Considerations

- **HTTPS Only**: All traffic forced to HTTPS
- **CORS**: Properly configured for API access
- **Environment Variables**: Sensitive data stored as secrets
- **Non-root User**: Container runs as unprivileged user
- **Minimal Base Image**: Uses slim Bun runtime

## Cost Optimization

- **Auto-scaling**: Scales to zero when inactive
- **Shared CPUs**: Cost-effective for development/demo apps
- **Regional Deployment**: Deploy close to users
- **Resource Limits**: Configured for optimal performance/cost ratio

## Next Steps

1. **Custom Domain**: Set up your own domain
2. **SSL Certificates**: Automatic with custom domains
3. **Backup Strategy**: Configure database backups
4. **CI/CD Pipeline**: Automate deployments
5. **Monitoring**: Set up alerts and dashboards

## Support

- **Fly.io Docs**: https://fly.io/docs
- **Bun Runtime**: https://bun.sh/docs
- **Community**: https://github.com/sst/opencode

---

**🎉 Your Bun Dashboard is now deployed and ready for production use!**