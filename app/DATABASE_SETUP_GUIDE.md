# Database Setup Guide for EmpowerGRID

This guide will help you set up PostgreSQL database integration for the Phase 1 authentication system.

## 📋 Prerequisites

You need PostgreSQL installed. Choose one of these options:

### Option 1: Local PostgreSQL (Windows)

**Download and Install:**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run installer (PostgreSQL 15 or higher recommended)
3. During installation:
   - Set a password for postgres user (remember this!)
   - Default port: 5432
   - Install pgAdmin (optional but helpful)

**Verify Installation:**
```powershell
psql --version
# Should show: psql (PostgreSQL) 15.x or higher
```

### Option 2: Docker (Recommended for Development)

```powershell
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name empowergrid-db `
  -e POSTGRES_PASSWORD=empowergrid_dev_pass `
  -e POSTGRES_DB=empowergrid `
  -p 5432:5432 `
  -d postgres:15

# Verify it's running
docker ps
```

### Option 3: Cloud Database (Production)

- **AWS RDS**: https://aws.amazon.com/rds/postgresql/
- **DigitalOcean**: https://www.digitalocean.com/products/managed-databases-postgresql
- **Heroku Postgres**: https://www.heroku.com/postgres
- **Supabase**: https://supabase.com (PostgreSQL + RLS built-in)

---

## 🔧 Step-by-Step Setup

### Step 1: Create the Database

**Option A: Using psql command line**

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE empowergrid;

# Create user (optional, recommended for production)
CREATE USER empowergrid_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE empowergrid TO empowergrid_user;

# Exit
\q
```

**Option B: Using pgAdmin**

1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name: `empowergrid`
4. Owner: postgres (or create new user)
5. Save

**Option C: Using Docker (already done)**

If you used Docker in prerequisites, the database is already created!

---

### Step 2: Configure Environment Variables

**Create `.env` file in the `app/` directory:**

```powershell
# Navigate to app directory
cd app

# Create .env file
New-Item -Path .env -ItemType File
```

**Add this content to `app/.env`:**

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/empowergrid?schema=public"

# JWT Configuration
JWT_SECRET="<GENERATE_SECURE_SECRET>"

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

**Replace these values:**
- `your_password` → Your PostgreSQL password
- `<GENERATE_SECURE_SECRET>` → Generate using command below

**Generate JWT Secret:**
```powershell
# Option 1: Using OpenSSL (if installed)
openssl rand -base64 64

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Option 3: Manual - any long random string (development only)
# Example: empowergrid-dev-secret-$(Get-Random)-$(Get-Date -Format "yyyyMMddHHmmss")
```

---

### Step 3: Verify Database Connection

```powershell
cd app

# Test connection
npm run prisma:db:pull
```

**Expected Output:**
```
✔ Introspected 0 models
```

This confirms Prisma can connect to your database!

---

### Step 4: Run Database Migrations

This creates all the tables, indexes, and constraints:

```powershell
# Option 1: Create and apply migration (recommended)
npm run prisma:migrate dev --name initial_auth_system

# Option 2: Push schema directly (quick, for development)
npm run prisma:db:push
```

**Expected Output:**
```
✔ Database now in sync with schema
✔ Generated Prisma Client

Tables created:
- users
- user_stats
- sessions
- auth_challenges
- blacklisted_tokens
- projects
- milestones
- fundings
- ... and more
```

---

### Step 5: Apply Row Level Security Policies

This adds database-level security:

```powershell
# Get your DATABASE_URL
$env:DATABASE_URL = "postgresql://postgres:your_password@localhost:5432/empowergrid"

# Apply RLS policies
psql $env:DATABASE_URL -f prisma/row-level-security.sql
```

**Expected Output:**
```
ALTER TABLE
ALTER TABLE
CREATE POLICY
CREATE POLICY
... (20+ policies created)
```

**Verify RLS:**
```sql
# Connect to database
psql $env:DATABASE_URL

# Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'sessions', 'auth_challenges', 'blacklisted_tokens');

