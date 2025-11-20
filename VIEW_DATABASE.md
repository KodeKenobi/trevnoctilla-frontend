# How to View Your Database

## Railway Database (Production)

### Option 1: Railway Dashboard (Like Supabase)

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project: **Trevnoctilla**
3. Click on your **web** service
4. Go to the **Variables** tab to see your `DATABASE_URL`
5. If you have a PostgreSQL database service, click on it to view:
   - **Data** tab - View tables and data
   - **Query** tab - Run SQL queries
   - **Metrics** tab - Database performance

### Option 2: API Endpoint (Easiest)

Use the view database endpoint through your frontend domain (Next.js proxies to backend):

```powershell
# Use your frontend domain - Next.js rewrites proxy to backend
Invoke-RestMethod -Uri 'https://trevnoctilla.com/test/view-database' -Method Get | ConvertTo-Json -Depth 10
```

Or in browser:

```
https://trevnoctilla.com/test/view-database
```

### Option 3: Railway CLI

```bash
# Connect to database (if PostgreSQL)
railway connect

# Or view variables to get connection string
railway variables
```

### Option 4: External Database Tool

If using PostgreSQL:

1. Get your `DATABASE_URL` from Railway variables
2. Use a tool like:
   - **pgAdmin** (Desktop)
   - **DBeaver** (Desktop)
   - **TablePlus** (Desktop)
   - **Postico** (Mac)
   - **DataGrip** (JetBrains)

Connect using the connection string from `DATABASE_URL`

## Local Database (SQLite)

### Option 1: Python Script

```bash
cd trevnoctilla-backend
python view_database.py
```

### Option 2: SQLite Browser

1. Install [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open the database file:
   - `trevnoctilla-backend/instance/trevnoctilla_api.db` (or `local.db`)

### Option 3: Command Line

```bash
cd trevnoctilla-backend/instance
sqlite3 trevnoctilla_api.db

# Then run SQL commands:
.tables                    # List all tables
SELECT * FROM users;       # View all users
SELECT * FROM api_keys;    # View all API keys
.quit                      # Exit
```

### Option 4: VS Code Extension

Install the **SQLite Viewer** extension in VS Code, then open the `.db` file.

## Quick Database Queries

### View All Users

```sql
SELECT id, email, role, is_active, subscription_tier, created_at FROM users;
```

### Count Users

```sql
SELECT COUNT(*) FROM users;
```

### View User by Email

```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

### View API Keys

```sql
SELECT id, user_id, LEFT(key, 20) as key_prefix, created_at FROM api_keys;
```

## Database Type Detection

Your app uses:

- **Local**: SQLite (default: `trevnoctilla_api.db`)
- **Production**: Check `DATABASE_URL` variable in Railway
  - If starts with `postgres://` → PostgreSQL
  - If starts with `sqlite://` → SQLite

## Recommended: Use the API Endpoint

The easiest way is to use the `/test/view-database` endpoint which works for both local and production:

```powershell
# Production (use your frontend domain - Next.js proxies to backend)
Invoke-RestMethod -Uri 'https://trevnoctilla.com/test/view-database' | ConvertTo-Json -Depth 10

# Local (direct backend access)
Invoke-RestMethod -Uri 'http://localhost:5000/test/view-database' | ConvertTo-Json -Depth 10
```
