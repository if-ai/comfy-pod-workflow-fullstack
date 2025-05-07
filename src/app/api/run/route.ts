import { db } from "@/db/db";
import { runs } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { promises as fs } from 'node:fs';
import { ComfyDeploy } from "comfydeploy";

// Initialize ComfyDeploy client
const cd = new ComfyDeploy({
    bearer: process.env.COMFY_DEPLOY_API_KEY!,
});

const COMFY_API_BASE_URL = "https://api.comfydeploy.com"; // Or from env if you make it configurable
const isDevelopment = process.env.NODE_ENV === "development";

async function getEndpoint() {
    const headersList = await nextHeaders();
    const host = headersList.get("host") || "";
    // Default to http for local, x-forwarded-proto for deployed environments
    const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    let endpoint = `${protocol}://${host}`;

    if (isDevelopment && host.includes("localhost")) {
        const tunnelUrlFilePath = "tunnel_url.txt"; // Assuming localtunnel.mjs writes here
        try {
            const tunnelUrl = await fs.readFile(tunnelUrlFilePath, "utf-8");
            endpoint = tunnelUrl.trim();
            console.log("Using tunnel URL for webhook:", endpoint);
        } catch (error) {
            console.warn(
                `localtunnel: Failed to read tunnel URL from ${tunnelUrlFilePath}. Using host: ${endpoint}. Error: ${error}`,
            );
        }
    }
    return endpoint;
}

export async function POST(request: NextRequest) {
    const authResult = await auth();
    const userId = authResult.userId;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reqBody = await request.json();
    // For POD workflow, inputs are: logoUrl (will become base64), promptText, imageSize
    const { logoUrl, promptText, imageSize } = reqBody;

    if (!logoUrl || !promptText || !imageSize) {
        return NextResponse.json({ error: "Missing required fields: logoUrl, promptText, imageSize" }, { status: 400 });
    }

    const comfyInputs = {
        input_image: logoUrl, // This will be the base64 data URL from the frontend
        input_text: promptText,
        input_number: parseInt(imageSize, 10),
    };

    const webhookUrl = `${await getEndpoint()}/api/webhook?target_events=run.output,run.updated`;
    console.log("Webhook will be sent to:", webhookUrl);

    try {
        const response = await cd.run.deployment.queue({
            deploymentId: process.env.COMFY_DEPLOY_WF_DEPLOYMENT_ID!,
            webhook: webhookUrl,
            inputs: comfyInputs,
        });

        if (response && response.runId) {
            const runId = response.runId;
            // Store the run in the database
            await db.insert(runs).values({
                run_id: runId,
                user_id: userId,
                inputs: comfyInputs, 
            });
            return NextResponse.json({ run_id: runId });
        } else {
            console.error("ComfyDeploy SDK error: No runId in response or response is unexpected.", response);
            let errorMessage = "Failed to create run: Unexpected response from ComfyDeploy SDK.";
            if (typeof response === 'object' && response !== null && 'error' in response && typeof response.error === 'string') {
                errorMessage = `Failed to create run: ${response.error}`;
            }
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Error calling ComfyDeploy SDK or DB:", error);
        let detail = "Internal server error";
        if (error.message) {
            detail = error.message;
        }
        if (error.response && error.response.data && error.response.data.detail) {
            detail = error.response.data.detail;
        }
        return NextResponse.json({ error: detail }, { status: 500 });
    }
} 