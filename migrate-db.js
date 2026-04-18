require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const db = require('./config/db');

async function migrate() {
  console.log('⏳ Syncing database schema with database.sql...');
  try {
    // 1. Read the master SQL schema file
    const sqlFilePath = path.join(__dirname, 'database.sql');
    const sqlFileContent = await fs.readFile(sqlFilePath, 'utf8');
    
    // 2. Get all CREATE TABLE statements from the file
    const createTableStatements = sqlFileContent.match(/CREATE TABLE[\s\S]+?;/g) || [];
    if (createTableStatements.length === 0) {
      console.log('No CREATE TABLE statements found in database.sql.');
      return;
    }

    // 3. Get existing tables from the database
    const [existingTablesRows] = await db.query('SHOW TABLES');
    const existingTables = existingTablesRows.map(row => Object.values(row)[0]);

    for (const statement of createTableStatements) {
      const tableNameMatch = statement.match(/CREATE TABLE IF NOT EXISTS `?(\w+)`?/);
      if (!tableNameMatch) continue;
      
      const tableName = tableNameMatch[1];

      // 4. If table doesn't exist, create it
      if (!existingTables.includes(tableName)) {
        console.log(`- Table '${tableName}' not found. Creating...`);
        await db.query(statement);
        console.log(`  ✅ Created table '${tableName}'.`);
        continue;
      }

      // 5. If table exists, check for missing columns
      console.log(`- Table '${tableName}' exists. Checking for missing columns...`);
      const columnDefsMatch = statement.match(/\(([\s\S]*)\)/);
      if (!columnDefsMatch) continue;

      const columnLines = columnDefsMatch[1].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('PRIMARY') && !l.startsWith('FOREIGN') && !l.startsWith('CONSTRAINT') && !l.startsWith('UNIQUE') && !l.startsWith(')'));
      
      const [existingColumnsRows] = await db.query(`DESCRIBE \`${tableName}\``);
      const existingColumns = existingColumnsRows.map(row => row.Field);
      
      let lastKnownColumn = existingColumns[0] || 'id';
      for (const colDefLine of columnLines) {
        const colNameMatch = colDefLine.match(/`?(\w+)`?/);
        if (!colNameMatch) continue;
        const columnName = colNameMatch[1];

        if (!existingColumns.includes(columnName)) {
          console.log(`  - Missing column '${columnName}'. Adding...`);
          const columnDefinition = colDefLine.replace(/,$/, '');
          await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${columnDefinition} AFTER \`${lastKnownColumn}\``);
          console.log(`    ✅ Added column '${columnName}'.`);
        }
        lastKnownColumn = columnName;
      }
    }

    console.log('\n🎉 Schema sync complete! Database is up to date.');

  } catch (err) {
    console.error('\n❌ Schema sync failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();