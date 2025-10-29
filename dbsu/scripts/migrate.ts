
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("❌ Missing DATABASE_URL in .env file");
    process.exit(1);
}

async function ensureDatabaseExists(connectionString: string) {
    const url = new URL(connectionString);
    const targetDb = url.pathname.slice(1);
    url.pathname = '/postgres';
    const tempClient = new Client({ connectionString: url.toString(), family: 4, ssl: { rejectUnauthorized: false } });
    try {
        await tempClient.connect();
        const res = await tempClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDb]);
        if (res.rowCount === 0) {
            console.log(`🔨 Database "${targetDb}" not found. Creating...`);
            await tempClient.query(`CREATE DATABASE ${targetDb}`);
            console.log(`✅ Database "${targetDb}" created.`);
        }
    } catch (err) {
        console.error("❌ Error ensuring database exists:", err);
    } finally {
        await tempClient.end();
    }
}

async function runMigrations() {
    await ensureDatabaseExists(databaseUrl!);
    const client = new Client({ connectionString: databaseUrl, family: 4, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log("🐘 Connected to PostgreSQL.");
        const schemaDir = path.join(__dirname, '../schema');
        const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
            console.log(`🚀 Executing ${file}...`);
            const sql = fs.readFileSync(path.join(schemaDir, file), 'utf-8');
            await client.query(sql);
        }
        console.log("🎉 Migrations complete!");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await client.end();
    }
}

runMigrations();
