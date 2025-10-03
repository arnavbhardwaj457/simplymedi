const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_URL || {
    database: process.env.DB_NAME || 'medimind',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Arnav457@',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Migration tracking table
const MIGRATIONS_TABLE = 'SequelizeMeta';

async function createMigrationsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      )
    `);
    console.log('Migrations table created/verified');
  } catch (error) {
    console.error('Error creating migrations table:', error);
    throw error;
  }
}

async function getCompletedMigrations() {
  try {
    const [results] = await sequelize.query(`SELECT name FROM "${MIGRATIONS_TABLE}" ORDER BY name`);
    return results.map(row => row.name);
  } catch (error) {
    console.error('Error getting completed migrations:', error);
    return [];
  }
}

async function markMigrationAsCompleted(migrationName) {
  try {
    await sequelize.query(`INSERT INTO "${MIGRATIONS_TABLE}" (name) VALUES (?)`, {
      replacements: [migrationName]
    });
    console.log(`Migration ${migrationName} marked as completed`);
  } catch (error) {
    console.error(`Error marking migration ${migrationName} as completed:`, error);
    throw error;
  }
}

async function removeMigrationFromCompleted(migrationName) {
  try {
    await sequelize.query(`DELETE FROM "${MIGRATIONS_TABLE}" WHERE name = ?`, {
      replacements: [migrationName]
    });
    console.log(`Migration ${migrationName} removed from completed list`);
  } catch (error) {
    console.error(`Error removing migration ${migrationName} from completed:`, error);
    throw error;
  }
}

async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found');
    return [];
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort();
  
  return files.map(file => ({
    name: file,
    path: path.join(migrationsDir, file)
  }));
}

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Create migrations table
    await createMigrationsTable();
    
    // Get completed migrations
    const completedMigrations = await getCompletedMigrations();
    console.log(`Found ${completedMigrations.length} completed migrations`);
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      migration => !completedMigrations.includes(migration.name)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations found');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations:`);
    pendingMigrations.forEach(migration => console.log(`  - ${migration.name}`));
    
    // Run pending migrations
    for (const migration of pendingMigrations) {
      console.log(`\nRunning migration: ${migration.name}`);
      
      try {
        const migrationModule = require(migration.path);
        
        if (typeof migrationModule.up !== 'function') {
          throw new Error(`Migration ${migration.name} does not export an 'up' function`);
        }
        
        await migrationModule.up(sequelize.getQueryInterface(), Sequelize);
        await markMigrationAsCompleted(migration.name);
        
        console.log(`✅ Migration ${migration.name} completed successfully`);
        
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration process failed:', error);
    throw error;
  }
}

async function rollbackMigrations() {
  try {
    console.log('Starting migration rollback...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Get completed migrations
    const completedMigrations = await getCompletedMigrations();
    
    if (completedMigrations.length === 0) {
      console.log('No completed migrations found to rollback');
      return;
    }
    
    console.log(`Found ${completedMigrations.length} completed migrations`);
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    
    // Find migrations to rollback (in reverse order)
    const migrationsToRollback = completedMigrations
      .filter(name => migrationFiles.some(file => file.name === name))
      .reverse();
    
    if (migrationsToRollback.length === 0) {
      console.log('No migrations found to rollback');
      return;
    }
    
    console.log(`Rolling back ${migrationsToRollback.length} migrations:`);
    migrationsToRollback.forEach(migration => console.log(`  - ${migration.name}`));
    
    // Rollback migrations
    for (const migrationName of migrationsToRollback) {
      console.log(`\nRolling back migration: ${migrationName}`);
      
      try {
        const migrationFile = migrationFiles.find(file => file.name === migrationName);
        const migrationModule = require(migrationFile.path);
        
        if (typeof migrationModule.down !== 'function') {
          throw new Error(`Migration ${migrationName} does not export a 'down' function`);
        }
        
        await migrationModule.down(sequelize.getQueryInterface(), Sequelize);
        await removeMigrationFromCompleted(migrationName);
        
        console.log(`✅ Migration ${migrationName} rolled back successfully`);
        
      } catch (error) {
        console.error(`❌ Rollback of ${migrationName} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('\n🎉 All migrations rolled back successfully!');
    
  } catch (error) {
    console.error('Rollback process failed:', error);
    throw error;
  }
}

async function showStatus() {
  try {
    console.log('Checking migration status...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Get completed migrations
    const completedMigrations = await getCompletedMigrations();
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    
    console.log('\nMigration Status:');
    console.log('================');
    console.log(`Total migration files: ${migrationFiles.length}`);
    console.log(`Completed migrations: ${completedMigrations.length}`);
    console.log(`Pending migrations: ${migrationFiles.length - completedMigrations.length}`);
    
    if (migrationFiles.length > 0) {
      console.log('\nMigration Details:');
      console.log('------------------');
      
      migrationFiles.forEach(migration => {
        const isCompleted = completedMigrations.includes(migration.name);
        const status = isCompleted ? '✅ Completed' : '⏳ Pending';
        console.log(`${status} - ${migration.name}`);
      });
    }
    
  } catch (error) {
    console.error('Status check failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'up':
        await runMigrations();
        break;
      case 'down':
        await rollbackMigrations();
        break;
      case 'status':
        await showStatus();
        break;
      default:
        console.log('Usage: node migrate.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  up      - Run pending migrations');
        console.log('  down    - Rollback completed migrations');
        console.log('  status  - Show migration status');
        console.log('');
        console.log('Examples:');
        console.log('  node migrate.js up');
        console.log('  node migrate.js down');
        console.log('  node migrate.js status');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration command failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runMigrations,
  rollbackMigrations,
  showStatus
};
