import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const COMFY_API_BASE_URL = "https://api.comfydeploy.com";

export async function GET(
    request: NextRequest,
    { params }: { params: { run_id: string } }
) {
    const authResult = await auth(); // Await here
    const userId = authResult.userId;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // In a real app, you might want to also check if this run_id belongs to the userId by querying your DB.
    // For simplicity, we'll skip that here but it's a good security practice.

    const { run_id } = params;
    if (!run_id) {
        return NextResponse.json({ error: "Missing run_id" }, { status: 400 });
    }

    try {
        const apiResponse = await fetch(`${COMFY_API_BASE_URL}/api/run/${run_id}?queue_position=true`, {
            headers: {
                'Authorization': `Bearer ${process.env.COMFY_DEPLOY_API_KEY}`
            }
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            return NextResponse.json({ error: `Failed to fetch run status: ${errorText}` }, { status: apiResponse.status });
        }

        const jsonData = await apiResponse.json();
        // Extract only the fields needed by the frontend ImageGenerationResult component
        const { live_status, status, outputs, progress, queue_position } = jsonData;
        return NextResponse.json({ live_status, status, outputs, progress, queue_position });

    } catch (error) {
        console.error("Error fetching ComfyDeploy run status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 