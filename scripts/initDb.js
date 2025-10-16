const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'db', 'business.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');
const SEED_PATH = path.join(__dirname, '..', 'db', 'seed.sql');

function runSqlFile(db, filePath) {
  const statements = fs.readFileSync(filePath, 'utf-8');
  return new Promise((resolve, reject) => {
    db.exec(statements, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function init() {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = new sqlite3.Database(DB_PATH);

  try {
    await runSqlFile(db, SCHEMA_PATH);
    await runSqlFile(db, SEED_PATH);
    console.log('Base de données initialisée avec succès.');
  } catch (error) {
    console.error('Échec de l\'initialisation de la base de données:', error);
  } finally {
    db.close();
  }
}

init();
