// localtunnel.mjs
import localtunnel from "localtunnel";
import tcpPortUsed from "tcp-port-used";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url'; // For ES modules

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;

async function runTunnel() {
    try {
        console.log(`Waiting for port ${port} to be in use...`);
        await tcpPortUsed.waitUntilUsed(port, 500, 45000); // Increased timeout
        console.log(`Port ${port} is now in use. Starting localtunnel...`);

        const tunnel = await localtunnel({ port: port, local_https: false });
        console.log(`Local tunnel running at: ${tunnel.url}`);

        const filePath = path.join(__dirname, "..", "tunnel_url.txt"); // Place it in project root
        fs.writeFileSync(filePath, tunnel.url, "utf8");
        console.log(`Tunnel URL written to ${filePath}`);

        tunnel.on('close', () => {
            console.log("Tunnel closed");
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        });
        tunnel.on('error', (err) => {
            console.error("Tunnel error:", err);
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        });

    } catch (err) {
        console.error("Could not start localtunnel or port not used:", err);
        process.exit(1);
    }
}

runTunnel();

// Keep process alive, but handle exits gracefully
process.on("exit", () => {
    // tunnel.close() might have already been called if tunnel object exists
    console.log("Localtunnel process exiting.");
});
process.on("SIGINT", () => process.exit());
process.on("SIGTERM", () => process.exit()); 