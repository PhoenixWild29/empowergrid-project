# Database Setup Instructions

## Quick Setup Options

### Option 1: Supabase (Recommended - Fastest, Free)

1. Go to https://supabase.com and sign up (free account)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
5. Update `app/.env.local` with:
   ```
   DATABASE_URL="your-supabase-connection-string"
   ```

### Option 2: Install PostgreSQL Locally (Windows)

#### Using Winget (Windows Package Manager):
```powershell
winget install PostgreSQL.PostgreSQL
```

After installation:
- Default port: 5432
- You'll be prompted to set a password for the `postgres` user
- Remember this password!

#### Manual Installation:
1. Download from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Set password for `postgres` user
4. Default port: 5432

Then create the database:
```powershell
# Connect to PostgreSQL (you'll be prompted for password)
psql -U postgres

# In psql, run:
CREATE DATABASE empowergrid;
\q
```

### Option 3: Docker (If you install Docker Desktop)

```powershell
docker run --name empowergrid-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=empowergrid -p 5432:5432 -d postgres:15
```

## After Database is Set Up

Once you have a database connection string, update `app/.env.local`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/empowergrid?schema=public"
```

Then run:
```powershell
cd app
npm run prisma:generate
npm run prisma:db:push
npm run dev
```

