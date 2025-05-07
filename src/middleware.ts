import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    '/', // Making the home page public for this example
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhook(.*)' // Webhooks should be public
]);

export default clerkMiddleware((authObj, req) => {
    if (!isPublicRoute(req)) {
        authObj.protect(); // Protect all other routes
    }
});

export const config = {
    matcher: ["/((?!.+.[w]+$|_next).*) ", "/", "/(api|trpc)(.*)"],
}; 