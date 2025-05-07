import { z, type TypeOf } from "zod";

const zodEnv = z.object({
    COMFY_DEPLOY_API_KEY: z.string().min(1, "COMFY_DEPLOY_API_KEY is required"),
    COMFY_DEPLOY_WF_DEPLOYMENT_ID: z.string().min(1, "COMFY_DEPLOY_WF_DEPLOYMENT_ID is required"),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_AUTH_TOKEN: z.string().optional(), // Optional for local SQLite

    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
    CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"), // Clerk uses this if you enable sign-ups
});

try {
    zodEnv.parse(process.env);
} catch (err) {
    if (err instanceof z.ZodError) {
        const { fieldErrors } = err.flatten();
        const errorMessage = Object.entries(fieldErrors)
            .map(([field, errors]) =>
                errors ? `${field}: ${errors.join(", ")}` : field,
            )
            .join("\n  ");
        console.error(`❌ Missing or invalid environment variables:\n  ${errorMessage}`);
        process.exit(1);
    }
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends TypeOf<typeof zodEnv> {}
    }
} 