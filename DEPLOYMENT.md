# 🚀 ULTRA-ARB GLOBAL - Production Deployment Guide

## Enterprise Authentication System Deployment

This guide covers the complete production deployment of ULTRA-ARB GLOBAL, a zero-dependency enterprise authentication system built with Bun 1.3.

---

## 📋 Prerequisites

### System Requirements
- **Bun Runtime**: 1.3.0+
- **Operating System**: Linux/macOS/Windows
- **Memory**: 512MB minimum, 1GB recommended
- **Storage**: 100MB for application, additional for SQLite database
- **Network**: HTTPS required for production (HttpOnly cookies)

### Security Requirements
- **HTTPS Certificate**: Required for HttpOnly cookie security
- **JWT Secret Key**: 32+ characters for HMAC-SHA256
- **Firewall**: Restrict access to necessary ports only
- **SSL/TLS**: TLS 1.3 recommended

---

## 🔧 Environment Configuration

### 1. Create Production Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your production values
nano .env
```

### 2. Required Environment Variables

```bash
# ===========================================
# SECURITY CONFIGURATION (REQUIRED)
# ===========================================

# JWT Secret Key - Generate securely
JWT_SECRET_KEY="$(openssl rand -hex 32)"

# Session Configuration
SESSION_COOKIE_NAME=ultra-arb-session
SESSION_MAX_AGE=86400000

# ===========================================
# TELEGRAM INTEGRATION (OPTIONAL)
# ===========================================

# Telegram Bot Token from @BotFather
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# Your Telegram chat ID for notifications
TELEGRAM_CHAT_ID=your-telegram-chat-id-here

# ===========================================
# DATABASE CONFIGURATION
# ===========================================

# SQLite Database Path
DATABASE_PATH=/var/lib/ultra-arb/data/ultra-arb.db

# ===========================================
# SERVER CONFIGURATION
# ===========================================

# Server Port
PORT=6969

# Environment (production for security hardening)
NODE_ENV=production

# HTTPS Configuration (REQUIRED for production)
FORCE_HTTPS=true

# ===========================================
# MONITORING & LOGGING
# ===========================================

# Enable detailed logging (false for production performance)
ENABLE_DEBUG_LOGGING=false

# Log level
LOG_LEVEL=info

# ===========================================
# PERFORMANCE TUNING
# ===========================================

# Maximum concurrent connections
MAX_CONNECTIONS=1247

# Request timeout in milliseconds
REQUEST_TIMEOUT=30000

# Rate limiting window in milliseconds
RATE_LIMIT_WINDOW=60000

# Maximum requests per window
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🐳 Docker Deployment (Recommended)

### Single Container Deployment

```bash
# Build the production image
docker build -f Dockerfile.ultra-arb -t ultra-arb-global:latest .

# Run the container
docker run -d \
  --name ultra-arb-global \
  --env-file .env \
  -p 6969:6969 \
  -v ultra-arb-data:/app/data \
  --restart unless-stopped \
  ultra-arb-global:latest
```

### Docker Compose Deployment (Full Stack)

```bash
# Start the complete stack with monitoring
docker-compose -f docker-compose.ultra-arb.yml up -d

# View service status
docker-compose -f docker-compose.ultra-arb.yml ps

# View logs
docker-compose -f docker-compose.ultra-arb.yml logs -f ultra-arb-global

# Scale the application
docker-compose -f docker-compose.ultra-arb.yml up -d --scale ultra-arb-global=3
```

### Docker Compose Services

- **ultra-arb-global**: Main authentication application
- **nginx**: Reverse proxy with SSL termination (optional)
- **prometheus**: Metrics collection (optional)
- **grafana**: Monitoring dashboard (optional)
- **loki**: Log aggregation (optional)
- **promtail**: Log shipping (optional)

---

## 🖥️ Direct Server Deployment

### 1. Install Bun Runtime

