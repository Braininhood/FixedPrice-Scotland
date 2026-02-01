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

# Install Python 3.11 (requires deadsnakes PPA)
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

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

**Backend .env file** (copy-paste on server, then replace placeholders):

- **EC2 IP used below:** `13.134.11.158` (update if your instance IP differs).
- Get Supabase values from: Project Settings → API (URL, anon key, service_role key, JWT Secret) and Database (connection string / password).
- Generate JWT_SECRET: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`

```env
# ============================================
# REQUIRED
# ============================================
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-settings-api
SUPABASE_DB_PASSWORD=your-database-password-from-supabase-database-settings

# Database host (Supabase: db.YOUR_PROJECT_REF.supabase.co)
DB_HOST=db.YOUR_PROJECT_REF.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_NAME=postgres
DB_SSL_MODE=require
DB_SSL_CERT_PATH=backend/certs/prod-ca-2021.crt

OPENAI_API_KEY=sk-your-openai-api-key
JWT_SECRET=generate-with-python-secrets-token_urlsafe-32

# CORS: EC2 IP and optional domain (comma-separated, no spaces)
CORS_ORIGINS=http://13.134.11.158,http://ec2-13-134-11-158.eu-west-2.compute.amazonaws.com,https://yourdomain.com
CORS_ALLOW_LOCALHOST_WILDCARD=false

# ============================================
# EMAIL (required for invoices/alerts)
# ============================================
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@yourdomain.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_FROM_NAME=FixedPrice Scotland
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
USE_CREDENTIALS=True
VALIDATE_CERTS=True

# ============================================
# OPTIONAL
# ============================================
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_xxx
ZOOPLA_ENABLED=false

ENVIRONMENT=production
PORT=8000
```

```bash
# Test backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Create systemd service for backend
sudo nano /etc/systemd/system/fixedprice-backend.service
```

**Backend systemd service file** (use your actual app path; common: `/home/apps/fixedprice-scotland` or `/home/ubuntu/apps/fixedprice-scotland`):

```ini
[Unit]
Description=FixedPrice Scotland Backend API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/apps/fixedprice-scotland/backend
Environment="PATH=/home/apps/fixedprice-scotland/backend/venv/bin"
ExecStart=/home/apps/fixedprice-scotland/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
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

**Frontend .env.local file** (copy-paste on server, then replace placeholders):

- **EC2:** Use your instance public IP or DNS. Example below uses `13.134.11.158`.
- **Supabase:** Project Settings → API (URL + anon/public key).
- **Stripe:** Dashboard → Developers → API keys (publishable key). Optional if not using Stripe yet.
- **Google Maps:** Optional; only needed for map on listings. Get at [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.

```env
# Backend API – ONE URL only (no commas). Use your EC2 public IP or DNS, port 8000.
NEXT_PUBLIC_API_URL=http://13.134.11.158:8000/api/v1

# Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://oyqzmcsmigpekhmlzhoz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY_FROM_SUPABASE

# Stripe (optional; Dashboard → Developers → API keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx_or_pk_test_xxx

# Google Maps (optional; for listings map)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

```bash
# Rebuild with environment variables
npm run build

# Start with PM2
pm2 start npm --name "fixedprice-frontend" -- start
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu  # Follow instructions to enable PM2 on boot
```

---

## Nginx Configuration

### Step 1: Configure Nginx as Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/fixedprice-scotland
```

**Nginx configuration** (frontend on port 80 only; backend stays on port 8000 via uvicorn — do not have Nginx listen on 8000 or it will conflict with uvicorn):

```nginx
# Frontend (Next.js) – port 80
server {
    listen 80;
    server_name 13.134.11.158 ec2-13-134-11-158.eu-west-2.compute.amazonaws.com yourdomain.com;

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

### Self-signed SSL: redirect all traffic to HTTPS and restrict access

Using a self-signed certificate you can:
1. **Redirect all HTTP → HTTPS** so traffic is encrypted (browsers will show a one-time cert warning).
2. **Restrict access** so only allowed IPs can reach the app from the internet.

**Step 1 – Create self-signed cert**
```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/selfsigned.key \
  -out /etc/nginx/ssl/selfsigned.crt \
  -subj "/CN=13.134.11.158"
```

**Step 2 – Nginx: redirect HTTP → HTTPS and serve app over HTTPS**

Use this as your main site config (e.g. `/etc/nginx/sites-available/fixedprice-scotland`). Replace or merge with any existing `listen 80` block.
```nginx
# Redirect all HTTP to HTTPS
server {
    listen 80;
    server_name 13.134.11.158 ec2-13-134-11-158.eu-west-2.compute.amazonaws.com yourdomain.com;
    return 301 https://$host$request_uri;
}

# Frontend (Next.js) over HTTPS with self-signed cert
server {
    listen 443 ssl http2;
    server_name 13.134.11.158 ec2-13-134-11-158.eu-west-2.compute.amazonaws.com yourdomain.com;

    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;

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
```
Then:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Step 3 – Restrict access from the internet**

Allow only specific IPs to reach the app. Choose one of the following.

**Option A – UFW on the server (recommended)**  
Restrict ports 80 and 443 to your IP(s). SSH should already be restricted; add HTTP/HTTPS for the same IPs.
```bash
# Remove open 80/443 if you had them from anywhere
sudo ufw delete allow 80/tcp   # only if you had allow 80
sudo ufw delete allow 443/tcp # only if you had allow 443

# Allow 80 and 443 only from your IP (replace 1.2.3.4 with your IP or use a CIDR)
sudo ufw allow from 1.2.3.4 to any port 80 proto tcp
sudo ufw allow from 1.2.3.4 to any port 443 proto tcp

# Or allow a range, e.g. office: 203.0.113.0/24
# sudo ufw allow from 203.0.113.0/24 to any port 80 proto tcp
# sudo ufw allow from 203.0.113.0/24 to any port 443 proto tcp

sudo ufw status numbered
sudo ufw reload
```
Find your IP: from your machine run `curl -s ifconfig.me` or use [whatismyip.com](https://www.whatismyip.com/).

**Option B – AWS Security Group**  
In EC2 → Security Groups → your instance’s group → Edit inbound rules:

- **HTTP (80):** Source = `My IP` or a specific CIDR (e.g. `203.0.113.5/32`), not `0.0.0.0/0`.
- **HTTPS (443):** Same as 80.
- **SSH (22):** Keep restricted to your IP or VPN.

Remove any rule that allows 0.0.0.0/0 for 80 or 443 if you want access restricted.

**Step 4 – Frontend and Supabase**  
Set your app and Supabase to use **HTTPS** so OAuth and links use the same scheme:
- Frontend `.env.local`: `NEXT_PUBLIC_APP_URL=https://13.134.11.158`  
  If you previously used `NEXT_PUBLIC_FORCE_HTTP=true`, remove it or set it to `false`.
- Supabase Dashboard → Authentication → URL Configuration: **Site URL** = `https://13.134.11.158`, **Redirect URLs** include `https://13.134.11.158/**` and `https://13.134.11.158/oauth/consent`.

**Note:** Visitors will see a browser warning the first time (self-signed cert). They must choose “Advanced” → “Proceed to 13.134.11.158” once. For a trusted cert with no warning, use Let’s Encrypt (see “Setup SSL Certificate” above) when you have a domain.

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
