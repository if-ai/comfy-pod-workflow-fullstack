import { db } from "@/db/db";
import { runs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Helper function (can be moved to a lib file if used elsewhere)
// Adjust 'final_result' if your workflow output node has a different ID or you want to target a specific node_id
export function findOutputImageById(outputs: any[] | undefined, outputId: string = "final_result"): string | null {
    if (!outputs) return null;
    const outputNode = outputs.find(o => o.output_id === outputId || o.node_id === outputId); // Check both output_id and node_id
    // The actual image URL might be nested, e.g., outputNode.data.images[0].url
    return outputNode?.data?.images?.[0]?.url || null;
}


export async function POST(request: NextRequest) {
    let payload;
    try {
        payload = await request.json();
    } catch (error) {
        console.error("Webhook: Invalid JSON payload", error);
        return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    const { run_id, status, outputs, live_status, progress, event_type } = payload;

    if (!run_id) {
        console.error("Webhook: Missing run_id in payload");
        return NextResponse.json({ message: "Missing run_id" }, { status: 400 });
    }

    try {
        // Prepare data for potential DB update
        const updateData: Partial<typeof runs.$inferInsert> = {};

        if (live_status !== undefined) updateData.live_status = live_status;
        if (progress !== undefined) updateData.progress = progress;

        // If the run is successful and we get the final output
        if (event_type === "run.output" || (event_type === "run.updated" && status === "success")) {
            // Try to find the image URL using the correct node ID from your workflow
            const imageUrl = findOutputImageById(outputs, "343") || // Primary ID from workflow
                             findOutputImageById(outputs, "final_result") || // Fallback 1
                             findOutputImageById(outputs, "8"); // Fallback 2

            if (imageUrl) {
                updateData.image_url = imageUrl;
                console.log(`Webhook: Updating run ${run_id} with image URL: ${imageUrl}`);
            } else {
                console.log(`Webhook: Run ${run_id} ${status}, but final image URL not found in outputs.`);
            }
        }

        // If there's anything to update in the DB
        if (Object.keys(updateData).length > 0) {
            await db.update(runs)
                .set(updateData)
                .where(eq(runs.run_id, run_id));
            console.log(`Webhook: DB updated for run_id ${run_id} with data:`, updateData);
        }

        return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });

    } catch (error) {
        console.error(`Webhook: Error processing run_id ${run_id}:`, error);
        // Still return 200 to ComfyDeploy to prevent retries if it's an internal DB error,
        // but log it for debugging.
        return NextResponse.json({ message: "Webhook acknowledged, internal processing error" }, { status: 200 });
    }
} 