```bash
# Install Bun (choose your platform)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

### 2. Deploy Application

```bash
# Clone the repository
git clone https://github.com/brendadeeznuts1111/ultra-arb-global.git
cd ultra-arb-global

# Install dependencies
bun install --frozen-lockfile --production

# Create data directory
sudo mkdir -p /var/lib/ultra-arb/data
sudo chown -R $USER:$USER /var/lib/ultra-arb

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Start the application
bun run src/auth/login-handlers.ts
```

### 3. Process Management (systemd)

Create `/etc/systemd/system/ultra-arb.service`:

```ini
[Unit]
Description=ULTRA-ARB GLOBAL Authentication System
After=network.target

[Service]
Type=simple
User=ultra-arb
Group=ultra-arb
WorkingDirectory=/opt/ultra-arb-global
Environment=NODE_ENV=production
EnvironmentFile=/opt/ultra-arb-global/.env
ExecStart=/usr/local/bin/bun run src/auth/login-handlers.ts
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ultra-arb

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable ultra-arb

# Start service
sudo systemctl start ultra-arb

# Check status
sudo systemctl status ultra-arb

# View logs
sudo journalctl -u ultra-arb -f
```

---

## 🔒 Security Hardening

### SSL/TLS Configuration

```bash
# Generate self-signed certificate (for testing only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Use with nginx reverse proxy
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:6969;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Configuration

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 6969/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=6969/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### File Permissions

```bash
# Secure data directory
sudo chown -R ultra-arb:ultra-arb /var/lib/ultra-arb
sudo chmod 700 /var/lib/ultra-arb
sudo chmod 600 /var/lib/ultra-arb/data/ultra-arb.db

# Secure environment file
sudo chmod 600 .env
```

---

## 📊 Monitoring & Observability

### Health Checks

```bash
# Application health endpoint
curl -f https://your-domain.com/health

# Authentication status
curl -f https://your-domain.com/api/auth/status

# System metrics
curl -f https://your-domain.com/metrics
```

### Log Management

```bash
# View application logs
sudo journalctl -u ultra-arb -f

# Docker logs
docker-compose -f docker-compose.ultra-arb.yml logs -f ultra-arb-global

# Log rotation (logrotate)
sudo nano /etc/logrotate.d/ultra-arb
```

### Performance Monitoring

```bash
# Enable Prometheus metrics
echo "ENABLE_PROMETHEUS=true" >> .env
echo "METRICS_PORT=9090" >> .env

# Access metrics
curl http://localhost:9090/metrics
```

---

## 🔄 Backup & Recovery

### Database Backup

```bash
# Create backup script
cat > /usr/local/bin/ultra-arb-backup << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/ultra-arb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ultra-arb_$TIMESTAMP.db"

mkdir -p $BACKUP_DIR
sqlite3 /var/lib/ultra-arb/data/ultra-arb.db ".backup $BACKUP_FILE"
gzip $BACKUP_FILE

# Keep only last 30 backups
cd $BACKUP_DIR && ls -t *.db.gz | tail -n +31 | xargs -r rm
EOF

chmod +x /usr/local/bin/ultra-arb-backup
```

### Automated Backups

```bash
# Add to crontab for daily backups
sudo crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /usr/local/bin/ultra-arb-backup
```

### Recovery Procedure

```bash
# Stop the application
sudo systemctl stop ultra-arb

# Restore from backup
BACKUP_FILE=$(ls -t /var/backups/ultra-arb/*.db.gz | head -1)
gunzip -c $BACKUP_FILE > /var/lib/ultra-arb/data/ultra-arb.db

# Start the application
sudo systemctl start ultra-arb
```

---

## 🚀 Scaling & High Availability

### Horizontal Scaling

```bash
# Run multiple instances behind a load balancer
docker-compose -f docker-compose.ultra-arb.yml up -d --scale ultra-arb-global=3

# Configure nginx load balancer
upstream ultra_arb_backend {
    server localhost:6969;
    server localhost:6970;
    server localhost:6971;
}

server {
    listen 80;
    location / {
        proxy_pass http://ultra_arb_backend;
    }
}
```

