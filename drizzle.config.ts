// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import 'dotenv/config'; // Ensure .env.local is loaded for Drizzle Kit
import "./src/types/env"; // Validate env vars

export default {
    out: './migrations',
    schema: './src/db/schema.ts',
    breakpoints: true,
    dbCredentials: {
        url: process.env.DATABASE_URL!, // Drizzle Kit needs this directly
        // authToken: process.env.DATABASE_AUTH_TOKEN, // Not directly used by generate for local, but good practice
    },
    dialect: 'sqlite', // Change to 'turso' if you want to target Turso features specifically
                       // but 'sqlite' works fine for schema generation compatible with Turso.
} satisfies Config; 