
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function debug() {
    try {
        await client.connect();

        console.log("--- TABLE: sentences ---");
        const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sentences'");
        console.table(cols.rows);

        const constraints = await client.query("SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'sentences'");
        console.table(constraints.rows);

        const count = await client.query("SELECT COUNT(*) FROM sentences");
        console.log("Count:", count.rows[0].count);

        if (parseInt(count.rows[0].count) > 0) {
            const duplicates = await client.query("SELECT text_ja, COUNT(*) FROM sentences GROUP BY text_ja HAVING COUNT(*) > 1");
            console.log("Duplicates:", duplicates.rows);
        }

    } catch (err: any) {
        console.error("DEBUG ERROR:", err.message);
    } finally {
        await client.end();
    }
}

debug();