### Session Management

For multiple instances, configure Redis for session storage:

```bash
# Add Redis to docker-compose.ultra-arb.yml
redis:
  image: redis:7-alpine
  volumes:
    - redis-data:/data

# Update environment
echo "REDIS_URL=redis://redis:6379" >> .env
```

---

## 🔧 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check environment variables
bun run -e "console.log(process.env)"

# Check file permissions
ls -la /var/lib/ultra-arb/data/

# Check Bun installation
bun --version
```

**Database connection errors:**
```bash
# Check database file
ls -la /var/lib/ultra-arb/data/ultra-arb.db

# Test SQLite connection
sqlite3 /var/lib/ultra-arb/data/ultra-arb.db "SELECT 1;"
```

**Authentication failures:**
```bash
# Check JWT secret key length
echo $JWT_SECRET_KEY | wc -c

# Verify cookie settings
curl -I https://your-domain.com/api/auth/status
```

### Performance Tuning

```bash
# Adjust connection limits
echo "MAX_CONNECTIONS=500" >> .env

# Enable caching
echo "ENABLE_CACHE=true" >> .env
echo "CACHE_TTL=300" >> .env

# Tune SQLite
echo "pragma journal_mode=WAL;" > /var/lib/ultra-arb/data/.sqliterc
echo "pragma synchronous=NORMAL;" >> /var/lib/ultra-arb/data/.sqliterc
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

```bash
# Weekly: Check system health
curl -f https://your-domain.com/health

# Weekly: Update dependencies
bun update

# Monthly: Security audit
bun audit

# Monthly: Backup verification
/usr/local/bin/ultra-arb-backup
ls -la /var/backups/ultra-arb/
```

### Monitoring Alerts

Set up alerts for:
- Application downtime
- High error rates (>5%)
- Performance degradation (>500ms response time)
- Disk space usage (>80%)
- Memory usage (>80%)

### Update Procedure

```bash
# Stop application
sudo systemctl stop ultra-arb

# Backup current version
cp -r /opt/ultra-arb-global /opt/ultra-arb-global.backup

# Update code
cd /opt/ultra-arb-global
git pull origin main
bun install --frozen-lockfile --production

# Start application
sudo systemctl start ultra-arb

# Verify health
curl -f https://your-domain.com/health

# Remove backup after 24 hours
# rm -rf /opt/ultra-arb-global.backup
```

---

## 🎯 Performance Benchmarks

### Expected Performance (Production Hardware)

- **Cold Start**: <10 seconds
- **JWT Generation**: <1ms per token
- **TOML Loading**: <1ms per config
- **Concurrent Users**: 1,247+ supported
- **Memory Usage**: ~150MB baseline
- **Response Time**: <3.2ms average

### Monitoring Commands

```bash
# Real-time metrics
curl http://localhost:9090/metrics

# Application performance
curl https://your-domain.com/api/auth/status

# System resources
htop
df -h
free -h
```

---

## 📝 Compliance & Security

### Security Checklist

- [ ] HTTPS enabled with valid certificate
- [ ] JWT secret key is 32+ characters
- [ ] HttpOnly cookies configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Audit logging enabled
- [ ] Regular security updates
- [ ] Backup encryption enabled

### Compliance Standards

- **GDPR**: Data minimization, consent management
- **SOC2**: Security controls, monitoring
- **ISO27001**: Information security management
- **PCI DSS**: Payment data protection (if applicable)

---

## 🚀 Next Steps

1. **Deploy to staging environment first**
2. **Run comprehensive testing**
3. **Configure monitoring and alerting**
4. **Set up automated backups**
5. **Document your specific configuration**
6. **Train your team on the system**

For additional support, refer to the [ULTRA-ARB GLOBAL README](ULTRA-ARB-GLOBAL-README.md) or create an issue in the repository.