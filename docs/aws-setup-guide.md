# AWS Setup & Deployment Guide

## Overview

This guide covers deploying FixedPrice Scotland on AWS Free Tier using:
- **Frontend:** Next.js on EC2 (or Amplify)
- **Backend:** FastAPI on EC2
- **Database:** Supabase (kept separate, easier to manage)

**AWS Free Tier Eligibility:**
- New AWS accounts get 12 months of free tier
- EC2: 750 hours/month of t2.micro or t3.micro
- Elastic Load Balancer: Free with EC2
- Route 53: Limited free queries
- CloudFront: Limited free data transfer

---

## AWS Account Setup

### Step 1: Create AWS Account
- [ ] Go to https://aws.amazon.com
- [ ] Click "Create an AWS Account"
- [ ] Follow signup process (requires credit card, but won't be charged if within free tier)
- [ ] Verify email and phone number
- [ ] Choose "Personal" account type

### Step 2: Set Up Billing Alerts
- [ ] Go to AWS Billing Dashboard
- [ ] Set up CloudWatch Billing Alerts
- [ ] Set alert at $1 (safety threshold)
- [ ] Configure email notifications

### Step 3: Create IAM User (Best Practice)
- [ ] Go to IAM Console
- [ ] Create new user: `fixedprice-deploy`
- [ ] Attach policies:
  - `AmazonEC2FullAccess`
  - `AmazonS3FullAccess`
  - `AmazonRoute53FullAccess`
  - `CloudFrontFullAccess` (optional)
- [ ] Create access keys
- [ ] Save Access Key ID and Secret Access Key securely
- [ ] Configure AWS CLI with credentials

---

## Architecture Options

### Option 1: Single EC2 Instance (Simplest for Free Tier)

**Structure:**
- One EC2 instance (t2.micro - free tier eligible)
- Nginx as reverse proxy
- PM2 for Node.js (frontend)
- Systemd service for Python (backend)
- Both services on same instance

**Pros:**
- ✅ Simplest setup
- ✅ Free tier eligible
- ✅ Lower resource usage

**Cons:**
- ❌ Single point of failure
- ❌ Less scalable
- ❌ Resource sharing

### Option 2: Separate EC2 Instances (Better for Production)

**Structure:**
- EC2 Instance 1: Frontend (t2.micro)
- EC2 Instance 2: Backend (t2.micro)
- Nginx on frontend as reverse proxy
- Load Balancer (if needed later)

**Pros:**
- ✅ Better isolation
- ✅ Independent scaling
- ✅ Better security

**Cons:**
- ⚠️ Uses more free tier hours (2 instances = faster depletion)
- ❌ More complex setup

**Recommendation:** Start with Option 1, scale to Option 2 later if needed.

---

## Option 1: Single EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Go to EC2 Console**
   - Navigate to EC2 Dashboard
   - Click "Launch Instance"

2. **Configure Instance:**
   - **Name:** `fixedprice-scotland`
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type:** t2.micro (Free tier eligible)
   - **Key Pair:** Create new key pair or use existing
     - Name: `fixedprice-keypair`
     - Save `.pem` file securely!

3. **Network Settings:**
   - Allow HTTPS (443) from anywhere (0.0.0.0/0)
   - Allow HTTP (80) from anywhere (0.0.0.0/0)
   - Allow SSH (22) from your IP only (for security)
   - Allow Custom TCP (8000) from anywhere (backend API)

4. **Storage:**
   - Keep default 8 GB (free tier eligible)

5. **Launch Instance**

### Step 2: Configure Security Group

- [ ] In EC2 Dashboard, go to Security Groups
- [ ] Find your instance's security group
- [ ] Edit inbound rules:
   - **HTTP (80):** 0.0.0.0/0
   - **HTTPS (443):** 0.0.0.0/0
   - **SSH (22):** Your IP only
   - **Custom TCP (8000):** 0.0.0.0/0 (backend API)
   - **Custom TCP (3000):** 0.0.0.0/0 (frontend dev, optional)

### Step 3: Get Elastic IP (Optional but Recommended)

- [ ] Go to Elastic IPs in EC2 Console
- [ ] Allocate Elastic IP
- [ ] Associate with your EC2 instance
- [ ] Note the IP address (you'll use this or configure domain)

---

## Server Setup (SSH into EC2)

### Step 1: Connect to EC2 Instance

```bash
# On Windows (PowerShell)
ssh -i fixedprice-keypair.pem ubuntu@<your-ec2-ip>

# On Mac/Linux
chmod 400 fixedprice-keypair.pem
ssh -i fixedprice-keypair.pem ubuntu@<your-ec2-ip>
```

### Step 2: Update System

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot  # Reboot if kernel updates
```

### Step 3: Install Required Software

```bash
# Install Node.js 20.x (for Next.js)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager for Node.js)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Certbot (for SSL certificates)
sudo apt install -y certbot python3-certbot-nginx

# Verify installations
node --version
npm --version
python3 --version
nginx -v
```

### Step 4: Configure Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 8000/tcp  # Backend API
sudo ufw enable
sudo ufw status
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
# Create app directory
cd /home/ubuntu
mkdir -p apps
cd apps

# Clone your repository
git clone <your-github-repo-url> fixedprice-scotland
cd fixedprice-scotland
```

### Step 2: Setup Backend

```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
nano .env
```

**Backend .env file:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://your-ec2-ip,https://yourdomain.com
ENVIRONMENT=production
PORT=8000
```

```bash
# Test backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Create systemd service for backend
sudo nano /etc/systemd/system/fixedprice-backend.service
```

**Backend systemd service file:**
```ini
[Unit]
Description=FixedPrice Scotland Backend API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/apps/fixedprice-scotland/backend
Environment="PATH=/home/ubuntu/apps/fixedprice-scotland/backend/venv/bin"
ExecStart=/home/ubuntu/apps/fixedprice-scotland/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start backend service
sudo systemctl daemon-reload
sudo systemctl enable fixedprice-backend
sudo systemctl start fixedprice-backend
sudo systemctl status fixedprice-backend
```

### Step 3: Setup Frontend

```bash
cd /home/ubuntu/apps/fixedprice-scotland/frontend

# Install dependencies
npm install

# Build Next.js app
npm run build

# Create .env.local file
nano .env.local
```

**Frontend .env.local file:**
```env
NEXT_PUBLIC_API_URL=http://your-ec2-ip:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

```bash
# Rebuild with environment variables
npm run build

# Start with PM2
pm2 start npm --name "fixedprice-frontend" -- start
pm2 save
pm2 startup  # Follow instructions to enable PM2 on boot
```

---

## Nginx Configuration

### Step 1: Configure Nginx as Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/fixedprice-scotland
```

**Nginx configuration:**
```nginx
# Frontend (Next.js)
server {
    listen 80;
    server_name your-ec2-ip yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 8000;
    server_name your-ec2-ip yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fixedprice-scotland /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 2: Setup SSL Certificate (Let's Encrypt)

```bash
# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure Nginx for HTTPS
# Certificates auto-renew (configured by certbot)
```

**Update Nginx config for HTTPS:**
```nginx
# Frontend with SSL
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API with SSL
server {
    listen 8443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Domain Configuration (Optional)

### Option 1: Route 53 (AWS DNS)

1. **Register or Transfer Domain:**
   - Go to Route 53 Console
   - Register new domain or transfer existing

2. **Create Hosted Zone:**
   - Create hosted zone for your domain
   - Note the name servers

3. **Update Name Servers:**
   - Update your domain's name servers with your registrar

4. **Create A Record:**
   - Create A record pointing to your Elastic IP
   - Create CNAME for www subdomain
   - Create A record for api subdomain

### Option 2: External DNS Provider

1. **Point Domain to EC2:**
   - Add A record pointing to Elastic IP
   - Add CNAME for www
   - Add A record for api subdomain

2. **Update Environment Variables:**
   - Update `CORS_ORIGINS` in backend `.env`
   - Update `NEXT_PUBLIC_API_URL` in frontend `.env.local`

---

## Monitoring & Maintenance

### Step 1: Setup CloudWatch (Optional)

```bash
# Install CloudWatch agent (optional, for detailed monitoring)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### Step 2: Application Logs

```bash
# Backend logs
sudo journalctl -u fixedprice-backend -f

# Frontend logs (PM2)
pm2 logs fixedprice-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Step 3: Update Application

```bash
cd /home/ubuntu/apps/fixedprice-scotland

# Pull latest changes
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart fixedprice-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart fixedprice-frontend
```

---

## Cost Optimization

### Free Tier Limits:
- **EC2:** 750 hours/month (31 days = 744 hours = 1 instance always on)
- **Elastic IP:** Free when attached to running instance
- **Data Transfer:** 100 GB out per month free
- **Storage:** 30 GB EBS free

### Cost Management:
- [ ] Use t2.micro (free tier eligible)
- [ ] Monitor usage in AWS Cost Explorer
- [ ] Set up billing alerts
- [ ] Stop instance when not in use (development)
- [ ] Use Elastic IP only when needed

---

## Troubleshooting

### Backend Not Starting
```bash
# Check status
sudo systemctl status fixedprice-backend

# Check logs
sudo journalctl -u fixedprice-backend -n 50

# Check if port is in use
sudo netstat -tlnp | grep 8000
```

### Frontend Not Starting
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs fixedprice-frontend

# Restart
pm2 restart fixedprice-frontend
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Connection Issues
```bash
# Check security group rules
# Check firewall (UFW)
sudo ufw status

# Test ports
curl http://localhost:3000
curl http://localhost:8000/api/v1/health
```

---

## Security Checklist

- [x] Security group restricts SSH to your IP only
- [x] Firewall (UFW) enabled and configured
- [x] SSL certificates installed (HTTPS only)
- [x] Environment variables secured (.env files)
- [x] Regular system updates
- [x] Non-root user for applications (ubuntu)
- [x] Strong key pair for SSH
- [x] Regular application updates

---

## Quick Reference

**SSH Connection:**
```bash
ssh -i fixedprice-keypair.pem ubuntu@<ec2-ip>
```

**Service Management:**
```bash
# Backend
sudo systemctl start/stop/restart fixedprice-backend
sudo systemctl status fixedprice-backend

# Frontend
pm2 start/stop/restart fixedprice-frontend
pm2 status

# Nginx
sudo systemctl start/stop/restart nginx
```

**Application Directories:**
```
/home/ubuntu/apps/fixedprice-scotland/
├── backend/
├── frontend/
└── logs/
```

---

## Next Steps

1. ✅ Deploy application following this guide
2. ✅ Test all endpoints
3. ✅ Setup monitoring
4. ✅ Configure domain (if using)
5. ✅ Setup automated backups
6. ✅ Document deployment process for team
