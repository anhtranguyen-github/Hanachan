
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

async function runAuthSql() {
    console.log("🛠️ Running Auth Logic SQL on Cloud...");
    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        family: 4
    });

    try {
        await client.connect();
        const sqlPath = path.join(__dirname, '../dbsu/schema/10_auth_logic.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        await client.query(sql);
        console.log("✅ Auth Trigger & RLS Policies applied successfully!");
    } catch (err: any) {
        console.error("❌ Failed to apply Auth SQL:", err.message);
    } finally {
        await client.end();
    }
}

runAuthSql();
