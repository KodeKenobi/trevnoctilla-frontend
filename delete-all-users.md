# Delete All Users - Guide

## ⚠️ WARNING

This will **permanently delete ALL users** and their related data including:

- All user accounts
- All API keys
- All usage logs
- All reset history
- All notifications

## Local Database

### Option 1: Using the Python Script

```bash
cd trevnoctilla-backend
python delete_all_users.py
```

When prompted, type `DELETE ALL` to confirm.

### Option 2: Direct SQL (SQLite)

```bash
cd trevnoctilla-backend
sqlite3 instance/local.db <<EOF
DELETE FROM notifications;
DELETE FROM usage_logs;
DELETE FROM reset_history;
DELETE FROM api_keys;
DELETE FROM users;
EOF
```

### Option 3: Delete Database File (Fresh Start)

```bash
cd trevnoctilla-backend
rm instance/local.db
# Database will be recreated on next app start
```

## Production Database (Railway)

### Option 1: Using the Python Script

1. Set your Railway DATABASE_URL:

   ```bash
   export DATABASE_URL="your-railway-database-url"
   ```

2. Run the script:

   ```bash
   cd trevnoctilla-backend
   python delete_all_users.py
   ```

3. When prompted, type `DELETE ALL` to confirm.

### Option 2: Railway CLI

```bash
# Connect to Railway database
railway connect

# Then run SQL commands
# (Depends on your database type - PostgreSQL, MySQL, etc.)
```

### Option 3: Railway Dashboard

1. Go to your Railway project
2. Open the database service
3. Use the database console/query editor
4. Run:
   ```sql
   DELETE FROM notifications;
   DELETE FROM usage_logs;
   DELETE FROM reset_history;
   DELETE FROM api_keys;
   DELETE FROM users;
   ```

## Safety Notes

- **Backup first**: Always backup your database before deleting users
- **Double-check environment**: Make sure you're targeting the correct database
- **Confirm count**: The script shows how many users will be deleted before asking for confirmation
- **Cascade deletes**: API keys are automatically deleted when users are deleted (cascade)

## After Deletion

You may want to:

1. Create a new admin user:

   ```bash
   cd trevnoctilla-backend
   python create_fresh_user.py
   ```

2. Or register a new user through the API:
   ```bash
   curl -X POST https://your-api-url/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"securepassword"}'
   ```