# Should show rowsecurity = true for all tables
```

---

### Step 6: Generate Prisma Client

```powershell
npm run prisma:generate
```

**Expected Output:**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

---

### Step 7: Verify Database Setup

Open Prisma Studio to view your database:

```powershell
npm run prisma:studio
```

This opens a web interface at http://localhost:5555

**You should see:**
- ✅ users table (empty)
- ✅ sessions table (empty)
- ✅ auth_challenges table (empty)
- ✅ blacklisted_tokens table (empty)
- ✅ projects table (empty)
- ✅ ... all other tables

---

## ✅ Verification Checklist

After completing the steps above, verify:

- [ ] `.env` file created with DATABASE_URL
- [ ] `.env` file has JWT_SECRET
- [ ] PostgreSQL database exists
- [ ] `npm run prisma:db:pull` connects successfully
- [ ] Migrations applied (all tables created)
- [ ] RLS policies applied
- [ ] Prisma Studio shows all tables
- [ ] No errors in console

---

## 🧪 Test Database Connection

Create a simple test script:

```powershell
# Create test file
@"
import { prisma } from './lib/prisma';

async function testConnection() {
  try {
    await prisma.\$connect();
    console.log('✅ Database connected successfully');
    
    const userCount = await prisma.user.count();
    console.log(\`✅ User count: \${userCount}\`);
    
    await prisma.\$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();
"@ | Out-File -FilePath scripts\test-db.ts -Encoding utf8

# Run test
npx ts-node scripts/test-db.ts
```

**Expected Output:**
```
✅ Database connected successfully
✅ User count: 0
✅ Database disconnected
```

---

## 🚀 Next Steps After Database Setup

Once database is configured:

1. **Start Development Server:**
```powershell
npm run dev
```

2. **Test Authentication Flow:**
- Open http://localhost:3000
- Try wallet connection
- Test challenge generation
- Test login flow

3. **Monitor Logs:**
- Check `app/logs/app.log`
- Check `app/logs/error.log`
- Watch console output

---

## 🆘 Troubleshooting

### Issue: "Cannot connect to database"

**Check:**
1. PostgreSQL is running
   ```powershell
   # If using Docker
   docker ps | findstr empowergrid-db
   
   # If installed locally
   Get-Service -Name postgresql*
   ```

2. DATABASE_URL is correct
   - Check username, password, host, port, database name
   - Ensure no typos

3. Firewall not blocking
   - Allow port 5432
   - Check Windows Firewall settings

### Issue: "Database does not exist"

```powershell
# Create it
psql -U postgres -c "CREATE DATABASE empowergrid;"
```

### Issue: "Password authentication failed"

- Check password in DATABASE_URL matches PostgreSQL password
- Try connecting with psql first to verify credentials

### Issue: "Migration failed"

```powershell
# Reset database (CAUTION: Deletes all data)
npm run prisma:migrate reset

# Or push schema directly
npm run prisma:db:push --force-reset
```

---

## 📝 Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

**Examples:**

**Local Development:**
```
postgresql://postgres:password123@localhost:5432/empowergrid?schema=public
```

**Docker:**
```
postgresql://postgres:empowergrid_dev_pass@localhost:5432/empowergrid?schema=public
```

**Production (with SSL):**
```
postgresql://user:pass@db.example.com:5432/empowergrid?schema=public&sslmode=require
```

**With Connection Pooling:**
```
postgresql://user:pass@localhost:5432/empowergrid?schema=public&connection_limit=10
```

---

## 🎯 Quick Start Checklist

Follow these steps in order:

1. [ ] Install PostgreSQL or start Docker container
2. [ ] Create database: `CREATE DATABASE empowergrid;`
3. [ ] Create `app/.env` file
4. [ ] Add DATABASE_URL to .env
5. [ ] Generate JWT_SECRET and add to .env
6. [ ] Run: `npm run prisma:generate`
7. [ ] Run: `npm run prisma:db:push`
8. [ ] Run: `psql -f prisma/row-level-security.sql`
9. [ ] Verify: `npm run prisma:studio`
10. [ ] Test: `npm run dev`

---

## 📞 Need Help?

**Common Commands:**

```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start PostgreSQL service
Start-Service postgresql-x64-15

# Connect to database
psql -U postgres -d empowergrid

# View tables
psql -U postgres -d empowergrid -c "\dt"

# View schema
npm run prisma:studio
```

---

Let me know which setup option you'd like to use (Local PostgreSQL, Docker, or Cloud), and I can help you through the specific steps!




