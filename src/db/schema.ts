// src/db/schema.ts
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

export const runs = sqliteTable("runs", {
    run_id: text("run_id").notNull().primaryKey(),
    user_id: text("user_id").notNull(), // From Clerk
    createdAt: integer("created_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`,
    ),
    image_url: text("image_url"), // To be updated by webhook
    // Storing inputs as JSON string. Adjust if you need more structured querying
    inputs: text("inputs", { mode: "json" }).$type<Record<string, any>>(),
    live_status: text("live_status"), // e.g., "running", "succeeded"
    progress: real("progress"), // e.g., 0.0 to 1.0
}); 