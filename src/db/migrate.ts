// src/db/migrate.ts
import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import "dotenv/config"; // To load .env.local for migration script
import "../types/env"; // Validate env vars before migrating

async function main() {
    const dbClient = createClient({
        url: process.env.DATABASE_URL!,
        authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    const db = drizzle(dbClient);

    console.log("⏳ Running migrations...");
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Migrations completed.");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
}); 