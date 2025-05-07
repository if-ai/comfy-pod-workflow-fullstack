import { db } from "@/db/db";
import { runs } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const authResult = await auth(); // Await here
    const userId = authResult.userId;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userRuns = await db
            .select()
            .from(runs)
            .where(eq(runs.user_id, userId))
            .orderBy(desc(runs.createdAt)); // Show newest first

        return NextResponse.json(userRuns);
    } catch (error) {
        console.error("Error fetching user runs:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 