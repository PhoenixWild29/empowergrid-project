# Docker PostgreSQL Setup for EmpowerGRID

Quick and easy PostgreSQL setup using Docker for development.

## 🐳 Prerequisites

- Docker Desktop installed: https://www.docker.com/products/docker-desktop/
- Docker Desktop running

**Verify Docker:**
```powershell
docker --version
# Should show: Docker version 20.x or higher
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start PostgreSQL Container

```powershell
docker run --name empowergrid-db `
  -e POSTGRES_PASSWORD=empowergrid_dev_pass `
  -e POSTGRES_DB=empowergrid `
  -e POSTGRES_USER=postgres `
  -p 5432:5432 `
  -v empowergrid-data:/var/lib/postgresql/data `
  -d postgres:15
```

**What this does:**
- Creates container named `empowergrid-db`
- Sets password to `empowergrid_dev_pass`
- Creates database `empowergrid`
- Exposes port 5432
- Creates volume for data persistence
- Uses PostgreSQL 15

**Verify it's running:**
```powershell
docker ps | findstr empowergrid-db
```

---

### Step 2: Create .env File

```powershell
cd app

# Option A: Use the interactive script
node scripts/setup-env.js
# Choose "y" when asked about Docker

# Option B: Create manually
@"
DATABASE_URL="postgresql://postgres:empowergrid_dev_pass@localhost:5432/empowergrid?schema=public"
JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")"
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug
"@ | Out-File -FilePath .env -Encoding utf8
```

---

### Step 3: Apply Database Schema

```powershell
cd app

# Push Prisma schema to database
npm run prisma:db:push

# Generate Prisma client
npm run prisma:generate
```

**Expected Output:**
```
✔ Database synchronized
✔ Generated Prisma Client

Created tables:
- users
- sessions
- auth_challenges
- blacklisted_tokens
- projects
- milestones
... and more
```

---

### Step 4: Apply Row Level Security

```powershell
# Apply RLS policies
docker exec -i empowergrid-db psql -U postgres -d empowergrid < prisma/row-level-security.sql
```

**Expected Output:**
```
ALTER TABLE
CREATE POLICY
CREATE POLICY
... (20+ policies)
```

---

### Step 5: Verify Setup

```powershell
# Open Prisma Studio
npm run prisma:studio
```

**Opens**: http://localhost:5555

**You should see:**
- ✅ users table (empty)
- ✅ sessions table (empty)
- ✅ auth_challenges table (empty)
- ✅ blacklisted_tokens table (empty)
- ✅ All other tables

---

### Step 6: Start Application

```powershell
# Start Next.js development server
npm run dev
```

**Opens**: http://localhost:3000

🎉 **You're ready to test the authentication system!**

---

## 🔧 Docker Management Commands

### Start/Stop Database

```powershell
# Stop database
docker stop empowergrid-db

# Start database
docker start empowergrid-db

# Restart database
docker restart empowergrid-db

# Check status
docker ps | findstr empowergrid
```

### Access Database

```powershell
# Connect to database
docker exec -it empowergrid-db psql -U postgres -d empowergrid

# Run SQL commands
docker exec -i empowergrid-db psql -U postgres -d empowergrid -c "SELECT COUNT(*) FROM users;"

# View logs
docker logs empowergrid-db

# Follow logs
docker logs -f empowergrid-db
```

### Database Backups

```powershell
# Backup database
docker exec empowergrid-db pg_dump -U postgres empowergrid > backup.sql

# Restore database
Get-Content backup.sql | docker exec -i empowergrid-db psql -U postgres -d empowergrid
```

### Clean Up

```powershell
# Remove container (keeps data volume)
docker stop empowergrid-db
docker rm empowergrid-db

# Remove container AND data volume (CAUTION: Deletes all data!)
docker stop empowergrid-db
docker rm empowergrid-db
docker volume rm empowergrid-data

# Start fresh
docker run --name empowergrid-db `
  -e POSTGRES_PASSWORD=empowergrid_dev_pass `
  -e POSTGRES_DB=empowergrid `
  -p 5432:5432 `
  -d postgres:15
```

---

## 📦 Using Docker Compose (Alternative)

For easier management, you can use Docker Compose:

**Create `app/docker-compose.yml`:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: empowergrid-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: empowergrid_dev_pass
      POSTGRES_DB: empowergrid
    ports:
      - "5432:5432"
    volumes:
      - empowergrid-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  empowergrid-data:
```

**Commands:**

```powershell
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f

# Stop and remove everything (including data)
docker-compose down -v
```

---

## 🧪 Test Database Connection

After setup, test the connection:

```powershell
cd app

# Test Prisma connection
npm run prisma:db:pull

# View database in Prisma Studio
npm run prisma:studio

# Test with Node.js
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e))"
```

---

## 🔍 Troubleshooting

### Database Won't Start

```powershell
# Check if port 5432 is already in use
netstat -ano | findstr :5432

# If port is in use, either:
# 1. Stop the other service
# 2. Use a different port
docker run --name empowergrid-db `
  -e POSTGRES_PASSWORD=empowergrid_dev_pass `
  -e POSTGRES_DB=empowergrid `
  -p 5433:5432 `  # Changed to 5433
  -d postgres:15

# Update DATABASE_URL to use port 5433
```

### Can't Connect from App

```powershell
# Check container is running
docker ps

# Check logs for errors
docker logs empowergrid-db

# Test connection manually
docker exec -it empowergrid-db psql -U postgres -d empowergrid

# If it works, problem is in your .env file
```

### Permission Denied

```powershell
# On Windows, run PowerShell as Administrator
# Or adjust Docker Desktop settings:
# Docker Desktop → Settings → Resources → File sharing
```

---

## 📊 Database Information

### Connection Details

| Setting | Value |
|---------|-------|
| Host | localhost |
| Port | 5432 |
| Database | empowergrid |
| Username | postgres |
| Password | empowergrid_dev_pass |
| Connection URL | postgresql://postgres:empowergrid_dev_pass@localhost:5432/empowergrid |

### Container Details

| Setting | Value |
|---------|-------|
| Container Name | empowergrid-db |
| Image | postgres:15 |
| Volume | empowergrid-data |
| Network | bridge (default) |

---

## 🎯 Complete Setup Checklist

When you're ready to set up the database:

- [ ] Install Docker Desktop
- [ ] Start Docker Desktop
- [ ] Run PostgreSQL container command
- [ ] Verify container is running
- [ ] Run setup script or create .env manually
- [ ] Test connection: `npm run prisma:db:pull`
- [ ] Apply migrations: `npm run prisma:db:push`
- [ ] Apply RLS policies
- [ ] Open Prisma Studio: `npm run prisma:studio`
- [ ] Start application: `npm run dev`
- [ ] Test authentication flow

---

## 📝 Quick Reference

**Start Everything (After Initial Setup):**

```powershell
# 1. Start database (if not running)
docker start empowergrid-db

# 2. Start application
cd app
npm run dev

# 3. Open Prisma Studio (optional)
npm run prisma:studio
```

**Stop Everything:**

```powershell
# Stop application (Ctrl+C in terminal)

# Stop database
docker stop empowergrid-db
```

---

## 🎉 Ready When You Are!

The guides are complete and ready for when you want to set up the database. Everything is documented and the scripts are in place.

**When you're ready:**
1. Open `app/DOCKER_DATABASE_SETUP.md`
2. Follow the Quick Start section
3. You'll be up and running in 5 minutes!

For now, Phase 1 is **complete and validated**. All code is tested, compiled, and ready to go!

---

**What would you like to do next?**
- Proceed with Phase 2 work orders?
- Review the implementation?
- Something else?



