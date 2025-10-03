# Database Migration Guide for AWS S3 Integration

This guide explains how to run database migrations for the AWS S3 integration in SimplyMedi.

## Overview

The migration adds S3-related fields to the `reports` table to support cloud storage integration while maintaining backward compatibility.

## Migration Files

- **Migration**: `migrations/20241201000001-add-s3-fields-to-reports.js`
- **Runner**: `scripts/migrate.js`

## What the Migration Does

### Adds New Fields to `reports` Table:
- `s3Key` (STRING, nullable) - S3 object key for the uploaded file
- `s3Bucket` (STRING, nullable) - S3 bucket name where the file is stored  
- `s3Url` (STRING, nullable) - S3 object URL for the uploaded file

### Modifies Existing Fields:
- `filePath` (STRING) - Made nullable since we'll use S3

### Adds Indexes:
- `reports_s3_key_idx` - Index on s3Key for performance
- `reports_user_s3_key_idx` - Composite index on userId and s3Key

### Adds Constraints:
- Check constraint ensuring either `filePath` or `s3Key` is present

## Prerequisites

1. **Database Connection**: Ensure your database is running and accessible
2. **Environment Variables**: Set up your `.env` file with database credentials
3. **Dependencies**: Install required packages

```bash
cd server
npm install
```

## Running Migrations

### 1. Check Migration Status
```bash
npm run migrate:status
```
This shows:
- Total migration files
- Completed migrations
- Pending migrations
- Detailed status of each migration

### 2. Run Pending Migrations
```bash
npm run migrate:up
```
This will:
- Connect to the database
- Create the migrations tracking table
- Run all pending migrations in order
- Mark migrations as completed

### 3. Rollback Migrations (if needed)
```bash
npm run migrate:down
```
This will:
- Rollback completed migrations in reverse order
- Remove migration tracking entries
- Restore original schema

## Migration Commands

| Command | Description |
|---------|-------------|
| `npm run migrate:status` | Show current migration status |
| `npm run migrate:up` | Run all pending migrations |
| `npm run migrate:down` | Rollback all completed migrations |
| `node scripts/migrate.js up` | Direct migration runner |
| `node scripts/migrate.js down` | Direct rollback runner |
| `node scripts/migrate.js status` | Direct status checker |

## Example Output

### Status Check
```
Checking migration status...
Database connection established successfully

Migration Status:
================
Total migration files: 1
Completed migrations: 0
Pending migrations: 1

Migration Details:
------------------
⏳ Pending - 20241201000001-add-s3-fields-to-reports.js
```

### Running Migrations
```
Starting database migrations...
Database connection established successfully
Migrations table created/verified
Found 0 completed migrations
Found 1 migration files
Found 1 pending migrations:
  - 20241201000001-add-s3-fields-to-reports.js

Running migration: 20241201000001-add-s3-fields-to-reports.js
Starting migration: Add S3 fields to reports table...
Migration completed successfully: S3 fields added to reports table
Migration 20241201000001-add-s3-fields-to-reports.js marked as completed
✅ Migration 20241201000001-add-s3-fields-to-reports.js completed successfully

🎉 All migrations completed successfully!
```

## Database Schema Changes

### Before Migration
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  fileName VARCHAR NOT NULL,
  originalFileName VARCHAR NOT NULL,
  filePath VARCHAR NOT NULL,  -- Required
  fileType VARCHAR NOT NULL,
  -- ... other fields
);
```

### After Migration
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  fileName VARCHAR NOT NULL,
  originalFileName VARCHAR NOT NULL,
  filePath VARCHAR,           -- Now optional
  s3Key VARCHAR,             -- New: S3 object key
  s3Bucket VARCHAR,          -- New: S3 bucket name
  s3Url VARCHAR,             -- New: S3 object URL
  fileType VARCHAR NOT NULL,
  -- ... other fields
);

-- New indexes
CREATE INDEX reports_s3_key_idx ON reports(s3Key);
CREATE INDEX reports_user_s3_key_idx ON reports(userId, s3Key);

-- New constraint
ALTER TABLE reports 
ADD CONSTRAINT reports_file_location_check 
CHECK (filePath IS NOT NULL OR s3Key IS NOT NULL);
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```
   **Solution**: Ensure PostgreSQL is running and credentials are correct

2. **Permission Denied**
   ```
   Error: permission denied for table reports
   ```
   **Solution**: Ensure database user has ALTER TABLE permissions

3. **Migration Already Exists**
   ```
   Error: duplicate key value violates unique constraint
   ```
   **Solution**: Check migration status and clean up if needed

4. **Constraint Violation**
   ```
   Error: check constraint "reports_file_location_check" is violated
   ```
   **Solution**: Ensure all existing records have either filePath or s3Key

### Debug Commands

```bash
# Test database connection
node -e "
const { sequelize } = require('./config/database');
sequelize.authenticate()
  .then(() => console.log('✅ Database connection successful'))
  .catch(err => console.error('❌ Database connection failed:', err))
  .finally(() => process.exit());
"

# Check table structure
node -e "
const { sequelize } = require('./config/database');
sequelize.query('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = \\'reports\\' ORDER BY ordinal_position')
  .then(([results]) => {
    console.log('Reports table structure:');
    results.forEach(col => console.log(\`  \${col.column_name}: \${col.data_type} (\${col.is_nullable === 'YES' ? 'nullable' : 'not null'})\`));
  })
  .catch(err => console.error('Error:', err))
  .finally(() => process.exit());
"
```

## Rollback Considerations

⚠️ **Warning**: Rolling back will remove S3 fields and make `filePath` required again. Ensure you have:
- Backed up your data
- Migrated any S3-stored files back to local storage
- Updated your application code to not rely on S3 fields

## Production Deployment

For production deployments:

1. **Backup Database**: Always backup before running migrations
2. **Test First**: Run migrations on staging environment first
3. **Monitor**: Watch for errors during migration
4. **Rollback Plan**: Have a rollback strategy ready

```bash
# Production migration
npm run migrate:status  # Check current state
npm run migrate:up      # Run migrations
npm run migrate:status  # Verify completion
```

## Migration History

The migration system tracks completed migrations in the `SequelizeMeta` table:

```sql
SELECT * FROM "SequelizeMeta" ORDER BY name;
```

This ensures migrations are only run once and can be properly rolled back.

## Support

If you encounter issues:

1. Check the migration status: `npm run migrate:status`
2. Review error logs for specific issues
3. Ensure database permissions are correct
4. Verify environment variables are set properly
5. Check that the database is accessible and running
